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
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
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
      async (_event, currentSession) => {
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
    const fullName = authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name || 
                     authUser.email?.split('@')[0] || 
                     'Student User';
                     
    const profile: UserProfile = {
      id: authUser.id,
      email: authUser.email || '',
      fullName: fullName,
      avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      plan: 'free', // Every new authenticated user explicitly starts on FREE PLAN
      createdAt: authUser.created_at || new Date().toISOString(),
      isDemo: false,
    };

    setUserProfile(profile);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to sign in') };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.') 
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      // Check if email confirmation is required by checking if user exists but session is null
      const needsConfirmation = !data.session && Boolean(data.user);

      return { error: null, needsEmailConfirmation: needsConfirmation };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to sign up') };
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
