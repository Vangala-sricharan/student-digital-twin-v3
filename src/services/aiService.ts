import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CareerGoalItem,
  AssistantMessage,
  ResumeData,
  ResumeAnalysisResult,
  SyllabusAnalysisResult,
  ProjectAnalysisResult,
  GitHubReadinessResult,
  LinkedInReadinessResult,
  InternshipReadinessResult,
  CareerRoadmapResult,
  CareerSimulationScenario,
  CareerSimulationResult,
} from '../types';

const getAiStorageKey = (userId: string, entityType: string, entityId: string) =>
  `sdt_ai_${userId || 'anon'}_${entityType}_${entityId}`;

// Helper for client-side API calls with transient retry handling
async function postWithRetry<T>(url: string, body: any, maxRetries = 2): Promise<{ data: T | null; error?: string; isTransient?: boolean; code?: string; raw?: any }> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok) {
        const is503 = response.status === 503 || resJson.code === 'GEMINI_UNAVAILABLE' || resJson.isTransient;
        if (is503 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }

        return {
          data: null,
          error: resJson.error || `Request failed with status ${response.status}`,
          isTransient: Boolean(is503),
          code: resJson.code || (is503 ? 'GEMINI_UNAVAILABLE' : 'SERVER_ERROR'),
          raw: resJson,
        };
      }

      return { data: resJson as T, raw: resJson };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
        continue;
      }
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Network request failed. Please check connection and retry.',
    isTransient: true,
    code: 'NETWORK_ERROR',
  };
}

