import React from 'react';
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
  Zap,
  Github,
  Linkedin,
  ShieldAlert,
} from 'lucide-react';
import { NavTab } from '../../types';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onLogout: () => void;
  isDemo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isDemo = false,
}) => {
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
    { id: 'subscription', label: 'Subscription', icon: CreditCard, badge: '₹0' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between border-r border-white/10 dark:border-white/10 light:border-slate-200 bg-[#050505] dark:bg-[#050505] light:bg-slate-50 p-3.5 transition-colors min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-4">
        {/* Logo / Twin OS Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
            SDT
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 block">
              Digital Twin OS
            </span>
            <span className="text-[9px] text-blue-400 font-mono block">
              {isDemo ? 'DEMO SHOWCASE' : 'AI CAREER OS V3'}
            </span>
          </div>
        </div>

        {/* AI CAREER OS INTELLIGENCE */}
        <div className="space-y-0.5">
          <div className="px-2.5 flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              AI Career OS
            </p>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
              10 ENGINES
            </span>
          </div>
          {aiCareerOsItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && !isActive && (
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
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-500 mb-1.5">
            Twin Records
          </p>
          {twinNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* SYSTEM NAVIGATION */}
        <div className="space-y-0.5 pt-3 border-t border-white/10 dark:border-white/10 light:border-slate-200">
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 light:text-slate-500 mb-1.5">
            System
          </p>
          {systemNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isActive && (
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
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{isDemo ? 'Exit Demo Showcase' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
};

