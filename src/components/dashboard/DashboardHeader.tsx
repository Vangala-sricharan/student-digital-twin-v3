import React, { useState } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  CreditCard,
  ChevronDown,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { Badge } from '../common/Badge';
import { UserProfile, NavTab } from '../../types';
import { PRICING_PLANS } from '../../constants/pricing';
import { formatINR } from '../../utils/formatters';
import { useStudentTwin } from '../../contexts/StudentTwinContext';

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
  const { uploadDataToCloud, isSyncing, syncStatus, syncMessage } = useStudentTwin();
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

  const handleUploadCloud = async () => {
    if (isDemo) return;
    await uploadDataToCloud();
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

          {/* Right: Cloud Sync, Plan badge, Theme toggle & User Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Upload to Cloud Button (Production User Sync) */}
            {!isDemo && (
              <button
                id="header-cloud-sync-btn"
                type="button"
                onClick={handleUploadCloud}
                disabled={isSyncing}
                title={
                  syncStatus === 'success'
                    ? 'Cloud Sync Successful: Your Student Twin data is safely stored in the cloud.'
                    : syncStatus === 'error'
                    ? syncMessage || 'Cloud Sync Failed — Please try again.'
                    : 'Upload your current profile, projects, skills, and twin data to Supabase'
                }
                className={`hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
                  isSyncing
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 opacity-80'
                    : syncStatus === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : syncStatus === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 light:bg-slate-100 light:hover:bg-slate-200 border-white/10 dark:border-white/10 light:border-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-700'
                }`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : syncStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cloud Sync Successful</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sync Failed</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload to Cloud</span>
                  </>
                )}
              </button>
            )}

            {/* Active Plan badge */}
            <span className={`hidden xl:inline-flex items-center h-9 px-2.5 rounded-lg text-[10px] font-mono font-semibold border select-none ${
              userProfile?.subscriptionStatus === 'pending_verification'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : userProfile?.plan === 'pro_monthly' || (userProfile?.plan === 'pro' && userProfile?.billingCycle === 'monthly')
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : userProfile?.plan === 'pro_annual' || userProfile?.plan === 'annual' || userProfile?.plan === 'pro'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-white/5 border-white/10 dark:bg-white/5 dark:border-white/10 light:bg-slate-100 light:border-slate-300 text-slate-400'
            }`}>
              {userProfile?.subscriptionStatus === 'pending_verification'
                ? userProfile?.plan === 'pro_monthly' || userProfile?.billingCycle === 'monthly'
                  ? `STUDENT PRO (${formatINR(499)}) — PENDING`
                  : `STUDENT PRO (${formatINR(1499)}) — PENDING`
                : userProfile?.plan === 'pro_monthly' || (userProfile?.plan === 'pro' && userProfile?.billingCycle === 'monthly')
                ? `STUDENT PRO — MONTHLY (${formatINR(499)})`
                : userProfile?.plan === 'pro_annual' || userProfile?.plan === 'annual' || (userProfile?.plan === 'pro' && !userProfile?.billingCycle) || (userProfile?.plan === 'pro' && userProfile?.billingCycle === 'annual')
                ? `STUDENT PRO — ANNUAL (${formatINR(1499)})`
                : `FREE PLAN (${formatINR(0)})`}
            </span>

            <ThemeToggle id="dashboard-theme-toggle" />

            {/* Account Menu */}
            <div className="relative">
              <button
                id="dashboard-user-menu-btn"
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="h-9 inline-flex items-center gap-2 px-2 sm:px-2.5 rounded-lg border border-white/10 dark:border-white/10 light:border-slate-300 bg-white/5 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 light:bg-slate-100 light:hover:bg-slate-200 transition-colors cursor-pointer select-none"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 dark:bg-blue-600 light:bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {initials || <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 truncate max-w-[100px] sm:max-w-[130px] md:max-w-[160px]">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 light:text-slate-600 shrink-0" />
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

