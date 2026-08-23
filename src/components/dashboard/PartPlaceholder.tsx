import React from 'react';
import { LucideIcon, ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface PartPlaceholderProps {
  icon: LucideIcon;
  title: string;
  partNumber: 2 | 3 | 4;
  partTitle: string;
  description: string;
  upcomingFeatures: string[];
  onBackToDashboard: () => void;
}

export const PartPlaceholder: React.FC<PartPlaceholderProps> = ({
  icon: Icon,
  title,
  partNumber,
  partTitle,
  description,
  upcomingFeatures,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <Badge variant="blue" size="sm">
          Part {partNumber} Architecture
        </Badge>
      </div>

      <Card className="p-8 sm:p-12 text-center relative border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-5">
          <Icon className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
          {title}
        </h2>

        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Scheduled for Part {partNumber}: {partTitle}
          </span>
        </div>

        <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        {/* Feature list preview */}
        <div className="max-w-md mx-auto text-left bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/80 p-5 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-sky-200 mb-8">
          <h4 className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Planned Module Capabilities:
          </h4>
          <ul className="space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-700">
            {upcomingFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          id={`placeholder-back-btn-${title.toLowerCase().replace(/\s+/g, '-')}`}
          variant="primary"
          size="md"
          onClick={onBackToDashboard}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
};
