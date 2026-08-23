import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  BookOpen,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Github,
  Linkedin,
  Phone,
  MapPin,
  FileText,
  Briefcase,
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
  const [formData, setFormData] = useState<OnboardingFormData>({
    fullName: initialName || '',
    university: '',
    degree: 'B.Tech',
    branch: '',
    year: '1st Year',
    careerGoal: '',
    targetRole: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    phone: '',
    location: '',
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const degreeOptions = [
    'B.Tech',
    'B.E.',
    'B.S. / B.Sc',
    'BCA',
    'M.Tech',
    'M.S. / M.Sc',
    'MCA',
    'Ph.D.',
    'Other Degree',
  ];

  const yearOptions = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Final Year',
    'Graduate / Alum',
  ];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate required fields
    if (!formData.fullName.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!formData.university.trim()) {
      setErrorMsg('University / College Name is required');
      return;
    }
    if (!formData.degree.trim()) {
      setErrorMsg('Degree is required');
      return;
    }
    if (!formData.branch.trim()) {
      setErrorMsg('Branch / Specialization is required (e.g. Computer Science)');
      return;
    }
    if (!formData.year.trim()) {
      setErrorMsg('Academic Year is required');
      return;
    }
    if (!formData.careerGoal.trim()) {
      setErrorMsg('Career Goal is required (e.g. AI/ML Engineer)');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = await onComplete({
      ...formData,
      targetRole: formData.targetRole?.trim() || formData.careerGoal.trim(),
    });

    if (!result.success && result.error) {
      setErrorMsg(result.error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <Card className="p-6 sm:p-8 border-slate-700 dark:border-slate-800 light:border-sky-200 shadow-2xl bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 dark:border-white/10 light:border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="blue" size="sm" dot>
                  STEP {step} OF 2
                </Badge>
                <span className="text-xs text-slate-400">Personal Onboarding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900">
                {step === 1 ? 'Initialize Your Student Digital Twin' : 'Portfolio & Social Profiles (Optional)'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
                {step === 1
                  ? 'Enter your real academic credentials. Your account starts on the Free Plan (₹0).'
                  : 'Add social profiles to calibrate your digital twin for future skills ingestion.'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
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

              {/* University */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
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

              {/* Degree & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Academic Year <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      id="onboarding-year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr} className="bg-slate-900 text-white">
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Branch / Major */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Branch / Major <span className="text-rose-400">*</span>
                </label>
                <input
                  id="onboarding-branch"
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering (AI/ML)"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Career Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Primary Career Goal <span className="text-rose-400">*</span>
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
                    placeholder="e.g. AI/ML Engineer, Full Stack Developer, Data Scientist"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  id="onboarding-next-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Next Step
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Target Role & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Target Job Role (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-target-role"
                      type="text"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                      placeholder={formData.careerGoal || 'e.g. Junior ML Engineer'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Location / City (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="onboarding-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Bengaluru, India / San Francisco, CA"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* GitHub & LinkedIn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    GitHub Profile URL (Optional)
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
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    LinkedIn Profile URL (Optional)
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

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Phone / Mobile (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="onboarding-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                  Short Bio / Aspirations (Optional)
                </label>
                <textarea
                  id="onboarding-bio"
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your digital twin about your core technical interests and projects..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-950/80 dark:bg-slate-950/80 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  id="onboarding-submit-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save & Launch Digital Twin
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