export const aiService = {
  // ==============================================================================
  // 1. AI CAREER ASSISTANT
  // ==============================================================================
  async askCareerAssistant(params: {
    message: string;
    activeProfile: StudentProfile | null;
    skills: SkillItem[];
    projects: ProjectItem[];
    achievements: AchievementItem[];
    careerGoals: CareerGoalItem[];
    history?: AssistantMessage[];
  }): Promise<{ content: string; suggestedPrompts: string[]; error?: string; isTransient?: boolean }> {
    const res = await postWithRetry<{ content: string; suggestedPrompts: string[] }>('/api/ai/assistant', params);
    if (res.data) {
      return {
        content: res.data.content,
        suggestedPrompts: res.data.suggestedPrompts || [],
      };
    }
    return {
      content: '',
      suggestedPrompts: [],
      error: res.error,
      isTransient: res.isTransient,
    };
  },

  // ==============================================================================
  // 2. RESUME SECTION GENERATION & ATS TAILORING
  // ==============================================================================
  async generateResumeSection(params: {
    sectionType: 'summary' | 'project-bullets' | 'ats-tailor' | 'polish';
    targetRole?: string;
    existingData?: any;
    studentProfile?: StudentProfile | null;
  }): Promise<{ result: any; error?: string; isTransient?: boolean }> {
    const res = await postWithRetry<{ result: any }>('/api/ai/resume/generate-section', params);
    return {
      result: res.data ? res.data.result : null,
      error: res.error,
      isTransient: res.isTransient,
    };
  },

  // ==============================================================================
  // 3. RESUME ANALYZER
  // ==============================================================================
  async analyzeResume(params: {
    resumeText?: string;
    resumeBase64?: string;
    targetRole?: string;
    userId: string;
  }): Promise<{ data: ResumeAnalysisResult | null; error?: string; isTransient?: boolean }> {
    const res = await postWithRetry<ResumeAnalysisResult>('/api/ai/resume/analyze', params);
    if (res.data) {
      aiService.saveEntityAnalysis(params.userId, 'resume', 'latest', res.data);
      return { data: res.data };
    }
    return { data: null, error: res.error, isTransient: res.isTransient };
  },

  // ==============================================================================
  // 4. SYLLABUS ANALYZER
  // ==============================================================================
  async analyzeSyllabus(params: {
    syllabusText: string;
    syllabusTitle?: string;
    targetRole?: string;
    userId: string;
  }): Promise<{ data: SyllabusAnalysisResult | null; error?: string; isTransient?: boolean }> {
    const res = await postWithRetry<SyllabusAnalysisResult>('/api/ai/syllabus/analyze', params);
    if (res.data) {
      const entityId = (params.syllabusTitle || 'coursework').toLowerCase().replace(/[^a-z0-9]/g, '_');
      aiService.saveEntityAnalysis(params.userId, 'syllabus', entityId, res.data);
      return { data: res.data };
    }
    return { data: null, error: res.error, isTransient: res.isTransient };
  },

  // ==============================================================================
  // 5. PROJECT ANALYZER
  // ==============================================================================
  async analyzeProject(params: {
    project: ProjectItem;
    userId: string;
  }): Promise<{ data: ProjectAnalysisResult | null; error?: string; isTransient?: boolean }> {
    const res = await postWithRetry<ProjectAnalysisResult>('/api/ai/project/analyze', params);
    if (res.data) {
      aiService.saveEntityAnalysis(params.userId, 'project', params.project.id, res.data);
      return { data: res.data };
    }
    return { data: null, error: res.error, isTransient: res.isTransient };
  },

  // ==============================================================================
  // 6. GITHUB READINESS
  // ==============================================================================
  async analyzeGitHub(params: {
    githubUrl: string;
    userId: string;
  }): Promise<{ data: GitHubReadinessResult | null; error?: string; isTransient?: boolean; evidenceSummary?: any }> {
    const res = await postWithRetry<GitHubReadinessResult>('/api/ai/github/analyze', params);
    if (res.data) {
      const normalizedUrl = params.githubUrl.toLowerCase().trim().replace(/\/$/, '');
      aiService.saveEntityAnalysis(params.userId, 'github', normalizedUrl, res.data);
      return { data: res.data };
    }
    return {
      data: null,
      error: res.error,
      isTransient: res.isTransient,
      evidenceSummary: res.raw?.evidenceSummary,
    };
  },

  // ==============================================================================
  // 7. LINKEDIN READINESS
  // ==============================================================================
  async analyzeLinkedIn(params: {
    linkedinUrl: string;
    profileText?: string;
    profileBase64?: string;
    targetRole?: string;
    userId: string;
  }): Promise<{ data: LinkedInReadinessResult | null; requiresInput?: boolean; error?: string; isTransient?: boolean }> {
    try {
      const response = await fetch('/api/ai/linkedin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (response.status === 422) {
        return { data: null, requiresInput: true, error: data.error };
      }

      if (!response.ok) {
        const isTransient = response.status === 503 || data.isTransient;
        return { data: null, error: data.error || 'Failed to analyze LinkedIn profile', isTransient };
      }

      const result: LinkedInReadinessResult = data;
      const normalizedUrl = params.linkedinUrl.toLowerCase().trim().replace(/\/$/, '');
      aiService.saveEntityAnalysis(params.userId, 'linkedin', normalizedUrl, result);

      return { data: result };
    } catch (err: any) {
      console.error('aiService.analyzeLinkedIn error:', err);
      return { data: null, error: err.message || 'Failed to evaluate LinkedIn profile', isTransient: true };
    }
  },

  // ==============================================================================
  // 8. INTERNSHIP READINESS
  // ==============================================================================
  async analyzeInternshipReadiness(params: {
    activeProfile: StudentProfile | null;
    skills: SkillItem[];
    projects: ProjectItem[];
    achievements: AchievementItem[];
    careerGoals: CareerGoalItem[];
    userId: string;
  }): Promise<{ data: InternshipReadinessResult | null; error?: string }> {
    try {
      const response = await fetch('/api/ai/internship/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze internship readiness');
      }

      const result: InternshipReadinessResult = data;
      const profileId = params.activeProfile?.id || 'default_profile';
      aiService.saveEntityAnalysis(params.userId, 'internship', profileId, result);

      return { data: result };
    } catch (err: any) {
      console.error('aiService.analyzeInternshipReadiness error:', err);
      return { data: null, error: err.message || 'Failed to evaluate internship readiness' };
    }
  },

  // ==============================================================================
  // 9. CAREER ROADMAP (30-60-90)
  // ==============================================================================
  async generateCareerRoadmap(params: {
    activeProfile: StudentProfile | null;
    skills: SkillItem[];
    projects: ProjectItem[];
    achievements: AchievementItem[];
    careerGoals: CareerGoalItem[];
    userId: string;
  }): Promise<{ data: CareerRoadmapResult | null; error?: string }> {
    try {
      const response = await fetch('/api/ai/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate career roadmap');
      }

      const result: CareerRoadmapResult = data;
      const profileId = params.activeProfile?.id || 'default_profile';
      aiService.saveEntityAnalysis(params.userId, 'roadmap', profileId, result);

      return { data: result };
    } catch (err: any) {
      console.error('aiService.generateCareerRoadmap error:', err);
      return { data: null, error: err.message || 'Failed to generate career roadmap' };
    }
  },

  // ==============================================================================
  // 10. CAREER SIMULATOR (WHAT-IF)
  // ==============================================================================
  async runCareerSimulator(params: {
    scenario: CareerSimulationScenario;
    activeProfile: StudentProfile | null;
    skills: SkillItem[];
    projects: ProjectItem[];
    achievements: AchievementItem[];
    currentReadinessScore: number;
    userId: string;
  }): Promise<{ data: CareerSimulationResult | null; error?: string }> {
    try {
      const response = await fetch('/api/ai/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run career simulation');
      }

      const result: CareerSimulationResult = data;
      aiService.saveEntityAnalysis(params.userId, 'simulation', 'latest', result);

      return { data: result };
    } catch (err: any) {
      console.error('aiService.runCareerSimulator error:', err);
      return { data: null, error: err.message || 'Failed to simulate career trajectory' };
    }
  },

  // ==============================================================================
  // 11. PERSISTENCE & ENTITY CACHING HELPERS
  // ==============================================================================
  saveEntityAnalysis(userId: string, entityType: string, entityId: string, analysisData: any) {
    if (!userId || !entityType || !entityId) return;
    const key = getAiStorageKey(userId, entityType, entityId);
    try {
      localStorage.setItem(key, JSON.stringify({
        userId,
        entityType,
        entityId,
        analysisData,
        savedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('LocalStorage saveEntityAnalysis warning:', e);
    }
  },

  getSavedEntityAnalysis<T>(userId: string, entityType: string, entityId: string): T | null {
    if (!userId || !entityType || !entityId) return null;
    const key = getAiStorageKey(userId, entityType, entityId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.analysisData as T;
    } catch {
      return null;
    }
  },

  clearSavedEntityAnalysis(userId: string, entityType: string, entityId: string) {
    if (!userId || !entityType || !entityId) return;
    const key = getAiStorageKey(userId, entityType, entityId);
    localStorage.removeItem(key);
  },

  // Storage for default user Resume Data in Resume Builder
  saveUserResume(userId: string, resume: ResumeData) {
    if (!userId) return;
    localStorage.setItem(`sdt_resume_${userId}`, JSON.stringify(resume));
  },

  getUserResume(userId: string): ResumeData | null {
    if (!userId) return null;
    const raw = localStorage.getItem(`sdt_resume_${userId}`);
    return raw ? JSON.parse(raw) : null;
  },
};
