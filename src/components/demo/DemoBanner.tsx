import React from 'react';
import { Sparkles, LogOut, UserPlus, ShieldAlert } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface DemoBannerProps {
  onCreateAccount: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onCreateAccount }) => {
  const { exitDemo } = useDemo();

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-blue-950/80 to-amber-950/80 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 backdrop-blur-md sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Badge variant="amber" size="sm" dot>
            DEMO MODE — CREATOR SHOWCASE
          </Badge>
          <span className="font-medium text-slate-200">
            Previewing Creator Twin: <strong className="text-amber-300">Vangala Sricharan — Demo</strong> (Marwadi University)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="demo-create-real-account-btn"
            variant="primary"
            size="sm"
            onClick={onCreateAccount}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            className="text-xs h-7 min-h-[30px] px-3 bg-blue-600 hover:bg-blue-500"
          >
            Create Real Account
          </Button>

          <Button
            id="demo-exit-btn"
            variant="outline"
            size="sm"
            onClick={exitDemo}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            className="text-xs h-7 min-h-[30px] px-3 border-amber-500/40 text-amber-300 hover:bg-amber-950/50 hover:text-amber-100"
          >
            Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
};
