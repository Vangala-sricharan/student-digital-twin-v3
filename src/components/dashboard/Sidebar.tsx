import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  Users,
  Code2,
  FolderGit2,
  Award,
  Target,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Bot,
  FileText,
  FileCheck2,
  BookOpen,
  Compass,
  Briefcase,
  Globe,
  Zap,
  Github,
  Linkedin,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavTab, UserProfile } from '../../types';
import { formatINR } from '../../utils/formatters';
import { useStudentTwin } from '../../contexts/StudentTwinContext';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  isDemo?: boolean;
  userProfile?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isDemo = false,
  userProfile: propUserProfile,
}) => {
  const { userProfile: contextUserProfile } = useStudentTwin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeUserProfile = propUserProfile || contextUserProfile;

  const getSubscriptionBadge = (profile: UserProfile | null): string => {
    if (!profile) return formatINR(0);

    if ((profile.plan as string) === 'campus') {
      return 'Contact Us';
    }

    if (
      profile.plan === 'pro_monthly' ||
      (profile.plan === 'pro' && profile.billingCycle === 'monthly')
    ) {
      return formatINR(499);
    }

    if (
      profile.plan === 'pro_annual' ||
      profile.plan === 'annual' ||
      (profile.plan === 'pro' && (!profile.billingCycle || profile.billingCycle === 'annual'))
    ) {
      return formatINR(1499);
    }

    return formatINR(0);
  };

  const subscriptionPriceBadge = getSubscriptionBadge(activeUserProfile);

  const twinNavItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Foundation', icon: User },
    { id: 'students', label: 'Student Twins', icon: Users },
    { id: 'skills', label: 'Skills & DSA', icon: Code2 },
    { id: 'projects', label: 'Projects & Work', icon: FolderGit2 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'career-goals', label: 'Career Goals', icon: Target },
  ];

  const aiCareerOsItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'assistant', label: 'Career Assistant', icon: Bot, badge: 'AI' },
    { id: 'portfolio', label: 'AI Portfolio', icon: Globe, badge: 'PRO' },
    { id: 'project-analyzer', label: 'Project Auditor', icon: FolderGit2, badge: 'AI' },
    { id: 'github-readiness', label: 'GitHub Audit', icon: Github, badge: 'AI' },
    { id: 'linkedin-readiness', label: 'LinkedIn Audit', icon: Linkedin, badge: 'AI' },
    { id: 'resume-builder', label: 'Resume Builder', icon: FileText, badge: 'AI' },
    { id: 'resume-analyzer', label: 'Resume & ATS', icon: FileCheck2, badge: 'AI' },
    { id: 'syllabus-analyzer', label: 'Syllabus Prep', icon: BookOpen, badge: 'AI' },
    { id: 'career-roadmap', label: '30-60-90 Roadmap', icon: Compass, badge: 'AI' },
    { id: 'internship-readiness', label: 'Internship Ready', icon: Briefcase, badge: 'AI' },
    { id: 'career-simulator', label: 'Career Simulator', icon: Zap, badge: 'AI' },
  ];

  const systemNavItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'subscription', label: 'Subscription', icon: CreditCard, badge: subscriptionPriceBadge },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[72px] p-2.5' : 'w-64 p-3.5'
      } shrink-0 hidden lg:flex flex-col justify-between border-r border-white/10 dark:border-white/10 light:border-slate-200 bg-[#050505] dark:bg-[#050505] light:bg-slate-50 transition-all duration-200 min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto select-none`}
    >
      <div className="space-y-4">
        {/* Logo / Twin OS Brand & Collapse/Expand Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} px-1 py-1`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm shrink-0">
              SDT
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="font-bold text-xs uppercase tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 block truncate">
                  Digital Twin OS
                </span>
                <span className="text-[9px] text-blue-400 font-mono block truncate">
                  {isDemo ? 'DEMO SHOWCASE' : 'AI CAREER OS V3'}
                </span>
              </div>
            )}
          </div>

          {/* Sidebar Collapse/Expand Arrow Button */}
          <button
            id="sidebar-collapse-btn"
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white dark:text-slate-400 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200 border border-white/10 dark:border-white/10 light:border-slate-300 transition-colors cursor-pointer shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* AI CAREER OS INTELLIGENCE */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                AI Career OS
              </p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                11 ENGINES
              </span>
            </div>
          )}
          {aiCareerOsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-1.5'
                } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && !isActive && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CORE DIGITAL TWIN */}
        <div className="space-y-0.5 pt-3 border-t border-white/10 dark:border-white/10 light:border-slate-200">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-500 mb-1.5">
              Twin Records
            </p>
          )}
          {twinNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-1.5'
                } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* SYSTEM NAVIGATION */}
        <div className="space-y-0.5 pt-3 border-t border-white/10 dark:border-white/10 light:border-slate-200">
          {!isCollapsed && (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-500 mb-1.5">
              System
            </p>
          )}
          {systemNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-1.5'
                } rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && !isActive && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout button at bottom of sidebar */}
      <div className="pt-3 mt-4 border-t border-white/10 dark:border-white/10 light:border-slate-200">
        <button
          id="sidebar-logout-btn"
          type="button"
          onClick={onLogout}
          title={isCollapsed ? (isDemo ? 'Exit Demo Showcase' : 'Sign Out') : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2'
          } rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{isDemo ? 'Exit Demo Showcase' : 'Sign Out'}</span>}
        </button>
      </div>
    </aside>
  );
};

