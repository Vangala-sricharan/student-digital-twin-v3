import React, { useState } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  BookOpen,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Github,
  Linkedin,
  Code2,
  FileText,
  Lock,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { OnboardingFormData } from '../../types';

interface OnboardingFlowProps {
  initialName: string;
  initialEmail: string;
  onComplete: (data: OnboardingFormData) => Promise<{ success: boolean; error: Error | null }>;
  isSubmitting?: boolean;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialName,
  initialEmail,
  onComplete,
  isSubmitting = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<OnboardingFormData>({
    fullName: initialName || '',
    email: initialEmail || '',
    university: '',
    degree: 'B.Tech',
    branch: '',
    year: '1st Year',
    expectedGraduationYear: String(currentYear + 4),
    careerGoal: '',
    targetRole: '',
    currentSkills: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const degreeOptions = [
    'B.Tech',
    'B.E.',
    'B.S. / B.Sc',
    'BCA',
    'M.Tech',
    'M.S. / M.Sc',
    'MCA',
    'MBA',
    'Ph.D.',
    'Other Degree',
  ];

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Final Year',
    'Postgraduate / Masters',
    'Recent Graduate',
  ];

  const gradYearOptions = [
    String(currentYear),
    String(currentYear + 1),
    String(currentYear + 2),
    String(currentYear + 3),
    String(currentYear + 4),
    String(currentYear + 5),
    String(currentYear + 6),
  ];

  const skillSuggestions = [
    'Python',
    'React',
    'TypeScript',
    'JavaScript',
    'Java',
    'C++',
    'DSA',
    'SQL',
    'Node.js',
    'Machine Learning',
    'Cloud / AWS',
    'Git / GitHub',
  ];

  const handleAddSkillTag = (skill: string) => {
    const existing = formData.currentSkills
      ? formData.currentSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!existing.includes(skill)) {
      const updated = [...existing, skill].join(', ');
      setFormData((prev) => ({ ...prev, currentSkills: updated }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation for required fields
    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }
    if (!formData.university.trim()) {
      setErrorMsg('Please enter your University or College name.');
      return;
    }
    if (!formData.degree.trim()) {
      setErrorMsg('Please select your Degree.');
      return;
    }
    if (!formData.branch.trim()) {
      setErrorMsg('Please enter your Branch / Specialization.');
      return;
    }
    if (!formData.year.trim()) {
      setErrorMsg('Please select your Current Academic Year.');
      return;
    }
    if (!formData.expectedGraduationYear.trim()) {
      setErrorMsg('Please select your Expected Graduation Year.');
      return;
    }
    if (!formData.careerGoal.trim()) {
      setErrorMsg('Please enter your Career Goal or Target Role.');
      return;
    }

    const payload: OnboardingFormData = {
      ...formData,
      email: initialEmail || formData.email,
      fullName: formData.fullName.trim(),
      university: formData.university.trim(),
      degree: formData.degree.trim(),
      branch: formData.branch.trim(),
      year: formData.year.trim(),
      expectedGraduationYear: formData.expectedGraduationYear.trim(),
      careerGoal: formData.careerGoal.trim(),
      targetRole: formData.targetRole?.trim() || formData.careerGoal.trim(),
      currentSkills: formData.currentSkills?.trim() || '',
      bio: formData.bio?.trim() || '',
      githubUrl: formData.githubUrl?.trim() || '',
      linkedinUrl: formData.linkedinUrl?.trim() || '',
    };

    const result = await onComplete(payload);
    if (!result.success && result.error) {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl my-6">
        <Card className="p-6 sm:p-8 border-slate-700 dark:border-slate-800 light:border-sky-200 shadow-2xl bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 max-h-[92vh] overflow-y-auto">
          {/* Top Banner & Header */}
          <div className="flex items-start justify-between pb-5 mb-6 border-b border-white/10 dark:border-white/10 light:border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="blue" size="sm" dot>
                  FIRST-TIME PROFILE SETUP
                </Badge>
                <span className="text-xs text-slate-400">Step 1 of 1</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-2">
                Build Your Student Digital Twin
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                Tell us a little about yourself to personalize your career workspace.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Academic Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-white/5 dark:border-white/5 light:border-slate-100">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700">
                  1. Academic Identity & Contact
                </span>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-fullname"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Alex Johnson"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-only
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-email"
                      type="email"
                      readOnly
                      disabled
                      value={initialEmail || formData.email}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* University / College */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                  University / College <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    id="onboarding-university"
                    type="text"
                    required
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="e.g. Indian Institute of Technology / Stanford University"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Degree, Branch, Current Year, Expected Grad Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    Degree <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="onboarding-degree"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {degreeOptions.map((deg) => (
                      <option key={deg} value={deg} className="bg-slate-900 text-white">
                        {deg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    Branch / Specialization <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="onboarding-branch"
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Computer Science (AI/ML)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    Current Year <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <select
                      id="onboarding-year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr} className="bg-slate-900 text-white">
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    Graduation Year <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <select
                      id="onboarding-grad-year"
                      value={formData.expectedGraduationYear}
                      onChange={(e) => setFormData({ ...formData, expectedGraduationYear: e.target.value })}
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {gradYearOptions.map((gy) => (
                        <option key={gy} value={gy} className="bg-slate-900 text-white">
                          {gy}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Career Goal & Current Skills */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-white/5 dark:border-white/5 light:border-slate-100">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700">
                  2. Career Goals & Skills
                </span>
              </div>

              {/* Career Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                  Career Goal / Target Role <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Target className="w-4 h-4" />
                  </div>
                  <input
                    id="onboarding-career-goal"
                    type="text"
                    required
                    value={formData.careerGoal}
                    onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                    placeholder="e.g. AI/ML Engineer, Full Stack Developer, Data Scientist, Cloud Architect"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Current Skills with suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                  Current Skills (comma-separated)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <input
                    id="onboarding-skills"
                    type="text"
                    value={formData.currentSkills}
                    onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
                    placeholder="e.g. Python, React, TypeScript, SQL, Machine Learning"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                {/* Skill tag suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 py-0.5">Quick add:</span>
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkillTag(skill)}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-blue-200 border border-slate-700 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Bio / About */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                  Short Bio / About Yourself (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    id="onboarding-bio"
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell your digital twin about your core technical interests, passions, and background..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Professional Links */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-white/5 dark:border-white/5 light:border-slate-100">
                <Github className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700">
                  3. Online Profiles (Optional)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    GitHub URL (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Github className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-github"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
                    LinkedIn URL (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-linkedin"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 dark:border-white/10 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span className="text-emerald-400 font-semibold">Free Plan (₹0)</span> included with AI Assistant & twin calibration.
              </div>
              <Button
                id="onboarding-submit-btn"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full sm:w-auto px-8"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Create My Student Twin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
