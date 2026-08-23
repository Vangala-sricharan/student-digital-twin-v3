import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { CareerRoadmapResult, CareerRoadmapPhase, CareerRoadmapTask } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface CareerRoadmapProps {
  isDemo?: boolean;
}

export const CareerRoadmap: React.FC<CareerRoadmapProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile, skills, projects, achievements, careerGoals } = useStudentTwin();

  const [roadmapResult, setRoadmapResult] = useState<CareerRoadmapResult | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);

  // Load cached roadmap
  useEffect(() => {
    if (!activeStudentProfile) return;
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const cached = aiService.getSavedEntityAnalysis<CareerRoadmapResult>(
      userId,
      'roadmap',
      activeStudentProfile.id
    );
    if (cached) {
      setRoadmapResult(cached);
    } else {
      setRoadmapResult(null);
    }

    // Load completed tasks from local storage
    const savedCompleted = localStorage.getItem(`sdt_roadmap_completed_${activeStudentProfile.id}`);
    if (savedCompleted) {
      try {
        setCompletedTaskIds(new Set(JSON.parse(savedCompleted)));
      } catch {}
    }
  }, [activeStudentProfile?.id, user?.id, isDemo]);

  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.generateCareerRoadmap({
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
      setRoadmapResult(res.data);
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    const updated = new Set(completedTaskIds);
    if (updated.has(taskId)) {
      updated.delete(taskId);
    } else {
      updated.add(taskId);
    }
    setCompletedTaskIds(updated);
    if (activeStudentProfile) {
      localStorage.setItem(
        `sdt_roadmap_completed_${activeStudentProfile.id}`,
        JSON.stringify(Array.from(updated))
      );
    }
  };

  const getCategoryBadgeVariant = (cat: string): 'blue' | 'purple' | 'emerald' | 'slate' | 'amber' | 'rose' => {
    switch (cat) {
      case 'Skill':
        return 'blue';
      case 'Project':
        return 'purple';
      case 'DSA':
        return 'emerald';
      case 'Resume':
        return 'amber';
      case 'Networking':
        return 'purple';
      case 'Application':
        return 'rose';
      default:
        return 'slate';
    }
  };

  // Calculate completion percentage
  const totalTasks = roadmapResult?.phases.reduce((acc, p) => acc + p.tasks.length, 0) || 0;
  const completedCount = roadmapResult?.phases.reduce((acc, p) => {
    return acc + p.tasks.filter((t) => completedTaskIds.has(t.id)).length;
  }, 0) || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  AI 30-60-90 Day Career Execution Roadmap
                </h1>
                <Badge variant="blue" size="sm">
                  CUSTOM MILESTONES & TASKS
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Personalized sequential execution plan calibrated to your current skills and target role of{' '}
                <strong className="text-blue-400">{activeStudentProfile?.targetRole || 'Software Engineer'}</strong>.
              </p>
            </div>
          </div>

          <Button
            id="generate-roadmap-btn"
            variant="primary"
            size="md"
            onClick={handleGenerateRoadmap}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500"
            leftIcon={
              isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
          >
            {isLoading ? 'Synthesizing Roadmap...' : roadmapResult ? 'Regenerate Roadmap' : 'Generate 30-60-90 Roadmap'}
          </Button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>

      {roadmapResult ? (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Roadmap Milestone Execution Progress
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({completedCount} of {totalTasks} tasks completed)
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <div className="h-3 rounded-full bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-200 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mt-4 leading-relaxed">
              {roadmapResult.summary}
            </p>
          </Card>

          {/* Phase Navigation Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {roadmapResult.phases.map((phase, idx) => {
              const phaseCompleted = phase.tasks.filter((t) => completedTaskIds.has(t.id)).length;
              const phaseTotal = phase.tasks.length;
              const isSelected = activePhaseIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm'
                      : 'bg-slate-900/60 dark:bg-slate-900/60 light:bg-white border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{phase.phaseName}</span>
                  <Badge variant={isSelected ? 'blue' : 'slate'} size="sm">
                    {phaseCompleted}/{phaseTotal} Done
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Selected Phase Detail & Tasks */}
          {roadmapResult.phases[activePhaseIndex] && (
            <div className="space-y-6">
              {/* Phase Header */}
              <Card className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                      Phase Focus ({roadmapResult.phases[activePhaseIndex].days} Days)
                    </span>
                    <h2 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-0.5">
                      {roadmapResult.phases[activePhaseIndex].primaryObjective}
                    </h2>
                  </div>
                </div>

                {/* Key Milestones */}
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Phase Milestones to Unlock:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roadmapResult.phases[activePhaseIndex].milestones.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2.5 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 border border-slate-800 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-start gap-2"
                      >
                        <Target className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Tasks List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 px-1">
                  Actionable Deliverables ({roadmapResult.phases[activePhaseIndex].tasks.length} tasks)
                </h3>

                {roadmapResult.phases[activePhaseIndex].tasks.map((task) => {
                  const isDone = completedTaskIds.has(task.id);

                  return (
                    <Card
                      key={task.id}
                      className={`p-4 transition-colors ${
                        isDone
                          ? 'border-emerald-500/30 bg-emerald-950/10 opacity-80'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          type="button"
                          onClick={() => toggleTaskCompleted(task.id)}
                          className="mt-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          {isDone ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4
                              className={`text-sm font-bold ${
                                isDone
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-100 dark:text-slate-100 light:text-slate-900'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={getCategoryBadgeVariant(task.category)} size="sm">
                                {task.category}
                              </Badge>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ~{task.estimatedHours}h
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
                            {task.description}
                          </p>

                          <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                            <strong className="text-blue-400 font-semibold">Deliverable:</strong>
                            <span>{task.deliverable}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Build Your 30-60-90 Day Execution Plan
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
            Click "Generate 30-60-90 Roadmap" to create personalized phases, milestones, and daily deliverables matched to your current technical state.
          </p>
          <Button
            variant="outline"
            size="md"
            onClick={handleGenerateRoadmap}
            disabled={isLoading}
            leftIcon={<Sparkles className="w-4 h-4 text-blue-400" />}
          >
            Synthesize Career Roadmap
          </Button>
        </Card>
      )}
    </div>
  );
};
