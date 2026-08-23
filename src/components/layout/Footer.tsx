import React from 'react';
import { Shield, Lock, Activity } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface FooterProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onTryDemoClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onLoginClick,
  onSignupClick,
  onTryDemoClick,
}) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-slate-50 border-t border-white/10 dark:border-white/10 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-start mb-8">
          {/* Column 1: Founding Engineer */}
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
              Founding Engineer
            </span>
            <p className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Vangala Sricharan
            </p>
            <p className="text-[11px] text-slate-400">
              B.Tech CSE @ Marwadi University
            </p>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors text-left mt-1"
            >
              View Founder Dossier →
            </button>
          </div>

          {/* Column 2: System Telemetry Status */}
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
              System Telemetry
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></span>
              <p className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 font-mono">
                V3.1 Foundation Active
              </p>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
              <Shield className="w-3 h-3 text-blue-400" /> Supabase Secure Auth
            </p>
          </div>

          {/* Column 3: Contact & Channels */}
          <div className="flex flex-col gap-1 text-left sm:text-left lg:text-left">
            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
              Contact & Inquiries
            </span>
            <p className="text-sm text-slate-300 font-mono">
              sricharan@studenttwin.ai
            </p>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors text-left"
            >
              Send Inquiry Form →
            </button>
          </div>

          {/* Column 4: Plan & Quick Demo */}
          <div className="flex flex-col gap-1 text-left sm:text-left lg:text-left">
            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
              Default Plan Tier
            </span>
            <p className="text-sm font-bold text-blue-400">
              FREE FOUNDATION (₹0)
            </p>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={onTryDemoClick}
                className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
              >
                Demo Sandbox
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={onLoginClick}
                className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Theme & Currency notice */}
        <div className="pt-6 border-t border-white/5 dark:border-white/5 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-left">
            © {new Date().getFullYear()} Student Digital Twin OS. Currency strictly in Indian Rupees (₹).
          </p>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">Theme</span>
            <ThemeToggle id="footer-theme-toggle" />
          </div>
        </div>
      </div>
    </footer>
  );
};

