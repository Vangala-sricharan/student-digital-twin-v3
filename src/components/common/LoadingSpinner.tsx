import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-blue-500/30 border-t-blue-500 rounded-full animate-spin`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && (
        <span className="text-sm font-medium text-slate-400 animate-pulse">{label}</span>
      )}
    </div>
  );
};
