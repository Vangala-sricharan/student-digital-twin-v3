import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && initialEmail) {
      setEmail(initialEmail);
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await resetPassword(email.trim());
    setIsLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsSuccess(true);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" maxWidth="sm">
      {isSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Password Reset Email Sent
          </h3>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
            If an account exists for <strong className="text-blue-400">{email}</strong>, you will receive password reset instructions.
          </p>
          <Button
            id="forgot-password-done-btn"
            variant="primary"
            size="sm"
            onClick={handleClose}
            className="w-full"
          >
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600">
            Enter your student email address and we'll send you instructions to reset your password.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              id="reset-cancel-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              id="reset-submit-btn"
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="flex-1"
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
