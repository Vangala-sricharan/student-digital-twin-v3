import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import {
  Globe,
  Sparkles,
  Download,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileText,
  Layers,
  Palette,
  Eye,
  RefreshCw,
  Copy,
  Lock,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  FolderArchive,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserPortfolioRecord,
  GeneratedPortfolioData,
  PortfolioThemeId,
} from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  generatePortfolioFiles,
  createPortfolioZipBlob,
  generatePreviewHtmlDoc,
  PortfolioFilesBundle,
} from '../../utils/portfolioGenerator';
import { DEMO_PORTFOLIO_RECORD } from '../../constants/demoData';

interface PortfolioBuilderProps {
  isDemo?: boolean;
  onOpenUpgradeModal?: () => void;
}

// Memoized preview iframe container to prevent unnecessary parent re-renders and iframe flickering
const PortfolioLivePreviewFrame = memo(({
  htmlDoc,
  viewport,
}: {
  htmlDoc: string;
  viewport: 'desktop' | 'tablet' | 'mobile';
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && htmlDoc) {
      iframeRef.current.srcdoc = htmlDoc;
    }
  }, [htmlDoc]);

  return (
    <div className="flex justify-center bg-slate-950/80 rounded-2xl border border-slate-800 p-4 sm:p-6 overflow-hidden">
      <div
        className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${
          viewport === 'desktop'
            ? 'w-full max-w-5xl h-[700px]'
            : viewport === 'tablet'
            ? 'w-[768px] h-[700px]'
            : 'w-[375px] h-[650px]'
        }`}
      >
        <iframe
          ref={iframeRef}
          title="Portfolio Live Preview"
          className="w-full h-full border-none bg-[#0b0f19]"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
});
PortfolioLivePreviewFrame.displayName = 'PortfolioLivePreviewFrame';

// Memoized Code Inspector
const PortfolioCodeInspector = memo(({
  filesBundle,
  activeCodeTab,
  onSelectTab,
  copiedFile,
  onCopyFile,
}: {
  filesBundle: PortfolioFilesBundle;
  activeCodeTab: 'index.html' | 'style.css' | 'script.js' | 'README.md';
  onSelectTab: (tab: 'index.html' | 'style.css' | 'script.js' | 'README.md') => void;
  copiedFile: string | null;
  onCopyFile: (filename: 'index.html' | 'style.css' | 'script.js' | 'README.md') => void;
}) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Inspect & Copy Generated Files
          </h4>
          <p className="text-xs text-slate-400">
            Inspect the source code of each file in your portfolio bundle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCopyFile(activeCodeTab)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {copiedFile === activeCodeTab ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied {activeCodeTab}!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy {activeCodeTab}</span>
            </>
          )}
        </button>
      </div>

      {/* File code tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 mb-3">
        {(['index.html', 'style.css', 'script.js', 'README.md'] as const).map((filename) => (
          <button
            key={filename}
            type="button"
            onClick={() => onSelectTab(filename)}
            className={`px-3.5 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors ${
              activeCodeTab === filename
                ? 'bg-slate-950 text-blue-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {filename}
          </button>
        ))}
      </div>

      {/* Code view */}
      <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800 select-text leading-relaxed">
        <code>{filesBundle[activeCodeTab]}</code>
      </pre>
    </Card>
  );
});
PortfolioCodeInspector.displayName = 'PortfolioCodeInspector';

