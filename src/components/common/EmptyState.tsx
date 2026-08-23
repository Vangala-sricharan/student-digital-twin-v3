import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 light:border-sky-200 bg-slate-950/30 dark:bg-slate-950/30 light:bg-sky-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 light:bg-sky-100 flex items-center justify-center text-blue-400 dark:text-blue-400 light:text-blue-600 mb-4 border border-blue-500/20">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          leftIcon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
