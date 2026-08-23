import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer active:scale-[0.98] select-none';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs min-h-[32px] gap-1.5',
    md: 'px-4.5 py-2.5 text-sm min-h-[40px] gap-2',
    lg: 'px-6 py-3.5 text-base min-h-[46px] gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 border border-blue-500/40 focus:ring-blue-500',
    secondary:
      'bg-white/5 hover:bg-white/10 text-slate-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-100 border border-white/10 dark:border-white/10 light:bg-slate-100 light:text-slate-800 light:hover:bg-slate-200 light:border-slate-300 focus:ring-slate-400',
    outline:
      'border border-white/10 hover:border-white/20 bg-transparent text-slate-200 hover:bg-white/5 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/5 light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100 focus:ring-blue-500',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white dark:hover:bg-white/5 dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900 focus:ring-slate-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500 border border-rose-500/30',
    gradient:
      'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-900/30 border border-blue-400/30 focus:ring-blue-500',
    white:
      'bg-white text-black font-semibold hover:bg-slate-200 shadow-sm focus:ring-white border border-transparent',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

