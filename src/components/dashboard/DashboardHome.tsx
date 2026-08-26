import React from 'react';
import {
  User,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Code2,
  FolderGit2,
  Target,
  Award,
  Bot,
  FileText,
  FileCheck2,
  BookOpen,
  Compass,
  Briefcase,
  Zap,
  Github,
  Linkedin,
  UploadCloud,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, NavTab } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useStudentTwin } from '../../contexts/StudentTwinContext';

interface DashboardHomeProps {
  userProfile: UserProfile | null;
  onNavigate: (tab: NavTab) => void;
  isDemo?: boolean;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  userProfile,
  onNavigate,
  isDemo = false,
}) => {
  const { uploadDataToCloud, isSyncing, syncStatus, syncMessage } = useStudentTwin();
  const displayName = userProfile?.fullName || 'Student';

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <Card className="p-6 sm:p-8 border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isDemo ? 'amber' : 'blue'} size="sm" dot>
                {isDemo ? 'DEMO SHOWCASE' : 'AI CAREER OS ACTIVE'}
              </Badge>
              <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
                Student Twin V3.1
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 mt-1 max-w-2xl">
              {isDemo
                ? "You are exploring the creator's isolated demo showcase with active AI intelligence engines and verified evidence."
                : "Your Student Digital Twin AI Career OS is ready. Run evidence-based audits, build ATS-optimized resumes, and simulate placement milestones."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-100/60 border border-slate-800 dark:border-slate-800 light:border-sky-200 text-center sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Current Plan
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {isDemo ? 'DEMO PRO' : 'FREE PLAN (₹0)'}
              </span>
            </div>

            {!isDemo && (
              <Button
                id="home-cloud-sync-btn"
                variant={syncStatus === 'success' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => uploadDataToCloud()}
                disabled={isSyncing}
                isLoading={isSyncing}
                leftIcon={
                  syncStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : syncStatus === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                  )
                }
              >
                {isSyncing
                  ? 'Uploading...'
                  : syncStatus === 'success'
                  ? 'Cloud Sync Successful'
                  : syncStatus === 'error'
                  ? 'Retry Cloud Upload'
                  : 'Upload to Cloud'}
              </Button>
            )}

            <Button
              id="dashboard-assistant-btn"
              variant="primary"
              size="md"
              onClick={() => onNavigate('assistant')}
              rightIcon={<Bot className="w-4 h-4" />}
            >
              Ask AI Career Assistant
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Career OS Intelligence Suite Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 dark:text-slate-100 light:text-slate-900">
              AI Career OS Intelligence Suite
            </h2>
          </div>
          <Badge variant="blue" size="sm">
            EVIDENCE-BASED AI
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            variant="interactive"
            onClick={() => onNavigate('resume-builder')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                AI Resume Builder
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Multi-section builder prefilled with your verified projects and STAR bullets.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 mt-4">
              Open Builder <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('resume-analyzer')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Resume & ATS Evaluator
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                5-dimension rubric scoring, keyword gap analysis, and ATS pass rates.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-4">
              Audit Resume <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('project-analyzer')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-500/20">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Project Proof Auditor
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Deep audit of GitHub commits, architecture depth, test coverage, and authenticity.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-4">
              Audit Projects <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('github-readiness')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-100 mb-3 border border-slate-700">
                <Github className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                GitHub Readiness Audit
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Live API extraction of repositories, commit velocity, and recruiter appeal.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mt-4">
              Audit GitHub <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('linkedin-readiness')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#0077b5]/20 flex items-center justify-center text-[#0077b5] mb-3 border border-[#0077b5]/30">
                <Linkedin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                LinkedIn Profile Readiness
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                9-category rubric evaluating headline positioning and inbound recruiter appeal.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0077b5] flex items-center gap-1 mt-4">
              Audit LinkedIn <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('career-roadmap')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                30-60-90 Day Execution Roadmap
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Step-by-step milestones, weekly deliverables, and interactive task checklists.
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 mt-4">
              View Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('internship-readiness')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-3 border border-violet-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Internship Placement Readiness
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Aggregated 5-pillar portfolio scoring against industry placement benchmarks.
              </p>
            </div>
            <span className="text-xs font-semibold text-violet-400 flex items-center gap-1 mt-4">
              Check Placement Score <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('career-simulator')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                What-If Career Simulator
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Simulate readiness score boosts from learning new stacks and shipping projects.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 mt-4">
              Run Simulation <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('syllabus-analyzer')}
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3 border border-rose-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Syllabus & Curriculum Prep
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Transforms university coursework into structured interview prep sequences.
              </p>
            </div>
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-4">
              Analyze Coursework <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>
        </div>
      </div>

      {/* Core Twin Records Quick Links */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 dark:text-slate-100 light:text-slate-900">
              Digital Twin Records
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            variant="interactive"
            onClick={() => onNavigate('profile')}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Foundation</h4>
                <p className="text-[11px] text-slate-400">Personal metadata</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('skills')}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Skills & DSA</h4>
                <p className="text-[11px] text-slate-400">Verified taxonomy</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('projects')}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Projects</h4>
                <p className="text-[11px] text-slate-400">Proof of work</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Card>

          <Card
            variant="interactive"
            onClick={() => onNavigate('career-goals')}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Career Goals</h4>
                <p className="text-[11px] text-slate-400">Role targets</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Card>
        </div>
      </div>
    </div>
  );
};
