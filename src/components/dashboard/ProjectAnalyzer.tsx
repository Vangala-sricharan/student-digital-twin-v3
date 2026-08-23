import React, { useState, useEffect } from 'react';
import {
  Code2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Server,
  Layers,
  Cpu,
  Database,
  Lock,
  Boxes,
  FileCheck,
  Rocket,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { ProjectItem, ProjectAnalysisResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface ProjectAnalyzerProps {
  isDemo?: boolean;
}

export const ProjectAnalyzer: React.FC<ProjectAnalyzerProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { projects, activeStudentProfile } = useStudentTwin();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize selected project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // When selected project changes, clear state or load cached analysis for this specific project ID
  useEffect(() => {
    if (!selectedProjectId) {
      setAnalysisResult(null);
      return;
    }

    setErrorMessage(null);
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const cached = aiService.getSavedEntityAnalysis<ProjectAnalysisResult>(
      userId,
      'project',
      selectedProjectId
    );

    if (cached && cached.projectId === selectedProjectId) {
      setAnalysisResult(cached);
    } else {
      setAnalysisResult(null);
    }
  }, [selectedProjectId, user?.id, isDemo]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const handleRunAnalysis = async () => {
    if (!selectedProject) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeProject({
      project: selectedProject,
      userId,
    });

    setIsAnalyzing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setAnalysisResult(res.data);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Code2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            No Projects Available to Analyze
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-2 mb-6">
            The AI Project Analyzer audits real architecture, tech depth, database design, and repository evidence. Please add your projects in the Projects tab first.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  AI Project Architecture Analyzer
                </h1>
                <Badge variant={isDemo ? 'amber' : 'blue'} size="sm">
                  RUBRIC 10-DIMENSION AUDIT
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Evaluates project architecture, security, algorithmic complexity, database design, and recruiter appeal.
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="w-full md:w-auto flex items-center gap-2.5">
            <label htmlFor="project-select" className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Select Project:
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 md:w-64 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty || 'Project'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Project Evidence Spec */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Project Under Review
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-0.5">
                    {selectedProject.title}
                  </h2>
                </div>
                <Badge variant="blue" size="sm">
                  {selectedProject.difficulty || 'Intermediate'}
                </Badge>
              </div>

              {/* Description */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Description
                </span>
                <p className="text-xs leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                  {selectedProject.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Architecture Details */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  System Architecture & Design
                </span>
                <p className="text-xs leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700 bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 p-3 rounded-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
                  {selectedProject.architecture || 'No explicit architectural documentation provided. (Will penalize Architecture score)'}
                </p>
              </div>

              {/* Tech Stack */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.techStack && selectedProject.techStack.length > 0 ? (
                    selectedProject.techStack.map((tech, idx) => (
                      <Badge key={idx} variant="slate" size="sm">
                        {tech}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-rose-400">No tech stack recorded.</span>
                  )}
                </div>
              </div>

              {/* Links & Proof of Work */}
              <div className="space-y-2 pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <span className="text-xs font-semibold text-slate-400 block">
                  Proof of Work Links
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  {selectedProject.githubUrl ? (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-indigo-400 hover:underline p-2 rounded-lg bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 border border-slate-800/80"
                    >
                      <Github className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedProject.githubUrl}</span>
                      <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
                    </a>
                  ) : (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Missing GitHub Repository URL</span>
                    </div>
                  )}

                  {selectedProject.liveDemoUrl && (
                    <a
                      href={selectedProject.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-emerald-400 hover:underline p-2 rounded-lg bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 border border-slate-800/80"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedProject.liveDemoUrl}</span>
                      <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
                    </a>
                  )}
                </div>
              </div>

              {/* Run Analysis Trigger */}
              <div className="pt-2">
                <Button
                  id="run-project-analysis-btn"
                  variant="primary"
                  size="md"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full justify-center bg-indigo-600 hover:bg-indigo-500"
                  leftIcon={
                    isAnalyzing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                >
                  {isAnalyzing
                    ? 'Auditing Project Architecture...'
                    : analysisResult
                    ? 'Re-Analyze Project Architecture'
                    : 'Run 10-Category AI Audit'}
                </Button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Analysis Results or Initial Prompt */}
          <div className="lg:col-span-7 space-y-6">
            {analysisResult ? (
              <div className="space-y-6">
                {/* Overall Score Banner */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Empirical Architecture Quality Score
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                          {analysisResult.overallScore}
                        </span>
                        <span className="text-sm font-semibold text-slate-400">/ 100</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Analyzed on {new Date(analysisResult.analysisDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div
                      className={`px-4 py-3 rounded-2xl border flex items-center gap-2.5 ${getScoreColor(
                        analysisResult.overallScore
                      )}`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold block">Status</span>
                        <span className="text-xs font-bold">
                          {analysisResult.overallScore >= 80
                            ? 'Production Ready'
                            : analysisResult.overallScore >= 60
                            ? 'Solid Foundation'
                            : analysisResult.overallScore >= 40
                            ? 'Needs Depth'
                            : 'Early Prototype'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 10 Category Rubric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-6 pt-5 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Architecture</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.architecture} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Tech Depth</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.technicalDepth} / 15
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Complexity</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.complexity} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Tech Stack</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.techStackQuality} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Backend & DB</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.backendDatabase} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Auth & Security</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.authAndSecurity} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Scalability</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.scalability} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Testing</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.testingAndEvidence} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Docs & Deploy</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.deploymentAndDocs} / 10
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block truncate">Resume Impact</span>
                      <span className="text-sm font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {analysisResult.categoryScores.resumeImpact} / 5
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Empirical Strengths</span>
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

                  {/* Weaknesses / Gaps */}
                  <Card className="p-5 space-y-3 border-rose-500/20 bg-rose-950/10">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Identified Gaps & Deficiencies</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                      {analysisResult.weaknesses.map((wk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Actionable Recommendations */}
                <Card className="p-5 space-y-3 border-indigo-500/20 bg-indigo-950/10">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    <span>Prioritized Engineering Upgrades</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                  <Code2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Ready to Evaluate "{selectedProject.title}"
                </h3>
                <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                  Click "Run 10-Category AI Audit" to evaluate this project against senior industry engineering standards.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}
                >
                  Start Architecture Audit
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
