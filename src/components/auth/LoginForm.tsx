import React, { useState } from 'react';
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onBackToHome: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onForgotPassword,
  onBackToHome,
  onSuccess,
}) => {
  const { signInWithEmail, signInWithGoogle, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    const result = await signInWithEmail(email.trim(), password);

    setIsLoading(false);
    if (result.error) {
      setErrors({ general: result.error.message });
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    const result = await signInWithGoogle();
    if (result.error) {
      setIsGoogleLoading(false);
      setErrors({ general: result.error.message });
    }
  };

  return (
    <Card className="w-full max-w-md p-8 relative border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
      {/* Back button */}
      <button
        id="login-back-home-btn"
        type="button"
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-800 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
          Welcome Back
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
          Sign in to your Student Digital Twin OS
        </p>
      </div>

      {!isConfigured && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 dark:text-amber-300 light:text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold">Supabase Environment Notice</p>
            <p className="mt-0.5 text-[11px]">
              Set <code className="font-mono text-amber-200">VITE_SUPABASE_URL</code> & <code className="font-mono text-amber-200">VITE_SUPABASE_ANON_KEY</code> in settings or use Demo Mode to preview the OS.
            </p>
          </div>
        </div>
      )}

      {errors.general && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Google OAuth button */}
      <Button
        id="login-google-btn"
        type="button"
        variant="secondary"
        size="md"
        onClick={handleGoogleLogin}
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

      <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
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
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700"
            >
              Password
            </label>
            <button
              id="login-forgot-password-btn"
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
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

        <Button
          id="login-submit-btn"
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
        Don't have an account?{' '}
        <button
          id="login-switch-signup-btn"
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
        >
          Create Student Twin Account
        </button>
      </div>
    </Card>
  );
};
