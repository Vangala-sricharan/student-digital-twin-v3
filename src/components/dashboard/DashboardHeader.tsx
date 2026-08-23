import React, { useState } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../common/Badge';
import { UserProfile, NavTab } from '../../types';
import { PRICING_PLANS } from '../../constants/pricing';
import { formatINR } from '../../utils/formatters';

interface DashboardHeaderProps {
  userProfile: UserProfile | null;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  isDemo?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userProfile,
  activeTab,
  onTabChange,
  onLogout,
  isDemo = false,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const displayName = userProfile?.fullName || 'Student User';
  const displayEmail = userProfile?.email || '';
  const initials = (displayName || 'ST')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  const handleTabSelect = (tab: NavTab) => {
    onTabChange(tab);
    setMobileNavOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#050505]/90 dark:bg-[#050505]/90 light:bg-white/90 backdrop-blur-md border-b border-white/10 dark:border-white/10 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Mobile Drawer Trigger & Current View Title */}
          <div className="flex items-center gap-3">
            <button
              id="dashboard-mobile-menu-btn"
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle navigation drawer"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 uppercase tracking-tight flex items-center gap-2">
                {activeTab.replace('-', ' ')}
                {isDemo && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    DEMO
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right: Plan badge, Theme toggle & User Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Active Plan badge */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-blue-400">
              {userProfile?.plan === 'pro' ? `PRO PLAN (${formatINR(PRICING_PLANS.pro.annualPrice)}/yr)` : `FREE PLAN (${formatINR(0)})`}
            </span>

            <ThemeToggle id="dashboard-theme-toggle" />

            {/* Account Menu */}
            <div className="relative">
              <button
                id="dashboard-user-menu-btn"
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-800 border border-white/10 flex items-center justify-center text-white font-bold text-xs">
                  {initials || <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 block truncate max-w-[120px]">
                    {displayName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {displayEmail}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleTabSelect('profile')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabSelect('subscription')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      Subscription Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabSelect('settings')}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Settings & Auth
                    </button>
                  </div>

                  <div className="pt-1 border-t border-white/10">
                    <button
                      id="header-logout-btn"
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {isDemo ? 'Exit Demo' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#050505]/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Main Menu
            </p>
            <button
              type="button"
              onClick={() => handleTabSelect('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('profile')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              My Profile
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('students')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Student Profiles (Part 2)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('skills')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'skills' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Skills (Part 2)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('projects')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Projects (Part 2)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('achievements')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'achievements' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Achievements (Part 2)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('career-goals')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'career-goals' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Career Goals (Part 2)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('analytics')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Analytics (Part 3)
            </button>
          </div>

          <div className="space-y-1 pt-3 border-t border-white/10">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              System
            </p>
            <button
              type="button"
              onClick={() => handleTabSelect('subscription')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300"
            >
              Subscription (₹)
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('settings')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10"
            >
              {isDemo ? 'Exit Demo' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

