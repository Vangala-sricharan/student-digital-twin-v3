import React from 'react';
import { UploadCloud, Cpu, Compass, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: UploadCloud,
      title: 'Ingest Signals & Evidence',
      description:
        'Upload your syllabus, project GitHub repos, certifications, and academic trajectory to establish your baseline twin identity.',
    },
    {
      step: '02',
      icon: Cpu,
      title: 'Synthesize Twin Graph',
      description:
        'The twin builds a multi-dimensional capability map connecting core technologies, practical code depth, and conceptual mastery.',
    },
    {
      step: '03',
      icon: Compass,
      title: 'AI Career Intelligence',
      description:
        'Benchmark against live hiring requirements and role competencies to pinpoint precise strengths and critical skill voids.',
    },
    {
      step: '04',
      icon: CheckCircle2,
      title: 'Execute Targeted Readiness',
      description:
        'Follow tailored project sprints, interview simulations, and verified portfolio upgrades to elevate your hiring probability.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-950/40 dark:bg-slate-950/40 light:bg-sky-50/50 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            A systematic 4-step framework transitioning students from passive learners to industry-ready engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="p-6 relative group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-blue-500/40 group-hover:text-blue-400 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
