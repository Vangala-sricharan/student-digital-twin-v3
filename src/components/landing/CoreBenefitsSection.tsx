import React from 'react';
import { Sparkles, ShieldCheck, Zap, BarChart3, Database, GitBranch } from 'lucide-react';
import { Card } from '../common/Card';

export const CoreBenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Database,
      title: 'Unified Career Operating System',
      description:
        'Consolidate disjointed academic transcripts, code links, credentials, and achievements into one definitive digital twin source of truth.',
    },
    {
      icon: BarChart3,
      title: 'Precision Readiness Scoring',
      description:
        'Zero subjective guesswork. Receive empirical alignment scores calibrated directly against active job descriptions and engineering standards.',
    },
    {
      icon: Sparkles,
      title: 'Predictive Skill Void Detection',
      description:
        'Discover precisely which missing algorithms, frameworks, or deployment tools stand between your current profile and target internships.',
    },
    {
      icon: GitBranch,
      title: 'Proof-of-Work Verification',
      description:
        'Elevate real git repositories and architectural artifacts rather than inflated claims, building credibility with technical recruiters.',
    },
    {
      icon: Zap,
      title: 'Real-Time Career Intelligence',
      description:
        'Stay ahead of shifting market demands with AI intelligence that identifies emerging tools and high-demand specialized domains.',
    },
    {
      icon: ShieldCheck,
      title: 'Deterministic Privacy & Security',
      description:
        'Your academic and technical records remain your property with strict access boundaries and enterprise-grade isolation.',
    },
  ];

  return (
    <section id="benefits" className="py-20 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Core Benefits
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            Engineered to give students an unfair advantage in technical recruitment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="p-6 transition-all duration-200 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
