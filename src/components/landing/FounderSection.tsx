import React from 'react';
import { GraduationCap, Sparkles, BookOpen, Compass, Code, Terminal } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const FounderSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-slate-950/40 dark:bg-slate-950/40 light:bg-sky-50/40 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="blue" size="md" className="mb-4">
            About the Founder
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Built by a Student Engineer, For Student Engineers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            Created to solve the fundamental disconnect between academic curricula and actual technical hiring requirements.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 sm:p-10 relative overflow-hidden border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Founder Avatar & Badge */}
              <div className="flex flex-col items-center shrink-0 text-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-1 shadow-xl shadow-blue-500/20 mb-4">
                  <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-blue-400 font-bold text-3xl font-mono">
                    VS
                  </div>
                </div>
                <Badge variant="emerald" size="sm" dot>
                  Creator & Founder
                </Badge>
              </div>

              {/* Founder Details */}
              <div className="space-y-4 text-left flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                    Vangala Sricharan
                  </h3>
                  <p className="text-sm font-medium text-blue-400 dark:text-blue-400 light:text-blue-600 mt-0.5">
                    Founder, Student Digital Twin
                  </p>
                </div>

                {/* Academic & Career Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                  <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-100/60 border border-slate-800/80 dark:border-slate-800 light:border-sky-200">
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      <span>University</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                      Marwadi University
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-100/60 border border-slate-800/80 dark:border-slate-800 light:border-sky-200">
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Academic Program</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                      B.Tech CSE (AI/ML) · 2nd Year
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-100/60 border border-slate-800/80 dark:border-slate-800 light:border-sky-200 sm:col-span-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Career Focus & Specialty</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                      AI/ML Engineer · Distributed Intelligence & Generative AI Systems
                    </p>
                  </div>
                </div>

                {/* Bio & Vision Statement */}
                <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed pt-1">
                  "As a computer science student specializing in AI/ML, I experienced firsthand how traditional resumes fail to capture technical velocity, real codebase depth, and true problem-solving capacity. Student Digital Twin was architected as an active operating system that converts student progress into verified, quantifiable readiness."
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" /> AI/ML Engineering
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-indigo-400" /> Graph Ontologies
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Real Career Intelligence
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
