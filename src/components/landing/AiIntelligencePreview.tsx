import React from 'react';
import { Sparkles, Brain, Cpu, TrendingUp, Search } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const AiIntelligencePreview: React.FC = () => {
  return (
    <section id="ai-intelligence" className="py-20 bg-slate-950/40 dark:bg-slate-950/40 light:bg-sky-50/40 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left information */}
          <div className="lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2">
              <Badge variant="purple" size="md">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                AI Career Intelligence Engine
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
              Adaptive Role Intelligence & Market Calibration
            </h2>
            <p className="text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
              The Digital Twin AI actively parses industry job vectors across top technology firms, quantifying matching probabilities, technical taxonomy gaps, and high-impact portfolio additions.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900">Semantic Skill Ontologies</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Maps relational bridges between foundational CS theory and modern frameworks.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900">Live Hiring Signals</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Monitors shifting prerequisites for AI/ML, Cloud Native, and Systems roles.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900">Actionable Gap Remediation</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">Suggests tangible open-source modules and project milestones to close readiness voids.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right simulated preview card */}
          <div className="lg:w-1/2 w-full">
            <Card className="p-6 border-slate-700/80 dark:border-slate-800 light:border-sky-200" glow>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 dark:border-slate-800 light:border-sky-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">Career Vector Model</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">Target: AI/ML Engineer</p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">Architecture Ready</Badge>
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/80 border border-slate-800/80 dark:border-slate-800 light:border-sky-200">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span className="text-slate-300 dark:text-slate-300 light:text-slate-700">Deep Learning & Transformer Models</span>
                    <span className="text-emerald-400">High Match</span>
                  </div>
                  <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-sky-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[85%] rounded-full" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/80 border border-slate-800/80 dark:border-slate-800 light:border-sky-200">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span className="text-slate-300 dark:text-slate-300 light:text-slate-700">Distributed Model Serving (vLLM / Triton)</span>
                    <span className="text-amber-400">Target Gap</span>
                  </div>
                  <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-sky-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[45%] rounded-full" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/80 border border-slate-800/80 dark:border-slate-800 light:border-sky-200">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span className="text-slate-300 dark:text-slate-300 light:text-slate-700">Data Engineering Pipelines (PySpark / Airflow)</span>
                    <span className="text-blue-400">Progressing</span>
                  </div>
                  <div className="w-full bg-slate-800 dark:bg-slate-800 light:bg-sky-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[70%] rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/5 light:bg-sky-100/60 border border-blue-500/20 text-xs text-blue-300 dark:text-blue-300 light:text-blue-800">
                <span className="font-semibold">Twin Recommendation:</span> Deploying an ONNX / TensorRT benchmark project will advance overall role readiness to the top tier.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