export const PortfolioBuilder: React.FC<PortfolioBuilderProps> = ({
  isDemo = false,
  onOpenUpgradeModal,
}) => {
  const { user } = useAuth();
  const {
    userProfile,
    isPro,
    studentProfiles,
    activeStudentProfile,
    allSkills,
    allProjects,
    allAchievements,
    allCareerGoals,
    savePortfolioRecord,
  } = useStudentTwin();

  const currentRecord: UserPortfolioRecord = useMemo(() => {
    if (isDemo) {
      return userProfile?.portfolio || DEMO_PORTFOLIO_RECORD;
    }
    return (
      userProfile?.portfolio || {
        portfolioType: 'none',
        updatedAt: new Date().toISOString(),
      }
    );
  }, [isDemo, userProfile?.portfolio]);

  // Form states
  const [activeTab, setActiveTab] = useState<'build' | 'connect' | 'preview'>('build');
  const [externalUrlInput, setExternalUrlInput] = useState(
    currentRecord.externalUrl || (isDemo ? 'https://vangala-sricharan-portfolio.vercel.app/' : '')
  );
  const [selectedTheme, setSelectedTheme] = useState<PortfolioThemeId>(
    currentRecord.generatedPortfolio?.theme || 'modern-minimal'
  );
  const [generatedData, setGeneratedData] = useState<GeneratedPortfolioData | null>(
    currentRecord.generatedPortfolio || null
  );

  // Operation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeCodeTab, setActiveCodeTab] = useState<'index.html' | 'style.css' | 'script.js' | 'README.md'>('index.html');

  // Generation abort controller & requestId ref to prevent race conditions and stale overwrites
  const activeGenerationAbortRef = useRef<AbortController | null>(null);
  const generationRequestIdRef = useRef<number>(0);

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      if (activeGenerationAbortRef.current) {
        activeGenerationAbortRef.current.abort();
      }
    };
  }, []);

  // Sync initial state only when external record changes meaningfully
  const lastRecordRef = useRef<UserPortfolioRecord | null>(null);
  useEffect(() => {
    if (lastRecordRef.current?.externalUrl !== currentRecord.externalUrl && currentRecord.externalUrl) {
      setExternalUrlInput(currentRecord.externalUrl);
    }
    if (lastRecordRef.current?.generatedPortfolio !== currentRecord.generatedPortfolio && currentRecord.generatedPortfolio) {
      setGeneratedData(currentRecord.generatedPortfolio);
      if (currentRecord.generatedPortfolio.theme) {
        setSelectedTheme(currentRecord.generatedPortfolio.theme);
      }
    }
    lastRecordRef.current = currentRecord;
  }, [currentRecord]);

  // Memoize generated files bundle - only recomputes when data or theme changes
  const filesBundle: PortfolioFilesBundle | null = useMemo(() => {
    if (!generatedData) return null;
    return generatePortfolioFiles({
      ...generatedData,
      theme: selectedTheme,
    });
  }, [generatedData, selectedTheme]);

  // Memoize the compiled preview HTML document
  const previewHtmlDoc = useMemo(() => {
    if (!filesBundle) return '';
    return generatePreviewHtmlDoc(filesBundle);
  }, [filesBundle]);

  const hasProAccess = isPro || isDemo;

  // Handle saving external URL (Option A)
  const handleSaveExternalUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = externalUrlInput.trim();

    if (!url) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid website URL.' });
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setStatusMessage({
        type: 'error',
        text: 'URL must begin with https:// or http:// (e.g. https://myportfolio.com)',
      });
      return;
    }

    setIsSavingUrl(true);
    setStatusMessage(null);

    const updatedRecord: UserPortfolioRecord = {
      ...currentRecord,
      portfolioType: 'external',
      externalUrl: url,
      updatedAt: new Date().toISOString(),
    };

    const res = await savePortfolioRecord(updatedRecord);
    setIsSavingUrl(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'External portfolio URL successfully saved & linked to your Digital Twin!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error?.message || 'Failed to save portfolio URL.',
      });
    }
  };

  // Handle generating portfolio from Student Twin (Option B) with race-condition protection and abort controller
  const handleGeneratePortfolio = useCallback(async () => {
    // Abort any existing in-flight portfolio generation request
    if (activeGenerationAbortRef.current) {
      activeGenerationAbortRef.current.abort();
    }
    const abortController = new AbortController();
    activeGenerationAbortRef.current = abortController;

    const currentRequestId = ++generationRequestIdRef.current;

    setIsGenerating(true);
    setStatusMessage({ type: 'info', text: 'Synthesizing your Digital Twin into a 4-file portfolio...' });

    try {
      // Build lightweight payload for the ONE fast AI call
      const payload = {
        theme: selectedTheme,
        profile: {
          fullName: userProfile?.fullName || activeStudentProfile?.name || 'Student Engineer',
          careerGoal: userProfile?.careerGoal || activeStudentProfile?.careerGoal || 'Software Engineer',
          targetRole: userProfile?.targetRole || activeStudentProfile?.targetRole || 'Software Engineering Aspirant',
          university: userProfile?.university || activeStudentProfile?.university || 'University',
          degree: userProfile?.degree || activeStudentProfile?.degree || 'B.Tech',
          branch: userProfile?.branch || activeStudentProfile?.branch || 'Computer Science',
          year: userProfile?.year || activeStudentProfile?.year || '2026',
          bio: userProfile?.bio || '',
          location: userProfile?.location || 'India',
          email: userProfile?.email || user?.email || '',
          phone: userProfile?.phone || '',
          githubUrl: userProfile?.githubUrl || activeStudentProfile?.githubUrl || '',
          linkedinUrl: userProfile?.linkedinUrl || activeStudentProfile?.linkedinUrl || '',
          profileImageUrl: userProfile?.profileImageUrl || '',
        },
        skills: allSkills.map((s) => ({ name: s.skillName, category: s.category })),
        projects: allProjects.map((p) => ({
          title: p.title,
          description: p.description,
          role: p.role,
          techStack: p.techStack,
          githubUrl: p.githubUrl,
          liveDemoUrl: p.liveDemoUrl,
          metrics: p.metrics,
        })),
        achievements: allAchievements.map((a) => ({
          title: a.title,
          organization: a.organization,
          date: a.date,
          description: a.description,
        })),
        careerGoals: allCareerGoals.map((g) => ({
          targetRole: g.targetRole,
          timeline: g.timeline,
          targetCompanies: g.targetCompanies,
        })),
      };

      const response = await fetch('/api/ai/portfolio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: abortController.signal,
      });

      const responseText = await response.text();
      let json: any = null;
      try {
        json = responseText ? JSON.parse(responseText) : null;
      } catch (parseErr) {
        console.warn('[PortfolioBuilder] Response is not standard JSON:', responseText);
      }

      // Check if another generation started while this was in-flight
      if (generationRequestIdRef.current !== currentRequestId) {
        return;
      }

      if (!response.ok) {
        const errorMsg = json?.error || json?.message || `HTTP ${response.status}: Failed to generate portfolio package.`;
        console.error('[PortfolioBuilder] HTTP error from /api/ai/portfolio/generate:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: json || responseText,
        });
        throw new Error(errorMsg);
      }

      let generated: GeneratedPortfolioData | null =
        json?.portfolioData ||
        (json?.hero && json?.about ? (json as GeneratedPortfolioData) : null);

      // Fallback synthesis if response was empty or partial
      if (!generated || !generated.hero) {
        console.warn('[PortfolioBuilder] Falling back to verified Student Twin synthesis:', json);
        generated = {
          theme: selectedTheme,
          hero: {
            name: payload.profile.fullName,
            tagline: `${payload.profile.targetRole} | Engineering Student`,
            location: payload.profile.location,
            bio: payload.profile.bio || `Student engineer specializing in ${payload.profile.targetRole}.`,
            availableForRoles: [payload.profile.targetRole, 'Software Engineer', 'Full-Stack Developer'],
            avatarUrl: payload.profile.profileImageUrl || '',
          },
          about: {
            summary:
              payload.profile.bio ||
              `Passionate engineer and problem solver dedicated to building robust software systems and advancing technical expertise.`,
            education: {
              university: payload.profile.university,
              degree: payload.profile.degree,
              branch: payload.profile.branch,
              year: payload.profile.year,
            },
            careerAspirations: `Aiming to excel as a high-impact ${payload.profile.targetRole}.`,
          },
          skills: [
            {
              category: 'Technical Skills',
              items: payload.skills.map((s) => s.name),
            },
          ],
          featuredProjects: payload.projects.map((p, idx) => ({
            id: `proj_${idx}`,
            title: p.title,
            role: p.role || 'Developer',
            description: p.description,
            techStack: p.techStack || [],
            githubUrl: p.githubUrl || '',
            liveDemoUrl: p.liveDemoUrl || '',
            highlights: ['Designed and engineered core technical implementation', 'Applied modular software architecture'],
          })),
          achievements: payload.achievements.map((a, idx) => ({
            id: `ach_${idx}`,
            title: a.title,
            organization: a.organization,
            date: a.date,
            description: a.description,
          })),
          careerGoals: payload.careerGoals.map((g) => ({
            targetRole: g.targetRole,
            timeline: g.timeline,
            targetCompanies: g.targetCompanies || [],
          })),
          socialLinks: {
            githubUrl: payload.profile.githubUrl,
            linkedinUrl: payload.profile.linkedinUrl,
            email: payload.profile.email,
            phone: payload.profile.phone,
          },
          generatedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
        };
      }

      // Check again if superseded before committing state
      if (generationRequestIdRef.current !== currentRequestId) {
        return;
      }

      setGeneratedData(generated);

      // Persist to context and cloud
      const updatedRecord: UserPortfolioRecord = {
        ...currentRecord,
        portfolioType: 'generated',
        generatedPortfolio: generated,
        updatedAt: new Date().toISOString(),
      };

      await savePortfolioRecord(updatedRecord);

      setIsGenerating(false);
      setStatusMessage({
        type: 'success',
        text: 'Portfolio generated successfully! Preview it below or download the 4-file ZIP.',
      });
      setActiveTab('preview');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Silently ignore aborted requests
        return;
      }

      // Only update error UI if this is the active request
      if (generationRequestIdRef.current === currentRequestId) {
        console.error('[PortfolioBuilder] generation pipeline error:', {
          message: err.message,
          stack: err.stack,
          rawError: err,
        });
        setIsGenerating(false);
        setStatusMessage({
          type: 'error',
          text: err.message || 'Portfolio generation failed. Please try again.',
        });
      }
    }
  }, [
    selectedTheme,
    userProfile,
    activeStudentProfile,
    user,
    allSkills,
    allProjects,
    allAchievements,
    allCareerGoals,
    currentRecord,
    savePortfolioRecord,
  ]);

  // Handle Download ZIP
  const handleDownloadZip = useCallback(async () => {
    if (!filesBundle) return;
    setIsDownloadingZip(true);

    try {
      const blob = await createPortfolioZipBlob(filesBundle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `${(userProfile?.fullName || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')}-portfolio.zip`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDownloadingZip(false);
      setStatusMessage({
        type: 'success',
        text: `Downloaded ${filename} containing index.html, style.css, script.js, and README.md!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('[PortfolioBuilder] zip error:', err);
      setIsDownloadingZip(false);
      setStatusMessage({
        type: 'error',
        text: 'Failed to create ZIP file.',
      });
    }
  }, [filesBundle, userProfile?.fullName]);

  // Handle copy file contents
  const handleCopyFileContent = useCallback((filename: 'index.html' | 'style.css' | 'script.js' | 'README.md') => {
    if (!filesBundle) return;
    navigator.clipboard.writeText(filesBundle[filename]);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2500);
  }, [filesBundle]);

  // Lock card for Free Users
  if (!hasProAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            AI Portfolio Builder
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Showcase your Digital Twin as a professional, recruiter-ready website.
          </p>
        </div>

        <Card className="p-8 sm:p-12 text-center max-w-2xl mx-auto border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-slate-950/40">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <Badge variant="blue" size="md" className="mb-4">
            STUDENT PRO EXCLUSIVE
          </Badge>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-3">
            AI Portfolio & Custom Web Links
          </h2>

          <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed max-w-lg mx-auto mb-6">
            Generate an executive 4-file static portfolio directly from your Student Twin records, or connect your existing portfolio URL with automatic cloud synchronization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto mb-8">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-blue-400 font-bold block mb-1">⚡ 1-Click Generation</span>
              <span className="text-slate-400">Creates index.html, style.css, script.js & README.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-emerald-400 font-bold block mb-1">📦 ZIP Export</span>
              <span className="text-slate-400">Deploy free on Vercel or Netlify in 60 seconds.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-amber-400 font-bold block mb-1">🔗 Custom URL</span>
              <span className="text-slate-400">Link your existing portfolio or personal domain.</span>
            </div>
          </div>

          <Button
            id="portfolio-upgrade-pro-btn"
            variant="primary"
            size="lg"
            onClick={onOpenUpgradeModal}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
            className="shadow-xl shadow-blue-500/20"
          >
            Upgrade to Student Pro to Unlock
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
              AI Portfolio
            </h1>
            <Badge variant="blue" size="sm">
              PRO FEATURE
            </Badge>
            {isDemo && (
              <Badge variant="amber" size="sm">
                DEMO SHOWCASE
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Showcase your Digital Twin as a professional portfolio.
          </p>
        </div>

        {/* Action quick links */}
        <div className="flex items-center gap-2">
          {currentRecord.externalUrl && (
            <a
              id="portfolio-view-external-btn"
              href={currentRecord.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
            >
              <span>View Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border transition-all ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
        <button
          id="portfolio-tab-build"
          onClick={() => setActiveTab('build')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'build'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Build from Digital Twin (Option B)</span>
        </button>

        <button
          id="portfolio-tab-connect"
          onClick={() => setActiveTab('connect')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'connect'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Connect Existing Portfolio (Option A)</span>
        </button>

        {generatedData && (
          <button
            id="portfolio-tab-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Preview & 4-File Code</span>
          </button>
        )}
      </div>

      {/* TAB 1: BUILD MY PORTFOLIO (OPTION B) */}
      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                    One-Click Digital Twin Portfolio Generator
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Synthesize your foundation, verified skills, featured projects, and achievements into a standalone 4-file website.
                  </p>
                </div>
                <Badge variant="emerald" size="sm">
                  LIGHTWEIGHT AI
                </Badge>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300">
                  <span className="text-[11px] text-slate-400 block font-medium">Candidate</span>
                  <strong className="text-xs text-slate-200 truncate block mt-0.5">
                    {userProfile?.fullName || 'Student User'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300">
                  <span className="text-[11px] text-slate-400 block font-medium">Target Role</span>
                  <strong className="text-xs text-blue-400 truncate block mt-0.5">
                    {userProfile?.targetRole || userProfile?.careerGoal || 'Software Engineer'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300">
                  <span className="text-[11px] text-slate-400 block font-medium">Active Skills</span>
                  <strong className="text-xs text-slate-200 block mt-0.5">
                    {allSkills.length} Verified
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300">
                  <span className="text-[11px] text-slate-400 block font-medium">Projects</span>
                  <strong className="text-xs text-emerald-400 block mt-0.5">
                    {allProjects.length} Projects
                  </strong>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700">
                  Select Visual Aesthetic / Design Theme:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'modern-minimal', name: 'Modern Minimal', desc: 'Slate & Cobalt Blue', color: 'from-blue-600 to-indigo-600' },
                    { id: 'cyber-dark', name: 'Cyber Matrix', desc: 'Emerald & Deep Black', color: 'from-emerald-600 to-teal-700' },
                    { id: 'emerald-tech', name: 'Ocean Tech', desc: 'Cyan & Deep Teal', color: 'from-cyan-600 to-blue-700' },
                    { id: 'editorial-clean', name: 'Editorial Slate', desc: 'Amber & Warm Black', color: 'from-amber-600 to-orange-700' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id as PortfolioThemeId)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        selectedTheme === t.id
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                      }`}
                    >
                      <div className={`w-full h-3 rounded-md bg-gradient-to-r ${t.color} mb-2`}></div>
                      <strong className="text-xs text-slate-200 block">{t.name}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{t.desc}</span>
                      {selectedTheme === t.id && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Trigger */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <div className="text-xs text-slate-400">
                  <span>Fast, structured AI generation (no heavy frameworks or long wait times).</span>
                </div>
                <Button
                  id="portfolio-build-trigger-btn"
                  variant="primary"
                  size="md"
                  onClick={handleGeneratePortfolio}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  {isGenerating ? 'Building Portfolio...' : 'Build My Portfolio'}
                </Button>
              </div>
            </Card>

            {/* Generated Bundle Overview */}
            {generatedData && filesBundle && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                        Generated 4-File Package Ready
                      </h4>
                      <span className="text-xs text-slate-400">
                        Zero dependencies • Pure static HTML/CSS/JS
                      </span>
                    </div>
                  </div>
                  <Button
                    id="portfolio-download-zip-btn"
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    isLoading={isDownloadingZip}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download ZIP (4 Files)
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-mono font-bold mb-1">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>index.html</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Semantic & accessible markup</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-bold mb-1">
                      <Palette className="w-3.5 h-3.5" />
                      <span>style.css</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Responsive tokens & cards</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>script.js</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Mobile menu & smooth scroll</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold mb-1">
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>README.md</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Vercel & Netlify guide</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Deployment Instructions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deploy Free in 3 Steps</span>
              </h3>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-100 block mb-0.5">Download the ZIP</strong>
                    <span className="text-slate-400">
                      Click Download ZIP to get the 4 production-ready static files.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-100 block mb-0.5">Upload to GitHub</strong>
                    <span className="text-slate-400">
                      Create a public repo on GitHub and drag & drop the 4 files.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-100 block mb-0.5">Connect to Vercel</strong>
                    <span className="text-slate-400">
                      Import your repo in Vercel to get a live URL (e.g. yourname.vercel.app).
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('connect')}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Already have a live URL? Connect it here</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECT EXISTING PORTFOLIO (OPTION A) */}
      {activeTab === 'connect' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Connect Your Existing Portfolio Website
                </h3>
                <p className="text-xs text-slate-400">
                  Already have a website on Vercel, GitHub Pages, or a custom domain? Link it here.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveExternalUrl} className="space-y-4">
              <div>
                <label
                  htmlFor="portfolio-external-url-input"
                  className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1"
                >
                  Portfolio Website URL <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    id="portfolio-external-url-input"
                    type="url"
                    required
                    value={externalUrlInput}
                    onChange={(e) => setExternalUrlInput(e.target.value)}
                    placeholder="https://username.vercel.app or https://myportfolio.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50/70 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Example: https://vangala-sricharan-portfolio.vercel.app/
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  id="portfolio-save-url-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingUrl}
                  isLoading={isSavingUrl}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save & Connect Portfolio
                </Button>

                {externalUrlInput && (
                  <a
                    href={externalUrlInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </form>

            {currentRecord.externalUrl && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Currently Linked URL:</span>
                  <Badge variant="emerald" size="sm">
                    ACTIVE LINK
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-200 truncate mr-2">
                    {currentRecord.externalUrl}
                  </span>
                  <a
                    href={currentRecord.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: INTERACTIVE PREVIEW & 4-FILE CODE */}
      {activeTab === 'preview' && filesBundle && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Live Portfolio Preview</span>
              </span>

              {/* Viewport switcher */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    previewViewport === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    previewViewport === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    previewViewport === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme quick switch */}
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as PortfolioThemeId)}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="modern-minimal">Theme: Modern Minimal</option>
                <option value="cyber-dark">Theme: Cyber Matrix</option>
                <option value="emerald-tech">Theme: Ocean Tech</option>
                <option value="editorial-clean">Theme: Editorial Slate</option>
              </select>

              <Button
                id="preview-download-zip-btn"
                variant="primary"
                size="sm"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                isLoading={isDownloadingZip}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download ZIP
              </Button>
            </div>
          </div>

          {/* Iframe Preview Canvas (Memoized Component) */}
          <PortfolioLivePreviewFrame
            htmlDoc={previewHtmlDoc}
            viewport={previewViewport}
          />

          {/* 4 Files Code Inspector (Memoized Component) */}
          <PortfolioCodeInspector
            filesBundle={filesBundle}
            activeCodeTab={activeCodeTab}
            onSelectTab={setActiveCodeTab}
            copiedFile={copiedFile}
            onCopyFile={handleCopyFileContent}
          />
        </div>
      )}
    </div>
  );
};
