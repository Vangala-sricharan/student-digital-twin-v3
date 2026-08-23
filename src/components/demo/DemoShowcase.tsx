import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Target,
  Cpu,
  Sparkles,
  Code2,
  FolderGit2,
  Award,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const DemoShowcase: React.FC = () => {
  const { demoProfile, exitDemo } = useDemo();
  const [activeDemoTab, setActiveDemoTab] = useState<'overview' | 'skills' | 'projects' | 'readiness'>('overview');

  return (
    <div className="space-y-6">
      {/* Demo Profile Header Card */}
      <Card className="p-6 sm:p-8 border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800 dark:border-slate-800 light:border-sky-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-xl font-mono">
                VS
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {demoProfile.fullName} — Demo
                </h1>
                <Badge variant="amber" size="sm">
                  Creator Showcase
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                {demoProfile.university} · {demoProfile.program} · {demoProfile.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Badge variant="blue" size="md">
              Target: {demoProfile.careerGoal}
            </Badge>
          </div>
        </div>

        {/* Isolation disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 dark:text-amber-300 light:text-amber-900 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            This is an isolated preview of the founder's showcase. Demo data will never overwrite your personal account or Supabase database.
          </span>
        </div>

        {/* Demo Sub-tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-800 dark:border-slate-800 light:border-sky-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDemoTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDemoTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700'
            }`}
          >
            Twin Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveDemoTab('skills')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDemoTab === 'skills'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700'
            }`}
          >
            Skill Ontology
          </button>
          <button
            type="button"
            onClick={() => setActiveDemoTab('projects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDemoTab === 'projects'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700'
            }`}
          >
            Projects Showcase
          </button>
          <button
            type="button"
            onClick={() => setActiveDemoTab('readiness')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeDemoTab === 'readiness'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700'
            }`}
          >
            Target Readiness
          </button>
        </div>
      </Card>

      {/* Tab Contents */}
      {activeDemoTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              Academic Track
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-3">Marwadi University</p>
            <div className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p><strong>Major:</strong> B.Tech CSE (AI/ML)</p>
              <p><strong>Year of Study:</strong> 2nd Year</p>
              <p><strong>Focus:</strong> AI/ML Systems & Graph Networks</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              Target Career Role
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-3">AI/ML Engineer</p>
            <div className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p><strong>Specialty:</strong> LLM Agents & Deep Learning</p>
              <p><strong>Secondary:</strong> Distributed Machine Learning</p>
              <p><strong>Location:</strong> India / Global Remote</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-1">
              Digital Twin Status
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-3">Living Graph Active</p>
            <div className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified
              </p>
              <p className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Academic Signals Mapped
              </p>
              <p className="flex items-center gap-1.5 text-blue-400">
                <Layers className="w-3.5 h-3.5" /> Repository Grounding Linked
              </p>
            </div>
          </Card>
        </div>
      )}

      {activeDemoTab === 'skills' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-4">
            Core AI/ML Skills Graph
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-200">
              <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Machine Learning & Theory</h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="blue" size="sm">PyTorch</Badge>
                <Badge variant="blue" size="sm">Transformers</Badge>
                <Badge variant="blue" size="sm">Scikit-Learn</Badge>
                <Badge variant="blue" size="sm">NumPy / Pandas</Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-200">
              <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Languages & Frameworks</h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="purple" size="sm">Python</Badge>
                <Badge variant="purple" size="sm">TypeScript</Badge>
                <Badge variant="purple" size="sm">React</Badge>
                <Badge variant="purple" size="sm">FastAPI</Badge>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-200">
              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Data & Systems</h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="emerald" size="sm">PostgreSQL</Badge>
                <Badge variant="emerald" size="sm">Supabase</Badge>
                <Badge variant="emerald" size="sm">Vector DB (Pinecone)</Badge>
                <Badge variant="emerald" size="sm">Git & CI/CD</Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeDemoTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Student Digital Twin OS
                </h4>
                <p className="text-xs text-blue-400">AI-Powered Career Intelligence Platform</p>
              </div>
              <Badge variant="blue" size="sm">Active</Badge>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Continuous student career readiness operating system synthesizing academic trajectory, project proofs, and market qualification models.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="slate" size="sm">React</Badge>
              <Badge variant="slate" size="sm">TypeScript</Badge>
              <Badge variant="slate" size="sm">Supabase</Badge>
              <Badge variant="slate" size="sm">AI Ontologies</Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Autonomous LLM Agent Pipeline
                </h4>
                <p className="text-xs text-indigo-400">Deep Reasoning & Tool Execution</p>
              </div>
              <Badge variant="purple" size="sm">Showcase</Badge>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Agentic pipeline executing multi-step retrieval, code execution verification, and structured report synthesis.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="slate" size="sm">PyTorch</Badge>
              <Badge variant="slate" size="sm">FastAPI</Badge>
              <Badge variant="slate" size="sm">Vector Search</Badge>
            </div>
          </Card>
        </div>
      )}

      {activeDemoTab === 'readiness' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
            Target Role Alignment: AI/ML Engineer
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6">
            Calibrated against engineering benchmarks for 2nd Year Computer Science students.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-200">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800">Foundational Mathematics & Deep Learning</span>
                <span className="text-emerald-400 font-bold">Strong Alignment</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Linear algebra, gradient optimization, backprop implementations verified in academic coursework.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-200">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-200 dark:text-slate-200 light:text-slate-800">Model Deployment & Low-Latency Serving</span>
                <span className="text-blue-400 font-bold">Next Sprint Target</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Recommendation: Complete a Triton / TensorRT deployment pipeline to reach top 1% benchmark.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
