import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ListOrdered,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { SyllabusAnalysisResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface SyllabusAnalyzerProps {
  isDemo?: boolean;
}

const SAMPLE_SYLLABUS_TEXT = `Course: Data Structures and Algorithms (CS 201)
Unit 1: Analysis of Algorithms & Asymptotic Notations (Big O, Omega, Theta), Recurrence Relations, Master Theorem.
Unit 2: Linear Data Structures: Arrays, Singly & Doubly Linked Lists, Stacks (Infix to Postfix conversion), Queues, Deques, Circular Queues.
Unit 3: Non-Linear Structures: Binary Trees, BST Operations, AVL Trees, B-Trees, Heap & Priority Queues, Binary Heap implementations.
Unit 4: Graph Algorithms: BFS, DFS, Topological Sort, Minimum Spanning Trees (Kruskal, Prim), Shortest Paths (Dijkstra, Bellman-Ford).
Unit 5: Algorithmic Paradigms: Divide and Conquer (MergeSort, QuickSort), Greedy Techniques, Dynamic Programming (0/1 Knapsack, LCS, LIS), Backtracking (N-Queens).`;

export const SyllabusAnalyzer: React.FC<SyllabusAnalyzerProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile } = useStudentTwin();

  const [syllabusTitle, setSyllabusTitle] = useState('Data Structures and Algorithms (CS 201)');
  const [syllabusText, setSyllabusText] = useState(SAMPLE_SYLLABUS_TEXT);
  const [targetRole, setTargetRole] = useState(
    activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Software Engineer'
  );
  const [analysisResult, setAnalysisResult] = useState<SyllabusAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!syllabusText.trim() || syllabusText.trim().length < 20) {
      setErrorMessage('Please enter at least 20 characters of syllabus content.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeSyllabus({
      syllabusText: syllabusText.trim(),
      syllabusTitle: syllabusTitle.trim(),
      targetRole,
      userId,
    });

    setIsAnalyzing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setAnalysisResult(res.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Academic Syllabus & Curriculum Analyzer
                </h1>
                <Badge variant="amber" size="sm">
                  CAREER RELEVANCE AUDIT
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Transforms university coursework into structured interview prep sequences, priority topics, and industry skill-gap bridges.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Syllabus Input */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Syllabus Details
            </h2>

            <div>
              <label htmlFor="syllabus-title-input" className="text-xs font-semibold text-slate-400 block mb-1">
                Course Title / Subject Code
              </label>
              <input
                id="syllabus-title-input"
                type="text"
                value={syllabusTitle}
                onChange={(e) => setSyllabusTitle(e.target.value)}
                placeholder="e.g. Operating Systems CS301"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="syllabus-target-role" className="text-xs font-semibold text-slate-400 block mb-1">
                Target Role for Industry Relevance Mapping
              </label>
              <input
                id="syllabus-target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer / Systems Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label htmlFor="syllabus-content-area" className="text-xs font-semibold text-slate-400 block mb-1.5">
                Paste Course Syllabus Units & Topics
              </label>
              <textarea
                id="syllabus-content-area"
                rows={10}
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder="Paste the unit-by-unit syllabus here..."
                className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-amber-500 resize-none font-mono"
              />
            </div>

            <Button
              id="analyze-syllabus-btn"
              variant="primary"
              size="md"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full justify-center bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
              leftIcon={
                isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Sparkles className="w-4 h-4 text-slate-950" />
                )
              }
            >
              {isAnalyzing ? 'Analyzing Course Syllabus...' : 'Analyze Coursework & Build Plan'}
            </Button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Analysis Output */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="space-y-6">
              {/* Career Relevance Card */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Industry Career Relevance
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl font-extrabold text-amber-400">
                        {analysisResult.careerRelevanceScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">
                      {analysisResult.totalTopicsCount} topics cataloged for {analysisResult.targetRole}
                    </span>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold block">Relevance Tier</span>
                      <span className="text-xs font-bold">
                        {analysisResult.careerRelevanceScore >= 80
                          ? 'Core Industry Foundation'
                          : analysisResult.careerRelevanceScore >= 60
                          ? 'High Secondary Relevance'
                          : 'General Academic Breadth'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700 mt-4">
                  {analysisResult.careerRelevanceSummary}
                </p>
              </Card>

              {/* Priority & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority Topics */}
                <Card className="p-5 space-y-3 border-amber-500/20 bg-amber-950/10">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top Interview Priorities</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {analysisResult.priorityTopics.map((top, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{top}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Industry Gaps */}
                <Card className="p-5 space-y-3 border-rose-500/20 bg-rose-950/10">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Academic-to-Industry Gaps</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {analysisResult.skillGapsForIndustry.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Learning Sequence */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <ListOrdered className="w-4 h-4" />
                  <span>Optimized Sequential Learning Order</span>
                </div>
                <div className="space-y-3">
                  {analysisResult.learningSequence.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {step.step || idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 pl-7">{step.rationale}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Study & Revision Plan */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Structured Study & Revision Plan</span>
                </div>
                <div className="space-y-3">
                  {analysisResult.studyPlan.map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 border border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                          {plan.weekOrModule}
                        </h4>
                        <Badge variant="emerald" size="sm">
                          Action Module
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        <div className="font-semibold text-slate-300">Action Items:</div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {plan.actionItems.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-emerald-400">
                        <strong>Expected Outcome:</strong> {plan.expectedOutcome}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Analyze Coursework for Industry Placement
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                Paste your university course syllabus on the left to extract interview priority topics, difficult concepts, and an actionable revision plan.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
