import React from 'react';

export interface BadgeProps {
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  size = 'md',
  children,
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 light:bg-sky-100 light:text-sky-800 light:border-sky-300',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 light:bg-emerald-100 light:text-emerald-800 light:border-emerald-300',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 light:bg-amber-100 light:text-amber-800 light:border-amber-300',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40 light:bg-rose-100 light:text-rose-800 light:border-rose-300',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40 light:bg-purple-100 light:text-purple-800 light:border-purple-300',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60 light:bg-slate-100 light:text-slate-700 light:border-slate-300',
  };

  const dotColors = {
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className} whitespace-nowrap`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />}
      {children}
    </span>
  );
};
