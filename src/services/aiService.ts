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
  // 1. AI CAREER ASSISTANT (Streaming & Fallback)
  // ==============================================================================
  async askCareerAssistantStream(
    params: {
      message: string;
      activeProfile: StudentProfile | null;
      skills: SkillItem[];
      projects: ProjectItem[];
      achievements: AchievementItem[];
      careerGoals: CareerGoalItem[];
      history?: AssistantMessage[];
    },
    onChunk: (accumulatedText: string) => void
  ): Promise<{ content: string; suggestedPrompts: string[]; error?: string; isTransient?: boolean }> {
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, stream: true }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        return {
          content: '',
          suggestedPrompts: [],
          error: errorJson.error || `Server returned error ${response.status}`,
          isTransient: response.status === 503 || errorJson.isTransient,
        };
      }

      if (!response.body) {
        return this.askCareerAssistant(params);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                return {
                  content: fullText,
                  suggestedPrompts: [],
                  error: parsed.error,
                  isTransient: true,
                };
              }
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(fullText);
              }
            } catch {
              // Ignore malformed partial chunks
            }
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6).trim());
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(fullText);
          }
        } catch {}
      }

      // Parse suggested prompts if present
      let content = fullText;
      let suggestedPrompts: string[] = [];
      if (fullText.includes('SUGGESTED NEXT QUESTIONS:')) {
        const parts = fullText.split('SUGGESTED NEXT QUESTIONS:');
        content = (parts[0] || '').trim();
        const rawPrompts = (parts[1] || '').trim().split('\n');
        suggestedPrompts = rawPrompts
          .map((p) => p.replace(/^[-*0-9.)\s]+/, '').trim())
          .filter((p) => p.length > 5 && p.length < 120)
          .slice(0, 3);
      }

      return {
        content: content || fullText,
        suggestedPrompts: suggestedPrompts.length > 0 ? suggestedPrompts : [
          'Which skills should I prioritize next for my target role?',
          'How can I improve my project architectures?',
          'What should be my 30-day focus plan?',
        ],
      };
    } catch (err: any) {
      console.warn('[Career Assistant Stream fallback]:', err?.message || err);
      return this.askCareerAssistant(params);
    }
  },

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
