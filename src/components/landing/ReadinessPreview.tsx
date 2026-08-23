import React from 'react';
import { Target, Activity, CheckCircle, BarChart2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const ReadinessPreview: React.FC = () => {
  return (
    <section id="readiness" className="py-20 bg-slate-950/40 dark:bg-slate-950/40 light:bg-sky-50/50 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="emerald" size="md" className="mb-4">
            Live Benchmarking
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Multi-Vector Readiness Diagnostics
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            Understand how technical recruiters and hiring algorithms evaluate your readiness before you apply.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Role Alignment Score
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Industry Matching Vector</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Measures similarity between your digital twin ontology and the target role criteria (e.g. AI Engineer, Backend Systems).
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>Core Framework Match</span>
                <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Direct Alignment</span>
              </div>
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>System Design Depth</span>
                <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">Advanced</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Code & Proof Health
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Repository Verification</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Evaluates test coverage, documentation quality, modularity, and deployment architecture of linked repositories.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>Production Deployments</span>
                <span className="font-semibold text-emerald-400">Verified</span>
              </div>
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>Git Activity Cadence</span>
                <span className="font-semibold text-emerald-400">Consistent</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Adaptive Milestones
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Dynamic Roadmap</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Real-time sprint goals configured to move you from candidate baseline to top 5% applicant readiness.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>Next Milestone</span>
                <span className="font-semibold text-purple-400">Build Vector Search Pipeline</span>
              </div>
              <div className="flex justify-between text-slate-400 dark:text-slate-400 light:text-slate-600">
                <span>Readiness Delta</span>
                <span className="font-semibold text-blue-400">High Impact</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
