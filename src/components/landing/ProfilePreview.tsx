import React from 'react';
import { UserCheck, Award, Code2, GraduationCap, FolderGit2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export const ProfilePreview: React.FC = () => {
  return (
    <section id="profile-preview" className="py-20 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="blue" size="md" className="mb-4">
            Unified Student Identity
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Comprehensive Digital Twin Architecture
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            A structured, holistic view combining verified technical proof, academic coursework, and career aspirations into a singular interactive persona.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
              Academic & Syllabus
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Ingests degree curriculum, semester GPA trends, relevant coursework, and specialization tracks.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="slate" size="sm">Algorithms</Badge>
              <Badge variant="slate" size="sm">Distributed Systems</Badge>
              <Badge variant="slate" size="sm">Linear Algebra</Badge>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
              Verified Skills Graph
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Multi-tiered taxonomy scoring verified via repository code depth, problem-solving, and commits.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="emerald" size="sm">Python / PyTorch</Badge>
              <Badge variant="emerald" size="sm">TypeScript</Badge>
              <Badge variant="emerald" size="sm">PostgreSQL</Badge>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
              Proof-of-Work Projects
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Detailed breakdown of architectural complexity, live demo URLs, git repos, and quantified outcomes.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="purple" size="sm">LLM Agents</Badge>
              <Badge variant="purple" size="sm">Vision Pipeline</Badge>
              <Badge variant="purple" size="sm">Cloud CI/CD</Badge>
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-2">
              Achievements & Goals
            </h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed mb-4">
              Hackathon podiums, research publications, industry certifications, and explicit role targets.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="amber" size="sm">Hackathon Winner</Badge>
              <Badge variant="amber" size="sm">AWS Certified</Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
