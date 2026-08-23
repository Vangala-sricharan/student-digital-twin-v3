import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'interactive' | 'outline' | 'density';
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  glow = false,
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200';

  const variantStyles = {
    default:
      'bg-[#0a0a0c] border border-white/10 text-slate-100 dark:bg-[#0a0a0c] dark:border-white/10 dark:text-slate-100 light:bg-white light:border-slate-200 light:text-slate-900 light:shadow-sm',
    glass:
      'bg-white/5 backdrop-blur-xl border border-white/10 text-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-slate-100 light:bg-white/80 light:backdrop-blur-md light:border-slate-200 light:text-slate-900 shadow-xl',
    interactive:
      'bg-[#0a0a0c]/90 border border-white/10 hover:border-blue-500/50 hover:bg-white/5 dark:bg-[#0a0a0c]/90 dark:border-white/10 dark:hover:border-blue-500/50 dark:hover:bg-white/5 light:bg-white light:border-slate-200 light:hover:border-blue-500 light:hover:shadow-md cursor-pointer',
    density:
      'p-3 bg-white/5 border border-white/5 rounded-xl text-slate-100 dark:bg-white/5 dark:border-white/5 light:bg-slate-50 light:border-slate-200 light:text-slate-900',
    outline:
      'border border-white/10 dark:border-white/10 bg-transparent light:border-slate-200 light:bg-transparent',
  };

  const glowStyle = glow ? 'shadow-lg shadow-blue-500/15 border-blue-500/40' : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${glowStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

