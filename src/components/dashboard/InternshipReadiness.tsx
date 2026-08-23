import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  Code2,
  FileText,
  Globe,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { InternshipReadinessResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface InternshipReadinessProps {
  isDemo?: boolean;
}

export const InternshipReadiness: React.FC<InternshipReadinessProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile, skills, projects, achievements, careerGoals } = useStudentTwin();

  const [analysisResult, setAnalysisResult] = useState<InternshipReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load cached analysis on profile switch
  useEffect(() => {
    if (!activeStudentProfile) return;
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const cached = aiService.getSavedEntityAnalysis<InternshipReadinessResult>(
      userId,
      'internship',
      activeStudentProfile.id
    );
    if (cached) {
      setAnalysisResult(cached);
    } else {
      setAnalysisResult(null);
    }
  }, [activeStudentProfile?.id, user?.id, isDemo]);

  const handleRunEvaluation = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeInternshipReadiness({
      activeProfile: activeStudentProfile,
      skills,
      projects,
      achievements,
      careerGoals,
      userId,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setAnalysisResult(res.data);
    }
  };

  const getReadinessColor = (level: string) => {
    if (level === 'Highly Competitive' || level === 'Internship Ready') {
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
    if (level === 'Approaching Readiness') {
      return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    }
    if (level === 'Early Preparation') {
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    }
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Internship Readiness Evaluator
                </h1>
                <Badge variant="purple" size="sm">
                  PORTFOLIO & PLACEMENT AUDIT
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Evaluates active profile, verified skills, projects, and online presence to compute placement readiness.
              </p>
            </div>
          </div>

          <Button
            id="evaluate-internship-readiness-btn"
            variant="primary"
            size="md"
            onClick={handleRunEvaluation}
            disabled={isLoading}
            className="bg-violet-600 hover:bg-violet-500"
            leftIcon={
              isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
          >
            {isLoading ? 'Auditing Portfolio...' : 'Run Internship Readiness Audit'}
          </Button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>

      {/* Results View */}
      {analysisResult ? (
        <div className="space-y-6">
          {/* Main Score Card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Overall Internship Readiness
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                    {analysisResult.overallScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <span className="text-xs text-slate-400 block mt-1">
                  Targeted for: <strong className="text-violet-400">{activeStudentProfile?.targetRole || 'Software Engineering'}</strong>
                </span>
              </div>

              <div
                className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${getReadinessColor(
                  analysisResult.readinessLevel
                )}`}
              >
                <ShieldCheck className="w-6 h-6" />
                <div>
                  <span className="text-[10px] uppercase font-bold block">Placement Status</span>
                  <span className="text-sm font-bold">{analysisResult.readinessLevel}</span>
                </div>
              </div>
            </div>

            {/* 5 Core Pillars Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-6">
              {/* DSA */}
              <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coding & DSA</span>
                </div>
                <div className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
                  {analysisResult.categoryBreakdown?.codingAndDSA?.score || 0} / 100
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {analysisResult.categoryBreakdown?.codingAndDSA?.status || 'Assessed'}
                </span>
              </div>

              {/* Projects */}
              <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Proof of Work</span>
                </div>
                <div className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
                  {analysisResult.categoryBreakdown?.projectProofOfWork?.score || 0} / 100
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {analysisResult.categoryBreakdown?.projectProofOfWork?.status || 'Assessed'}
                </span>
              </div>

              {/* Resume */}
              <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume Health</span>
                </div>
                <div className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
                  {analysisResult.categoryBreakdown?.resumeHealth?.score || 0} / 100
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {analysisResult.categoryBreakdown?.resumeHealth?.status || 'Assessed'}
                </span>
              </div>

              {/* Online Presence */}
              <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Online Footprint</span>
                </div>
                <div className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
                  {analysisResult.categoryBreakdown?.onlinePresence?.score || 0} / 100
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {analysisResult.categoryBreakdown?.onlinePresence?.status || 'Assessed'}
                </span>
              </div>

              {/* Role Alignment */}
              <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Role Fit</span>
                </div>
                <div className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
                  {analysisResult.categoryBreakdown?.roleAlignment?.score || 0} / 100
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                  {analysisResult.categoryBreakdown?.roleAlignment?.status || 'Assessed'}
                </span>
              </div>
            </div>
          </Card>

          {/* Strengths & Blockers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Competitive Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {analysisResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 space-y-3 border-rose-500/20 bg-rose-950/10">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Placement Blockers</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {analysisResult.blockers.map((blk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{blk}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Priority Actions & Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3 border-violet-500/20 bg-violet-950/10">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Priority Actions to Unblock</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {analysisResult.priorityActions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-violet-400 font-bold">#{idx + 1}</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 space-y-3 border-blue-500/20 bg-blue-950/10">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>Actionable Next Steps</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {analysisResult.nextSteps.map((stp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{stp}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Evaluate Placement Readiness for {activeStudentProfile?.name || 'Your Profile'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
            Click "Run Internship Readiness Audit" to evaluate your entire digital twin across Coding, Projects, Resume, and Online Footprint against hiring benchmarks.
          </p>
          <Button
            variant="outline"
            size="md"
            onClick={handleRunEvaluation}
            disabled={isLoading}
            leftIcon={<Sparkles className="w-4 h-4 text-violet-400" />}
          >
            Start Portfolio Audit
          </Button>
        </Card>
      )}
    </div>
  );
};
