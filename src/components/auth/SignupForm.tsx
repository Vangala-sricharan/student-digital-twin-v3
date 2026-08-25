import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, UserPlus, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface SignupFormProps {
  initialEmail?: string;
  initialFullName?: string;
  onSwitchToLogin: (email?: string) => void;
  onBackToHome: () => void;
  onSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  initialEmail = '',
  initialFullName = '',
  onSwitchToLogin,
  onBackToHome,
  onSuccess,
}) => {
  const { signUpWithEmail, signInWithGoogle, isConfigured } = useAuth();
  const { enterDemo } = useDemo();

  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
    isExistingUser?: boolean;
    isNetworkFailure?: boolean;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (initialFullName) {
      setFullName(initialFullName);
    }
  }, [initialFullName]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const result = await signUpWithEmail(email.trim(), password, fullName.trim());

    setIsLoading(false);
    if (result.error) {
      const errMsg = result.error.message.toLowerCase();
      const isAlreadyExists = errMsg.includes('already') || 
                              errMsg.includes('exists') ||
                              errMsg.includes('registered');
      const isNetErr = errMsg.includes('unable to reach') ||
                       errMsg.includes('network') ||
                       errMsg.includes('connection') ||
                       errMsg.includes('fetch');
      setErrors({ 
        general: result.error.message,
        isExistingUser: isAlreadyExists,
        isNetworkFailure: isNetErr,
      });
    } else if (result.needsEmailConfirmation) {
      // Supabase project requires email confirmation
      setEmailConfirmationRequired(true);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    const result = await signInWithGoogle();
    if (result.error) {
      setIsGoogleLoading(false);
      const errMsg = result.error.message.toLowerCase();
      const isNetErr = errMsg.includes('unable to reach') ||
                       errMsg.includes('network') ||
                       errMsg.includes('connection') ||
                       errMsg.includes('fetch');
      setErrors({ 
        general: result.error.message,
        isNetworkFailure: isNetErr,
      });
    }
  };

  return (
    <Card className="w-full max-w-md p-8 relative border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
      {/* Back & Demo button */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="signup-back-home-btn"
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <button
          id="signup-quick-demo-btn"
          type="button"
          onClick={enterDemo}
          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Explore in Demo Mode
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
          Create Student Account
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
          Starts with Free Plan ₹0 · Zero credit card required
        </p>
      </div>

      {!isConfigured && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 dark:text-amber-300 light:text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">Supabase Environment Notice</p>
            <p className="mt-0.5 text-[11px]">
              Set <code className="font-mono text-amber-200">VITE_SUPABASE_URL</code> & <code className="font-mono text-amber-200">VITE_SUPABASE_ANON_KEY</code> to enable real cloud auth or use Demo Mode.
            </p>
          </div>
        </div>
      )}

      {emailConfirmationRequired ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Check Your Email
          </h3>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
            We sent a verification link to <strong className="text-blue-400">{email}</strong>. Please confirm your email address to complete your Student Twin activation.
          </p>
          <div className="pt-2">
            <Button
              id="signup-return-login-btn"
              variant="outline"
              size="sm"
              onClick={() => onSwitchToLogin(email.trim())}
              className="w-full"
            >
              Return to Log In
            </Button>
          </div>
        </div>
      ) : (
        <>
          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-300 light:text-rose-900 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="font-medium">{errors.general}</span>
              </div>

              {(errors.isExistingUser || errors.isNetworkFailure) && (
                <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                  {errors.isExistingUser && (
                    <button
                      type="button"
                      onClick={() => onSwitchToLogin(email.trim())}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3 h-3" /> Sign In Now
                    </button>
                  )}
                  {errors.isNetworkFailure && (
                    <button
                      type="button"
                      onClick={handleEmailSignup}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Retry Sign Up
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={enterDemo}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Try Demo Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Google OAuth signup */}
          <Button
            id="signup-google-btn"
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignup}
            isLoading={isGoogleLoading}
            className="w-full mb-5"
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 dark:border-slate-800 light:border-sky-200 w-full" />
            <span className="bg-slate-900 dark:bg-slate-900 light:bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
              Or with Email
            </span>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-3.5" noValidate>
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Patel"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                    errors.fullName
                      ? 'border-rose-500'
                      : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                  } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                    errors.email
                      ? 'border-rose-500'
                      : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                  } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
              >
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                    errors.password
                      ? 'border-rose-500'
                      : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                  } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border ${
                    errors.confirmPassword
                      ? 'border-rose-500'
                      : 'border-slate-800 dark:border-slate-800 light:border-sky-300 focus:border-blue-500'
                  } text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              id="signup-submit-btn"
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-3"
            >
              Create Free Account (₹0)
            </Button>
          </form>
        </>
      )}

      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
        Already have an account?{' '}
        <button
          id="signup-switch-login-btn"
          type="button"
          onClick={() => onSwitchToLogin(email.trim())}
          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </Card>
  );
};
