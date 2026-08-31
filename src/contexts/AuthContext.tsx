import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { getAppUrl } from '../utils/appConfig';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logAuthProviderDiag = (event: string, authUser: User | null, authSession: Session | null) => {
    const provider = authUser?.app_metadata?.provider || authUser?.identities?.[0]?.provider || 'email';
    const userId = authUser?.id || 'none';
    const sessionPresent = Boolean(authSession);
    const accessTokenPresent = Boolean(authSession?.access_token);
    const tokenBytes = authSession?.access_token ? new TextEncoder().encode(authSession.access_token).length : 0;
    const jwtSegments = authSession?.access_token ? authSession.access_token.split('.').length : 0;
    const expiresAt = authSession?.expires_at ? new Date(authSession.expires_at * 1000).toISOString() : 'none';
    const tokenExpired = authSession?.expires_at ? Date.now() / 1000 >= authSession.expires_at : false;

    console.log('[AUTH PROVIDER DIAGNOSTIC]', {
      provider,
      userId,
      sessionPresent,
      accessTokenPresent,
      tokenBytes,
      jwtSegments,
      tokenExpired,
      expiresAt,
      authEvent: event,
      hydrationComplete: true,
    });
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Supabase Auth] getInitialSession error:', {
            message: error.message,
            status: error.status,
            code: (error as any).code || (error as any).name,
          });
          throw error;
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          logAuthProviderDiag('INITIAL_SESSION', initialSession?.user ?? null, initialSession);
          if (initialSession?.user) {
            setupUserProfile(initialSession.user);
          } else {
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.warn('Error fetching Supabase session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        logAuthProviderDiag(event, currentSession?.user ?? null, currentSession);
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            setupUserProfile(currentSession.user);
          } else {
            setUserProfile(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Construct a clean, isolated profile for the real authenticated user
  const setupUserProfile = (authUser: User) => {
    let cachedProfile: any = null;
    try {
      const raw = localStorage.getItem(`sdt_user_${authUser.id}_profile`);
      if (raw) cachedProfile = JSON.parse(raw);
    } catch {}

    const fullName = authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name || 
                     cachedProfile?.fullName ||
                     authUser.email?.split('@')[0] || 
                     'Student User';

    const savedPlan = authUser.user_metadata?.plan || cachedProfile?.plan || 'free';
    const billingCycle = authUser.user_metadata?.billing_cycle || cachedProfile?.billingCycle;
    const subscriptionStatus = authUser.user_metadata?.subscription_status || cachedProfile?.subscriptionStatus;
    const subscriptionDetails = authUser.user_metadata?.subscription_data || cachedProfile?.subscriptionDetails;
    const effectiveProfileImage =
      authUser.user_metadata?.profile_image_url ||
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      cachedProfile?.profileImageUrl ||
      cachedProfile?.avatarUrl ||
      '';
                     
    const profile: UserProfile = {
      id: authUser.id,
      email: authUser.email || cachedProfile?.email || '',
      fullName: fullName,
      avatarUrl: effectiveProfileImage,
      profileImageUrl: effectiveProfileImage,
      plan: savedPlan,
      billingCycle: billingCycle,
      subscriptionStatus: subscriptionStatus,
      subscriptionDetails: subscriptionDetails,
      createdAt: authUser.created_at || cachedProfile?.createdAt || new Date().toISOString(),
      isDemo: false,
    };

    setUserProfile(profile);
  };

  const formatAuthError = (error: any): string => {
    if (!error) return 'An unknown error occurred.';
    const msg = (error.message || String(error)).toLowerCase();
    const code = ((error as any).code || (error as any).name || '').toLowerCase();

    if (
      code === 'authretryablefetcherror' || 
      code === 'fetcherror' ||
      msg.includes('failed to fetch') || 
      msg.includes('networkerror') || 
      msg.includes('network error') ||
      msg.includes('fetch error') || 
      error.status === 0
    ) {
      return 'Unable to reach the authentication service. Please check your network connection or try Demo Mode.';
    }
    if (msg.includes('invalid login credentials') || code === 'invalid_credentials') {
      return 'Invalid email or password. If you haven\'t created an account yet, please sign up.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Email address not confirmed yet. Please check your email inbox for the verification link.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists') || code === 'user_already_exists') {
      return 'An account with this email already exists. Please log in instead.';
    }
    if (msg.includes('too many requests') || msg.includes('rate limit') || code.includes('rate_limit')) {
      return 'Too many login attempts. Please wait a moment before trying again.';
    }
    if (msg.includes('password should be at least') || msg.includes('weak password')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }

    return error.message || 'Authentication failed. Please try again.';
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log('[Supabase Auth] Attempting signInWithPassword for email:', cleanEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.error('[Supabase Auth] signIn error details:', {
          message: error.message,
          status: error.status,
          code: (error as any).code || (error as any).name,
        });

        const userMessage = formatAuthError(error);
        return { error: new Error(userMessage) };
      }

      console.log('[Supabase Auth] signIn success! Authenticated user ID:', data.user?.id);
      if (data.session) {
        setSession(data.session);
      }
      if (data.user) {
        setUser(data.user);
        setupUserProfile(data.user);
        logAuthProviderDiag('SIGNED_IN_EMAIL', data.user, data.session);
      }
      setIsLoading(false);

      return { error: null };
    } catch (err: any) {
      console.error('[Supabase Auth] Unexpected signIn exception:', err);
      const userMessage = formatAuthError(err);
      return { error: new Error(userMessage) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log('[Supabase Auth] Attempting signUp for email:', cleanEmail);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            plan: 'free',
          },
        },
      });

      if (error) {
        console.error('[Supabase Auth] signUp error details:', {
          message: error.message,
          status: error.status,
          code: (error as any).code || (error as any).name,
        });
        const userMessage = formatAuthError(error);
        return { error: new Error(userMessage) };
      }

      console.log('[Supabase Auth] signUp response: User ID:', data.user?.id, 'Session active:', Boolean(data.session));

      if (data.session) {
        setSession(data.session);
      }
      if (data.user) {
        setUser(data.user);
        setupUserProfile(data.user);
        logAuthProviderDiag('SIGNED_UP_EMAIL', data.user, data.session);
      }

      // Check if email confirmation is required by checking if user exists but session is null
      const needsConfirmation = !data.session && Boolean(data.user);

      return { error: null, needsEmailConfirmation: needsConfirmation };
    } catch (err: any) {
      console.error('[Supabase Auth] Unexpected signUp exception:', err);
      const userMessage = formatAuthError(err);
      return { error: new Error(userMessage) };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    try {
      const appUrl = getAppUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: appUrl,
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to initialize Google OAuth') };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    try {
      const appUrl = getAppUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to send password reset email') };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error during Supabase signOut:', err);
      }
    }
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        profile: userProfile,
        isAuthenticated: Boolean(user),
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
