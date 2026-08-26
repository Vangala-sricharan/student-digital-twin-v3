import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Zap,
  Sliders,
  SlidersHorizontal,
  Code2,
  Award,
  Github,
  Linkedin,
  FileText,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { CareerSimulationScenario, CareerSimulationResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface CareerSimulatorProps {
  isDemo?: boolean;
}

const POPULAR_SKILL_SUGGESTIONS = [
  'Docker',
  'Kubernetes',
  'Redis',
  'TypeScript',
  'FastAPI',
  'Next.js',
  'PostgreSQL',
  'GraphQL',
  'AWS',
  'PyTorch',
  'LangChain / RAG',
];

const POPULAR_PROJECT_SUGGESTIONS = [
  'Production RAG AI Agent with Vector DB',
  'High-Throughput Distributed Task Queue',
  'Fintech Payment Processing Engine',
  'Real-Time Collaborative Code Editor',
  'Microservices E-Commerce with Event Bus',
];

const POPULAR_CERT_SUGGESTIONS = [
  'AWS Certified Solutions Architect - Associate',
  'CKA: Certified Kubernetes Administrator',
  'Google Cloud Associate Cloud Engineer',
  'Meta Professional Front-End / Back-End Certificate',
];

export const CareerSimulator: React.FC<CareerSimulatorProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile, skills, projects, achievements } = useStudentTwin();

  // Baseline calculated score
  const baselineScore = Math.min(
    95,
    Math.max(
      20,
      skills.length * 5 +
        projects.length * 10 +
        achievements.length * 4 +
        (activeStudentProfile?.githubUrl ? 10 : 0) +
        (activeStudentProfile?.linkedinUrl ? 10 : 0)
    )
  );

  const [scenario, setScenario] = useState<CareerSimulationScenario>({
    addedSkills: ['Docker', 'Redis'],
    addedProjects: ['Production RAG AI Agent with Vector DB'],
    addedCertifications: ['AWS Certified Solutions Architect - Associate'],
    improvedDsaCount: 100,
    improvedGithub: true,
    improvedLinkedin: true,
    improvedResume: true,
  });

  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customProjectInput, setCustomProjectInput] = useState('');
  const [customCertInput, setCustomCertInput] = useState('');

  const [simulationResult, setSimulationResult] = useState<CareerSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.runCareerSimulator({
      scenario,
      activeProfile: activeStudentProfile,
      skills,
      projects,
      achievements,
      currentReadinessScore: baselineScore,
      userId,
    });

    setIsSimulating(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setSimulationResult(res.data);
    }
  };

  const addSkill = (skill: string) => {
    if (!skill || scenario.addedSkills.includes(skill)) return;
    setScenario((prev) => ({ ...prev, addedSkills: [...prev.addedSkills, skill] }));
  };

  const removeSkill = (skill: string) => {
    setScenario((prev) => ({
      ...prev,
      addedSkills: prev.addedSkills.filter((s) => s !== skill),
    }));
  };

  const addProject = (proj: string) => {
    if (!proj || scenario.addedProjects.includes(proj)) return;
    setScenario((prev) => ({ ...prev, addedProjects: [...prev.addedProjects, proj] }));
  };

  const removeProject = (proj: string) => {
    setScenario((prev) => ({
      ...prev,
      addedProjects: prev.addedProjects.filter((p) => p !== proj),
    }));
  };

  const addCert = (cert: string) => {
    if (!cert || scenario.addedCertifications.includes(cert)) return;
    setScenario((prev) => ({ ...prev, addedCertifications: [...prev.addedCertifications, cert] }));
  };

  const removeCert = (cert: string) => {
    setScenario((prev) => ({
      ...prev,
      addedCertifications: prev.addedCertifications.filter((c) => c !== cert),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  What-If Career Trajectory Simulator
                </h1>
                <Badge variant="amber" size="sm">
                  PREDICTIVE PLACEMENT MODEL
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Simulate the projected ROI and readiness score boost of acquiring new skills, shipping high-impact projects, and polishing your portfolio.
              </p>
            </div>
          </div>

          <Button
            id="run-simulation-btn"
            variant="primary"
            size="md"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold"
            leftIcon={
              isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-950" />
              )
            }
          >
            {isSimulating ? 'Simulating Trajectory...' : 'Run What-If Simulation'}
          </Button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What-If Sandbox Controls */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
              <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Simulation Parameters</span>
              </h2>
              <Badge variant="slate" size="sm">
                Baseline: {baselineScore}/100
              </Badge>
            </div>

            {/* Simulated Skills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                1. Add Hypothetical Skills ({scenario.addedSkills.length})
              </span>
              <div className="flex flex-wrap gap-2 min-h-[42px] p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300">
                {scenario.addedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 dark:bg-blue-500/20 light:bg-blue-100 text-blue-300 dark:text-blue-300 light:text-blue-800 text-xs font-semibold border border-blue-500/40 dark:border-blue-500/40 light:border-blue-300 shadow-xs"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(sk)}
                      className="hover:text-white dark:hover:text-white light:hover:text-blue-950 transition-colors p-0.5 cursor-pointer"
                      title={`Remove ${sk}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick skill add chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_SKILL_SUGGESTIONS.filter((s) => !scenario.addedSkills.includes(s))
                  .slice(0, 5)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium shadow-xs"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>{s}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Simulated Projects */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                2. Add High-Impact Portfolio Project ({scenario.addedProjects.length})
              </span>
              <div className="space-y-1.5">
                {scenario.addedProjects.map((p) => (
                  <div
                    key={p}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/15 dark:bg-indigo-500/15 light:bg-indigo-50 border border-indigo-500/30 dark:border-indigo-500/30 light:border-indigo-200 text-xs text-indigo-200 dark:text-indigo-200 light:text-indigo-900 font-medium"
                  >
                    <span className="truncate">{p}</span>
                    <button
                      type="button"
                      onClick={() => removeProject(p)}
                      className="text-indigo-400 hover:text-white dark:hover:text-white light:hover:text-indigo-950 p-1 transition-colors cursor-pointer"
                      title="Remove project"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick project chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_PROJECT_SUGGESTIONS.filter((p) => !scenario.addedProjects.includes(p))
                  .slice(0, 2)
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addProject(p)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium shadow-xs truncate max-w-full"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Simulated Certifications */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block">
                3. Add Industry Certification ({scenario.addedCertifications.length})
              </span>
              <div className="space-y-1.5">
                {scenario.addedCertifications.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/15 light:bg-amber-50 border border-amber-500/30 dark:border-amber-500/30 light:border-amber-200 text-xs text-amber-200 dark:text-amber-200 light:text-amber-900 font-medium"
                  >
                    <span className="truncate">{c}</span>
                    <button
                      type="button"
                      onClick={() => removeCert(c)}
                      className="text-amber-400 hover:text-white dark:hover:text-white light:hover:text-amber-950 p-1 transition-colors cursor-pointer"
                      title="Remove certification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_CERT_SUGGESTIONS.filter((c) => !scenario.addedCertifications.includes(c))
                  .slice(0, 2)
                  .map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => addCert(c)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-700 dark:border-slate-700 light:border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer font-medium shadow-xs truncate max-w-full"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* DSA Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                  4. Simulated LeetCode / DSA Problems Solved:
                </span>
                <span className="font-bold text-amber-400">+{scenario.improvedDsaCount} Problems</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={25}
                value={scenario.improvedDsaCount}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    improvedDsaCount: Number(e.target.value),
                  }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Portfolio Polish Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs">
              <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 block">5. Portfolio Polish Toggles:</span>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 dark:hover:border-slate-700 light:hover:border-slate-400 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={scenario.improvedGithub}
                  onChange={(e) =>
                    setScenario((prev) => ({
                      ...prev,
                      improvedGithub: e.target.checked,
                    }))
                  }
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <Github className="w-4 h-4 text-slate-300 dark:text-slate-300 light:text-slate-700 shrink-0" />
                <span className="text-slate-300 dark:text-slate-300 light:text-slate-800">Overhaul GitHub READMEs, commits, and star showcases</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 dark:hover:border-slate-700 light:hover:border-slate-400 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={scenario.improvedLinkedin}
                  onChange={(e) =>
                    setScenario((prev) => ({
                      ...prev,
                      improvedLinkedin: e.target.checked,
                    }))
                  }
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <Linkedin className="w-4 h-4 text-[#0077b5] shrink-0" />
                <span className="text-slate-300 dark:text-slate-300 light:text-slate-800">Optimize LinkedIn Headline, About, & Recommendations</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 dark:hover:border-slate-700 light:hover:border-slate-400 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={scenario.improvedResume}
                  onChange={(e) =>
                    setScenario((prev) => ({
                      ...prev,
                      improvedResume: e.target.checked,
                    }))
                  }
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 dark:text-slate-300 light:text-slate-800">Refactor Resume to Action-Verb STAR Metrics</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Projected Trajectory Results */}
        <div className="lg:col-span-6 space-y-6">
          {simulationResult ? (
            <div className="space-y-6">
              {/* Score Projection Card */}
              <Card className="p-6">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Projected Readiness Impact
                </span>

                <div className="flex items-center justify-between mt-3 pb-5 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 block">Current Baseline</span>
                    <span className="text-3xl font-extrabold text-slate-300">
                      {simulationResult.currentScore}/100
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-amber-400">
                    <ArrowRight className="w-6 h-6" />
                    <span className="text-sm font-bold">
                      +{simulationResult.scoreDelta} pts
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Projected Score</span>
                    <span className="text-3xl font-extrabold text-emerald-400">
                      {simulationResult.projectedScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mt-4 leading-relaxed">
                  {simulationResult.rationale}
                </p>
              </Card>

              {/* Category Impacts */}
              <Card className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 uppercase tracking-wider">
                  Category Impact Breakdown
                </h3>
                <div className="space-y-2.5">
                  {simulationResult.categoryImpacts.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{cat.category}</span>
                        <span className="text-emerald-400">
                          {cat.current} → {cat.projected} (+{cat.diff})
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{cat.impactExplanation}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Strategic Advice */}
              <Card className="p-5 space-y-3 border-amber-500/20 bg-amber-950/10">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>Highest ROI Career Upgrades</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {simulationResult.strategicAdvice.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">#{idx + 1}</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Simulate Your Next Career Milestone
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                Adjust the hypothetical skills, projects, and interview preparation toggles on the left, then click "Run What-If Simulation" to project your score jump.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
