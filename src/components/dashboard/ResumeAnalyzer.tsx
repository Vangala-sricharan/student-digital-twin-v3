import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Tag,
  Key,
  Target,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { ResumeAnalysisResult } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface ResumeAnalyzerProps {
  isDemo?: boolean;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { activeStudentProfile } = useStudentTwin();

  const [targetRole, setTargetRole] = useState<string>(() => {
    return activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Software Engineer';
  });
  const [resumeText, setResumeText] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeStudentProfile?.targetRole) {
      setTargetRole(activeStudentProfile.targetRole);
    }
  }, [activeStudentProfile?.targetRole]);

  // Load cached latest resume analysis
  useEffect(() => {
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const cached = aiService.getSavedEntityAnalysis<ResumeAnalysisResult>(
      userId,
      'resume',
      'latest'
    );
    if (cached) {
      setAnalysisResult(cached);
    }
  }, [user?.id, isDemo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid .pdf resume file.');
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

  const handleRunAnalysis = async () => {
    if (!resumeText.trim() && !pdfBase64) {
      setErrorMessage('Please paste your resume text or upload a PDF document.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const res = await aiService.analyzeResume({
      resumeText: resumeText.trim() || undefined,
      resumeBase64: pdfBase64 || undefined,
      targetRole,
      userId,
    });

    setIsAnalyzing(false);

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  AI Resume & ATS Evaluator
                </h1>
                <Badge variant="emerald" size="sm">
                  ATS SCORING + SKILLS AUDIT
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Evaluates keyword density, STAR project bullet impact, structural ATS compliance, and role alignment.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              Upload or Paste Resume
            </h2>

            {/* Target Role Field */}
            <div>
              <label htmlFor="target-role-input" className="text-xs font-semibold text-slate-400 block mb-1">
                Target Role for ATS Optimization
              </label>
              <input
                id="target-role-input"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Engineer / ML Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs sm:text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* PDF Upload */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                Option 1: Upload Resume PDF
              </span>
              <label
                htmlFor="resume-pdf-upload"
                className="border-2 border-dashed border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center transition-colors bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {pdfFileName ? `Loaded: ${pdfFileName}` : 'Choose or drop Resume PDF'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Supports PDF format</span>
                <input
                  id="resume-pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Text Paste */}
            <div>
              <label htmlFor="resume-text-input" className="text-xs font-semibold text-slate-400 block mb-1.5">
                Option 2: Paste Raw Resume Text
              </label>
              <textarea
                id="resume-text-input"
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the text of your resume here..."
                className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-emerald-500 resize-none font-mono"
              />
            </div>

            {/* Submit Button */}
            <Button
              id="analyze-resume-btn"
              variant="primary"
              size="md"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full justify-center bg-emerald-600 hover:bg-emerald-500"
              leftIcon={
                isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isAnalyzing ? 'Evaluating Resume...' : 'Analyze Resume & ATS Score'}
            </Button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="space-y-6">
              {/* Overall Score Card */}
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Overall ATS & Resume Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        {analysisResult.overallScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">
                      Calibrated for: <strong className="text-emerald-400">{analysisResult.targetRole}</strong>
                    </span>
                  </div>

                  <div
                    className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${getScoreColor(
                      analysisResult.overallScore
                    )}`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold block">ATS Pass Level</span>
                      <span className="text-xs font-bold">
                        {analysisResult.overallScore >= 80
                          ? 'High ATS Pass Rate'
                          : analysisResult.overallScore >= 60
                          ? 'Moderate ATS Pass'
                          : analysisResult.overallScore >= 40
                          ? 'Likely Filtered'
                          : 'High Rejection Risk'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5 Rubric Categories */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Impact & Clarity</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categories.impactAndClarity} / 25
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Skills Coverage</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categories.skillsCoverage} / 25
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Project Depth</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categories.projectDepth} / 20
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">ATS Readability</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categories.atsReadability} / 15
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block truncate">Formatting</span>
                    <span className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                      {analysisResult.categories.structureAndFormatting} / 15
                    </span>
                  </div>
                </div>
              </Card>

              {/* Skills & Missing Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detected Skills */}
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Tag className="w-4 h-4" />
                    <span>Skills Detected in Resume ({analysisResult.detectedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.detectedSkills.map((sk, idx) => (
                      <Badge key={idx} variant="emerald" size="sm">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Missing Keywords */}
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <Key className="w-4 h-4" />
                    <span>Missing Industry Keywords ({analysisResult.missingKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingKeywords.map((kw, idx) => (
                      <Badge key={idx} variant="rose" size="sm">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resume Strengths</span>
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
                    <span>Weaknesses & Red Flags</span>
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

              {/* Actionable Suggestions */}
              <Card className="p-5 space-y-3 border-emerald-500/20 bg-emerald-950/10">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>Actionable Fixes to Boost ATS Score</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {analysisResult.actionableSuggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Analyze Your Resume Against ATS Algorithms
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6">
                Paste your resume text or upload a PDF to receive a comprehensive audit covering formatting, keyword alignment, and project bullet effectiveness.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
