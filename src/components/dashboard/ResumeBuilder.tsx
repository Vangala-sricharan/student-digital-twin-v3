import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit3,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  MapPin,
  Target,
} from 'lucide-react';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { ResumeData, ResumeEducation, ResumeExperience, ResumeProject, ResumeAchievement } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface ResumeBuilderProps {
  isDemo?: boolean;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ isDemo = false }) => {
  const { user } = useAuth();
  const { userProfile, activeStudentProfile, skills, projects, achievements } = useStudentTwin();
  const profilePhoto = userProfile?.profileImageUrl || userProfile?.avatarUrl;

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Resume State
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    const cached = aiService.getUserResume(userId);
    if (cached) return cached;

    return {
      id: `res_${Date.now()}`,
      userId,
      studentProfileId: activeStudentProfile?.id,
      fullName: activeStudentProfile?.name || 'Student Candidate',
      headline: `${activeStudentProfile?.targetRole || 'Software Engineering Student'} | Aspiring Developer`,
      email: user?.email || 'student@university.edu',
      phone: '+91 98765 43210',
      location: 'Bangalore, India',
      githubUrl: activeStudentProfile?.githubUrl || 'https://github.com/student',
      linkedinUrl: activeStudentProfile?.linkedinUrl || 'https://linkedin.com/in/student',
      portfolioUrl: '',
      targetRole: activeStudentProfile?.targetRole || activeStudentProfile?.careerGoal || 'Software Engineer',
      summary: `Motivated computer science student targeting ${activeStudentProfile?.targetRole || 'Software Engineering'} roles with proven project experience in full-stack architecture, clean coding practices, and core algorithmic problem-solving.`,
      education: [
        {
          id: 'edu_1',
          institution: activeStudentProfile?.university || 'Engineering University',
          degree: activeStudentProfile?.degree || 'B.Tech',
          branch: activeStudentProfile?.branch || 'Computer Science & Engineering',
          startYear: '2022',
          endYear: activeStudentProfile?.year || '2026',
          scoreOrCgpa: '8.8 CGPA',
        },
      ],
      skills: [
        {
          category: 'Languages & Core',
          items: skills.length > 0 ? skills.slice(0, 5).map((s) => s.skillName) : ['TypeScript', 'Python', 'C++', 'Java'],
        },
        {
          category: 'Frameworks & Tools',
          items: ['React', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL', 'Git'],
        },
      ],
      experience: [],
      internships: [],
      projects: projects.map((p, idx) => ({
        id: `proj_${p.id || idx}`,
        title: p.title,
        techStack: p.techStack || ['TypeScript', 'React'],
        githubUrl: p.githubUrl,
        liveUrl: p.liveDemoUrl,
        bulletPoints: [
          `Architected and built full-stack application using ${(p.techStack || ['modern frameworks']).join(', ')}.`,
          `Implemented core features with modular state management and secure data flow.`,
          `Optimized performance and ensured reliable error handling across application layers.`,
        ],
      })),
      achievements: achievements.map((a, idx) => ({
        id: `ach_${a.id || idx}`,
        title: a.title,
        issuer: a.organization || 'University',
        date: a.date || '2024',
        description: a.description || 'Awarded for technical excellence.',
      })),
      certifications: [],
      responsibilities: [],
      languages: ['English (Professional)', 'Hindi (Fluent)'],
      customSections: [],
      sectionOrder: ['summary', 'education', 'skills', 'projects', 'experience', 'achievements'],
      updatedAt: new Date().toISOString(),
    };
  });

  const handleSaveResume = () => {
    const userId = user?.id || (isDemo ? 'demo-user' : 'anon');
    aiService.saveUserResume(userId, resumeData);
    setSaveStatus('Saved locally to profile!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleAiSummaryGenerate = async () => {
    setIsGenerating('summary');
    const res = await aiService.generateResumeSection({
      sectionType: 'summary',
      targetRole: resumeData.targetRole,
      existingData: resumeData,
      studentProfile: activeStudentProfile,
    });
    setIsGenerating(null);
    if (res.result && typeof res.result === 'string') {
      setResumeData((prev) => ({ ...prev, summary: res.result }));
    }
  };

  const handleAiProjectBullets = async (projId: string, proj: ResumeProject) => {
    setIsGenerating(`proj_${projId}`);
    const res = await aiService.generateResumeSection({
      sectionType: 'project-bullets',
      targetRole: resumeData.targetRole,
      existingData: proj,
      studentProfile: activeStudentProfile,
    });
    setIsGenerating(null);
    if (res.result && Array.isArray(res.result)) {
      setResumeData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projId ? { ...p, bulletPoints: res.result } : p
        ),
      }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  AI Technical Resume Builder
                </h1>
                <Badge variant="blue" size="sm">
                  ATS OPTIMIZED + STAR BULLETS
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                Multi-section builder prefilled with your verified projects and skills, enhanced with Gemini generation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 p-1 border border-slate-800 dark:border-slate-800 light:border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveResume}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Resume
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / PDF
            </Button>
          </div>
        </div>

        {saveStatus && (
          <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveStatus}</span>
          </div>
        )}
      </Card>

      {/* Editor View */}
      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header & Contact */}
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
                1. Header & Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Target Professional Headline</label>
                  <input
                    type="text"
                    value={resumeData.headline}
                    onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.location}
                    onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={resumeData.githubUrl}
                    onChange={(e) => setResumeData({ ...resumeData, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={resumeData.linkedinUrl}
                    onChange={(e) => setResumeData({ ...resumeData, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Target Role</label>
                  <input
                    type="text"
                    value={resumeData.targetRole}
                    onChange={(e) => setResumeData({ ...resumeData, targetRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Professional Summary */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  2. Professional Summary
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiSummaryGenerate}
                  disabled={isGenerating === 'summary'}
                  leftIcon={
                    isGenerating === 'summary' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    )
                  }
                >
                  AI Polish Summary
                </Button>
              </div>
              <textarea
                rows={3}
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </Card>

            {/* Projects Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
                <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  3. Key Engineering Projects ({resumeData.projects.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setResumeData((prev) => ({
                      ...prev,
                      projects: [
                        ...prev.projects,
                        {
                          id: `proj_${Date.now()}`,
                          title: 'New Technical Project',
                          techStack: ['TypeScript', 'Node.js'],
                          bulletPoints: [
                            'Engineered core architecture with robust component modularity.',
                            'Integrated persistent data storage and state lifecycle handling.',
                          ],
                        },
                      ],
                    }))
                  }
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Project
                </Button>
              </div>

              <div className="space-y-4">
                {resumeData.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl bg-slate-950/40 dark:bg-slate-950/40 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) =>
                          setResumeData((prev) => ({
                            ...prev,
                            projects: prev.projects.map((p) =>
                              p.id === proj.id ? { ...p, title: e.target.value } : p
                            ),
                          }))
                        }
                        className="font-bold text-xs px-2 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 flex-1 focus:outline-none focus:border-blue-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAiProjectBullets(proj.id, proj)}
                        disabled={isGenerating === `proj_${proj.id}`}
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                      >
                        AI STAR Bullets
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setResumeData((prev) => ({
                            ...prev,
                            projects: prev.projects.filter((p) => p.id !== proj.id),
                          }))
                        }
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-1.5 pl-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase font-semibold block">
                        Action-Verb Bullet Points
                      </span>
                      {proj.bulletPoints.map((bp, bIdx) => (
                        <input
                          key={bIdx}
                          type="text"
                          value={bp}
                          onChange={(e) =>
                            setResumeData((prev) => ({
                              ...prev,
                              projects: prev.projects.map((p) =>
                                p.id === proj.id
                                  ? {
                                      ...p,
                                      bulletPoints: p.bulletPoints.map((b, i) =>
                                        i === bIdx ? e.target.value : b
                                      ),
                                    }
                                  : p
                              ),
                            }))
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Education Section */}
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
                4. Education
              </h2>
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">University / Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          education: resumeData.education.map((ed) =>
                            ed.id === edu.id ? { ...ed, institution: e.target.value } : ed
                          ),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium block mb-1">Degree & Branch</label>
                    <input
                      type="text"
                      value={`${edu.degree} in ${edu.branch}`}
                      onChange={(e) =>
                        setResumeData({
                          ...resumeData,
                          education: resumeData.education.map((ed) =>
                            ed.id === edu.id ? { ...ed, branch: e.target.value } : ed
                          ),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Right Column: Live Mini Preview */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Resume Quick View</span>
                </span>
                <Badge variant="blue" size="sm">
                  1-PAGE FIT
                </Badge>
              </div>

              {/* Printable Format Skeleton */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#0c0e15] dark:border-slate-800 dark:text-slate-100 text-[10px] space-y-2.5 font-serif shadow-sm overflow-hidden select-none transition-colors">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
                    {resumeData.fullName}
                  </div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 font-sans">
                    {resumeData.headline}
                  </div>
                  <div className="text-[8px] text-slate-500 dark:text-slate-500 font-sans mt-0.5">
                    {resumeData.email} • {resumeData.phone} • {resumeData.location}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[9px] uppercase border-b border-slate-200 dark:border-slate-800 pb-0.5 text-slate-800 dark:text-slate-200 font-sans">
                    Summary
                  </div>
                  <p className="text-[8px] leading-tight text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-3">
                    {resumeData.summary}
                  </p>
                </div>

                <div>
                  <div className="font-bold text-[9px] uppercase border-b border-slate-200 dark:border-slate-800 pb-0.5 text-slate-800 dark:text-slate-200 font-sans">
                    Projects
                  </div>
                  <div className="space-y-1 mt-0.5">
                    {resumeData.projects.slice(0, 3).map((p, i) => (
                      <div key={i}>
                        <div className="font-bold text-[8px] text-slate-900 dark:text-slate-100 font-sans">
                          {p.title}
                        </div>
                        <div className="text-[7.5px] text-slate-600 dark:text-slate-400 line-clamp-1">
                          • {p.bulletPoints[0] || 'Implementation of core system features.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[9px] uppercase border-b border-slate-200 dark:border-slate-800 pb-0.5 text-slate-800 dark:text-slate-200 font-sans">
                    Education
                  </div>
                  <div className="text-[8px] text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{resumeData.education[0]?.institution}</strong> — {resumeData.education[0]?.degree}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Full Live Preview Document */
        <div className="max-w-4xl mx-auto">
          <div
            id="resume-document-canvas"
            className="p-8 sm:p-12 bg-white text-slate-900 border border-slate-200 dark:bg-[#0c0e15] dark:text-slate-100 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl font-serif transition-colors select-text"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-900 dark:border-slate-700 pb-4">
              <div className="text-center sm:text-left space-y-1 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
                  {resumeData.fullName}
                </h1>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-sans">{resumeData.headline}</p>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-sans pt-1">
                  <span>{resumeData.email}</span>
                  <span>•</span>
                  <span>{resumeData.phone}</span>
                  <span>•</span>
                  <span>{resumeData.location}</span>
                  {resumeData.githubUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={resumeData.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Github className="w-3 h-3" />
                        <span>{resumeData.githubUrl.replace('https://', '')}</span>
                      </a>
                    </>
                  )}
                  {resumeData.linkedinUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={resumeData.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="w-3 h-3" />
                        <span>{resumeData.linkedinUrl.replace('https://', '')}</span>
                      </a>
                    </>
                  )}
                  {resumeData.portfolioUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={resumeData.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{resumeData.portfolioUrl.replace('https://', '')}</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Profile Photo if present */}
              {profilePhoto && (
                <div className="shrink-0">
                  <img
                    src={profilePhoto}
                    alt={resumeData.fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-slate-300 dark:border-slate-700 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Professional Summary */}
            <div className="mt-5 space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-800 pb-0.5 font-sans">
                Professional Summary
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 pt-1">{resumeData.summary}</p>
            </div>

            {/* Technical Skills */}
            <div className="mt-5 space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-800 pb-0.5 font-sans">
                Technical Skills
              </h2>
              <div className="text-xs text-slate-700 dark:text-slate-300 pt-1 space-y-1">
                {resumeData.skills.map((sk, idx) => (
                  <div key={idx}>
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{sk.category}:</strong> {sk.items.join(', ')}
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="mt-5 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-800 pb-0.5 font-sans">
                Technical Projects
              </h2>
              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-sans">{proj.title}</span>
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-normal">
                      {proj.techStack.join(' | ')}
                    </span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-0.5 leading-relaxed">
                    {proj.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx}>{bp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="mt-5 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-800 pb-0.5 font-sans">
                Education
              </h2>
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline text-xs">
                  <div className="text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{edu.institution}</strong> — {edu.degree} in {edu.branch}
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                    {edu.startYear} - {edu.endYear} | {edu.scoreOrCgpa}
                  </span>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {resumeData.achievements.length > 0 && (
              <div className="mt-5 space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b border-slate-300 dark:border-slate-800 pb-0.5 font-sans">
                  Achievements & Certifications
                </h2>
                {resumeData.achievements.map((ach) => (
                  <div key={ach.id} className="text-xs text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">{ach.title}</strong> — {ach.issuer} ({ach.date}): {ach.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
