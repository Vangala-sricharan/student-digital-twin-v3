import React from 'react';
import { Network, LineChart, Target, Layers } from 'lucide-react';
import { Card } from '../common/Card';

export const WhatIsSection: React.FC = () => {
  return (
    <section id="what-is" className="py-20 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            What is Student Digital Twin?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
            Traditional resumes are static, outdated snapshots. The <span className="font-semibold text-blue-400">Student Digital Twin</span> is an active computational model of a student's evolving academic abilities, technical proficiency, project proof-of-work, and verified milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="p-8 flex flex-col justify-between relative overflow-hidden" glow>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                The Living Student Graph
              </h3>
              <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                Rather than treating each project or course as an isolated line item, the Student Digital Twin maps all coursework, hackathons, open-source repositories, and verified skills into an interconnected graph ontology.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 dark:border-slate-800 light:border-sky-100 flex items-center gap-3 text-xs text-blue-400 font-medium">
              <Layers className="w-4 h-4" /> Continuous Ontological Mapping
            </div>
          </Card>

          <Card className="p-8 flex flex-col justify-between relative overflow-hidden" glow>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Calibrated Industry Benchmarking
              </h3>
              <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                Your twin simulates qualification vectors against real industry roles—AI/ML Engineer, Cloud Architect, Full-Stack Developer—identifying concrete skill gaps and surfacing targeted, high-ROI actions to reach 100% readiness.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-800 dark:border-slate-800 light:border-sky-100 flex items-center gap-3 text-xs text-indigo-400 font-medium">
              <LineChart className="w-4 h-4" /> Empirical Readiness Analysis
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
