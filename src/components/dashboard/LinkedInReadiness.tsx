import React, { useState, useEffect } from 'react';
import {
  Linkedin,
  Sparkles,
  RefreshCw,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { LinkedInReadinessResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface LinkedInReadinessProps {
  isDemo?: boolean;
}

export const LinkedInReadiness: React.FC<LinkedInReadinessProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile } = useStudentTwin();

  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => {
    return activeStudentProfile?.linkedinUrl || 'https://linkedin.com/in/student';
  });
  const [profileText, setProfileText] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<LinkedInReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with active student profile
  useEffect(() => {
    if (activeStudentProfile?.linkedinUrl) {
      setLinkedinUrl(activeStudentProfile.linkedinUrl);
    }
  }, [activeStudentProfile?.linkedinUrl]);

  // Load cached analysis
  useEffect(() => {
    if (!linkedinUrl) return;
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const normalizedUrl = linkedinUrl.toLowerCase().trim().replace(/\/$/, '');
    const cached = aiService.getSavedEntityAnalysis<LinkedInReadinessResult>(
      userId,
      'linkedin',
      normalizedUrl
    );
    if (cached) {
      setAnalysisResult(cached);
    } else {
      setAnalysisResult(null);
    }
  }, [linkedinUrl, user?.id, isDemo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF exported from your LinkedIn profile.');
      return;
    }

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : '';
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAudit = async () => {
    if (!linkedinUrl.trim()) {
      setErrorMessage('Please provide your LinkedIn profile URL.');
      return;
    }

    if (!profileText.trim() && !pdfBase64) {
      setErrorMessage('Because LinkedIn requires user login authentication, please paste your profile text or upload your LinkedIn exported PDF (Profile → More → Save to PDF).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeLinkedIn({
      linkedinUrl: linkedinUrl.trim(),
      profileText: profileText.trim() || undefined,
      profileBase64: pdfBase64 || undefined,
      targetRole: activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Software Engineer',
      userId,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setAnalysisResult(res.data);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0077b5] flex items-center justify-center text-white shadow-md shadow-[#0077b5]/20">
              <Linkedin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  LinkedIn Profile Readiness Auditor
                </h1>
                <Badge variant="blue" size="sm">
                  9-DIMENSION RECRUITER AUDIT
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Evaluates headline positioning, about section storytelling, featured projects, and inbound recruiter attraction.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Profile Input & Evidence
            </h2>

            {/* LinkedIn URL */}
            <div>
              <label htmlFor="linkedin-url" className="text-xs font-semibold text-slate-400 block mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-[#0077b5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="linkedin-url"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-[#0077b5]"
                />
              </div>
            </div>

            {/* LinkedIn Auth Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                <strong>LinkedIn Privacy Note:</strong> LinkedIn strictly restricts automated scraping. For a 100% accurate recruiter audit, paste your profile text or upload your LinkedIn exported PDF (Profile → More → Save to PDF).
              </span>
            </div>

            {/* File Upload / PDF Option */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                Option A: Upload LinkedIn PDF
              </span>
              <label
                htmlFor="linkedin-pdf-input"
                className="border-2 border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center transition-colors bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {pdfFileName ? `Loaded: ${pdfFileName}` : 'Choose or drag LinkedIn PDF export'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Supports standard .pdf exports</span>
                <input
                  id="linkedin-pdf-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Text Paste Option */}
            <div>
              <label htmlFor="linkedin-text-input" className="text-xs font-semibold text-slate-400 block mb-1.5">
                Option B: Paste Profile Content
              </label>
              <textarea
                id="linkedin-text-input"
                rows={5}
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Paste your Headline, About, Experience, and Skills sections here..."
                className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-[#0077b5] resize-none"
              />
            </div>

            {/* Run Audit Button */}
            <Button
              id="audit-linkedin-btn"
              variant="primary"
              size="md"
              onClick={handleRunAudit}
              disabled={isLoading}
              className="w-full justify-center bg-[#0077b5] hover:bg-[#006097]"
              leftIcon={
                isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isLoading ? 'Auditing LinkedIn Profile...' : 'Run LinkedIn Recruiter Audit'}
            </Button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="space-y-6">
              {/* Score Banner */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Recruiter Attraction & Readiness Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {analysisResult.overallScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${getScoreColor(
                      analysisResult.overallScore
                    )}`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold block">Assessment</span>
                      <span className="text-xs font-bold">
                        {analysisResult.overallScore >= 80
                          ? 'High Recruiter Inbound'
                          : analysisResult.overallScore >= 60
                          ? 'Good Foundation'
                          : analysisResult.overallScore >= 40
                          ? 'Needs Positioning'
                          : 'Early Stage'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 9 Category Rubric Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Completeness</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.profileCompleteness} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Headline Positioning</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.headlinePositioning} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">About Section</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.aboutSection} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Skills Endorsements</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.skillsEndorsements} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Projects & Featured</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.projectsPortfolio} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Experience</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categoryScores.experienceInternships} / 10
                    </span>
                  </div>
                </div>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile Strengths</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {analysisResult.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5 space-y-3 border-rose-500/20 bg-rose-950/10">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Gaps</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                    {analysisResult.weaknesses.map((wk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Improvements */}
              <Card className="p-5 space-y-3 border-blue-500/20 bg-blue-950/10">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>High Impact Profile Adjustments</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {analysisResult.highestImpactImprovements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">#{idx + 1}</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recruiter Tips */}
              <Card className="p-5 space-y-3 border-indigo-500/20 bg-indigo-950/10">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>Recruiter Search Algorithm Optimization</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {analysisResult.recruiterFacingTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center mb-4 border border-[#0077b5]/20">
                <Linkedin className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Audit Your LinkedIn Positioning
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                Upload your LinkedIn profile export or paste your text on the left to evaluate how tech recruiters and algorithmic searches evaluate your profile.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
