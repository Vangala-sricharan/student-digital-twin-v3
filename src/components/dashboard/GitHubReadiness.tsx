import React, { useState, useEffect, useCallback } from 'react';
import {
  Github,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Star,
  GitFork,
  BookOpen,
  Calendar,
  Users,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  AlertCircle,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { GitHubReadinessResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface GitHubReadinessProps {
  isDemo?: boolean;
}

export const GitHubReadiness: React.FC<GitHubReadinessProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile } = useStudentTwin();

  const [githubUrl, setGithubUrl] = useState<string>(() => {
    return activeStudentProfile?.githubUrl || '';
  });
  const [analysisResult, setAnalysisResult] = useState<GitHubReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTransientError, setIsTransientError] = useState<boolean>(false);

  // Progressive loading status updates during active audit
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setLoadingStage(0);
      timer = setInterval(() => {
        setLoadingStage((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1200);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const loadingStages = [
    'Connecting to GitHub API & verifying account...',
    'Analyzing repositories, commit history & README evidence...',
    'Evaluating 6-dimension recruiter readiness rubric...',
    'Synthesizing score & tailored recommendations...',
  ];

  // Sync with active student profile github URL on load or profile switch
  useEffect(() => {
    if (activeStudentProfile?.githubUrl) {
      setGithubUrl(activeStudentProfile.githubUrl);
    }
  }, [activeStudentProfile?.githubUrl]);

  // Load cached analysis if matching normalized URL exists and is well-formed
  useEffect(() => {
    if (!githubUrl || !githubUrl.trim()) {
      setAnalysisResult(null);
      return;
    }
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const normalizedUrl = githubUrl.toLowerCase().trim().replace(/\/$/, '');
    const cached = aiService.getSavedEntityAnalysis<GitHubReadinessResult>(
      userId,
      'github',
      normalizedUrl
    );

    // Validate cached result structure before applying
    if (cached && typeof cached === 'object' && typeof cached.overallScore === 'number') {
      setAnalysisResult(cached);
    } else {
      setAnalysisResult(null);
    }
  }, [githubUrl, user?.id, isDemo]);

  const handleRunAudit = useCallback(async () => {
    const trimmedUrl = githubUrl.trim();
    if (!trimmedUrl) {
      setErrorMessage('Please provide a valid GitHub profile URL.');
      setIsTransientError(false);
      return;
    }

    // Prevent concurrent duplicate executions
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsTransientError(false);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeGitHub({
      githubUrl: trimmedUrl,
      userId,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
      setIsTransientError(Boolean(res.isTransient));
    } else if (res.data) {
      setAnalysisResult(res.data);
      setErrorMessage(null);
      setIsTransientError(false);
    }
  }, [githubUrl, isLoading, user?.id, isDemo]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  // Safe accessor fallbacks to prevent any possible undefined crashes
  const evidence = analysisResult?.evidenceSummary;
  const categories = analysisResult?.categoryScores;
  const strengths = Array.isArray(analysisResult?.strengths) ? analysisResult.strengths : [];
  const weaknesses = Array.isArray(analysisResult?.weaknesses) ? analysisResult.weaknesses : [];
  const improvements = Array.isArray(analysisResult?.highestImpactImprovements)
    ? analysisResult.highestImpactImprovements
    : [];
  const recommendations = Array.isArray(analysisResult?.recruiterRecommendations)
    ? analysisResult.recruiterRecommendations
    : [];
  const detectedLanguages = Array.isArray(evidence?.languagesDetected)
    ? evidence.languagesDetected
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-slate-800 light:bg-slate-100 border border-slate-700 dark:border-slate-700 light:border-slate-300 flex items-center justify-center text-slate-100 dark:text-slate-100 light:text-slate-900 shrink-0 shadow-sm">
              <Github className="w-6 h-6 text-slate-100 dark:text-slate-100 light:text-slate-900" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  GitHub Technical Readiness Audit
                </h1>
                <Badge variant="slate" size="sm">
                  PUBLIC API EVIDENCE + RECRUITER AI
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Evaluates repository quality, commit consistency, README documentation, and tech recruiter appeal.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunAudit();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="github-url-input"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-username"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-slate-600 font-mono"
              />
            </div>
            <Button
              id="audit-github-btn"
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !githubUrl.trim()}
              leftIcon={
                isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isLoading ? 'Verifying & Auditing...' : 'Run Real GitHub Audit'}
            </Button>
          </form>

          {isLoading && (
            <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">
                      Step {loadingStage + 1} of {loadingStages.length}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      Running Technical Audit
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium">
                    {loadingStages[loadingStage]}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-blue-500 h-full transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">
                    {isTransientError ? 'Gemini is temporarily unavailable' : 'Audit Request Failed'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                    {errorMessage}
                  </span>
                </div>
              </div>
              <Button
                id="retry-github-audit-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunAudit}
                disabled={isLoading}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20 shrink-0"
              >
                Retry Analysis
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Analysis Results View */}
      {analysisResult ? (
        <div className="space-y-6">
          {/* Top Overview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Evidence Profile Card */}
            <div className="lg:col-span-5">
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                    {evidence?.avatarUrl ? (
                      <img
                        src={evidence.avatarUrl}
                        alt={analysisResult.username || 'GitHub User'}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl border border-slate-700 object-cover"
                        onError={(e) => {
                          // Safe image fallback if remote avatar fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.avatar-placeholder');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white avatar-placeholder ${
                        evidence?.avatarUrl ? 'hidden' : 'flex'
                      }`}
                    >
                      <Github className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        @{analysisResult.username || 'username'}
                      </h2>
                      {analysisResult.githubUrl ? (
                        <a
                          href={analysisResult.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>View Public Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mt-4 italic">
                    "{evidence?.bio || 'No public bio set on GitHub profile.'}"
                  </p>

                  {/* Empirical Numbers Grid */}
                  <div className="grid grid-cols-3 gap-2.5 mt-5 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Public Repos</span>
                      <span className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {evidence?.publicReposCount ?? 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Stars</span>
                      <span className="text-base font-bold text-amber-400 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {evidence?.totalStars ?? 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Forks</span>
                      <span className="text-base font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center justify-center gap-1">
                        <GitFork className="w-3.5 h-3.5" />
                        {evidence?.totalForks ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Languages Detected */}
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                      Languages Detected in Repositories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedLanguages.length > 0 ? (
                        detectedLanguages.map((lang, idx) => (
                          <Badge key={idx} variant="slate" size="sm">
                            {lang}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No primary languages detected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since{' '}
                    {evidence?.accountCreatedAt
                      ? new Date(evidence.accountCreatedAt).getFullYear() || 'Recent'
                      : 'Recent'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {evidence?.followersCount ?? 0} followers
                  </span>
                </div>
              </Card>
            </div>

            {/* Score & Rubric Breakdown */}
            <div className="lg:col-span-7">
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Recruiter-Readiness Score
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                          {analysisResult.overallScore ?? 0}
                        </span>
                        <span className="text-sm font-semibold text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div
                      className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${getScoreColor(
                        analysisResult.overallScore ?? 0
                      )}`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold block">Evaluation</span>
                        <span className="text-xs font-bold">
                          {(analysisResult.overallScore ?? 0) >= 80
                            ? 'Top Tier Portfolio'
                            : (analysisResult.overallScore ?? 0) >= 60
                            ? 'Good Foundation'
                            : (analysisResult.overallScore ?? 0) >= 40
                            ? 'Needs Polish'
                            : 'Early Stage'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Rubric Categories */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5">
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Profile Quality</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.profileQuality ?? 0} / 15
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Project Quality</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.projectQuality ?? 0} / 25
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Documentation</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.documentation ?? 0} / 20
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Repo Organization</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.repoOrganization ?? 0} / 15
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Activity Consistency</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.activityConsistency ?? 0} / 15
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Engineering Presentation</span>
                      <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {categories?.engineeringPresentation ?? 0} / 10
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Empirical Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {strengths.length > 0 ? (
                  strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No specific strengths returned.</li>
                )}
              </ul>
            </Card>

            <Card className="p-5 space-y-3 border-rose-500/20 bg-rose-950/10">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Deficiencies & Red Flags</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                {weaknesses.length > 0 ? (
                  weaknesses.map((wk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{wk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No red flags detected.</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Highest Impact Improvements */}
          <Card className="p-5 space-y-3 border-blue-500/20 bg-blue-950/10">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Highest Impact GitHub Improvements</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              {improvements.length > 0 ? (
                improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">#{idx + 1}</span>
                    <span>{imp}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">No immediate improvement recommendations.</li>
              )}
            </ul>
          </Card>

          {/* Recruiter Recommendations */}
          <Card className="p-5 space-y-3 border-indigo-500/20 bg-indigo-950/10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Recruiter-Facing Presentation Tips</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              {recommendations.length > 0 ? (
                recommendations.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span>{tip}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">No recruiter presentation tips.</li>
              )}
            </ul>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mb-4 border border-slate-700">
            <Github className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Inspect Your Real GitHub Footprint
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
            Enter your GitHub profile URL above and click "Run Real GitHub Audit" to measure your public engineering portfolio against technical recruiter benchmarks.
          </p>
        </Card>
      )}
    </div>
  );
};
