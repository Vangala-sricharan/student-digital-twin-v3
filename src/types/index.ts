export type ThemeMode = 'dark' | 'light';

export type AppState = 'public' | 'demo' | 'authenticated';

export type NavTab = 
  | 'dashboard'
  | 'profile'
  | 'students'
  | 'skills'
  | 'projects'
  | 'achievements'
  | 'career-goals'
  | 'assistant'
  | 'resume-builder'
  | 'resume-analyzer'
  | 'syllabus-analyzer'
  | 'project-analyzer'
  | 'career-roadmap'
  | 'internship-readiness'
  | 'career-simulator'
  | 'github-readiness'
  | 'linkedin-readiness'
  | 'analytics'
  | 'subscription'
  | 'settings';

export type PlanType = 'free' | 'pro' | 'annual';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  plan: PlanType;
  university?: string;
  degree?: string;
  branch?: string;
  program?: string;
  year?: string;
  careerGoal?: string;
  targetRole?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  location?: string;
  profileImageUrl?: string;
  isOnboarded?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  university: string;
  degree: string;
  branch: string;
  year: string;
  careerGoal: string;
  targetRole: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  profileData?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SkillCategory = 
  | 'Programming'
  | 'DSA'
  | 'AI/ML'
  | 'Web Development'
  | 'Databases'
  | 'Cloud'
  | 'Tools'
  | 'Soft Skills';

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillItem {
  id: string;
  userId: string;
  studentProfileId?: string;
  skillName: string;
  category: SkillCategory | string;
  proficiency: SkillProficiency;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Production';
export type ProjectStatus = 'In Progress' | 'Completed' | 'Archived';

export interface ProjectItem {
  id: string;
  userId: string;
  studentProfileId?: string;
  title: string;
  description: string;
  architecture: string;
  techStack: string[];
  githubUrl: string;
  liveDemoUrl?: string;
  role: string;
  difficulty: ProjectDifficulty;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementItem {
  id: string;
  userId: string;
  studentProfileId?: string;
  title: string;
  organization: string;
  date: string;
  description: string;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerGoalItem {
  id: string;
  userId: string;
  studentProfileId?: string;
  goal: string;
  targetRole: string;
  targetCompanies: string[];
  requiredSkills: string[];
  timeline: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormData {
  fullName: string;
  university: string;
  degree: string;
  branch: string;
  year: string;
  careerGoal: string;
  targetRole?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  phone?: string;
  location?: string;
}

export interface FounderInfo {
  name: string;
  role: string;
  university: string;
  program: string;
  year: string;
  careerFocus: string;
  bio: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// ==========================================
// AI & EVIDENCE-BASED INTELLIGENCE TYPES
// ==========================================

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  suggestedPrompts?: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  branch: string;
  startYear: string;
  endYear: string;
  scoreOrCgpa: string;
}

export interface ResumeExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bulletPoints: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  bulletPoints: string[];
}

export interface ResumeAchievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface ResumeCustomSection {
  id: string;
  title: string;
  items: string[];
}

export interface ResumeData {
  id: string;
  userId: string;
  studentProfileId?: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  profileImageUrl?: string;
  summary: string;
  targetRole: string;
  education: ResumeEducation[];
  skills: {
    category: string;
    items: string[];
  }[];
  experience: ResumeExperience[];
  internships: ResumeExperience[];
  projects: ResumeProject[];
  achievements: ResumeAchievement[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
  responsibilities: string[];
  languages: string[];
  customSections: ResumeCustomSection[];
  sectionOrder: string[];
  updatedAt: string;
}

export interface ResumeAnalysisResult {
  id: string;
  userId: string;
  analyzedAt: string;
  targetRole?: string;
  overallScore: number; // 0-100
  categories: {
    impactAndClarity: number; // /25
    skillsCoverage: number; // /25
    projectDepth: number; // /20
    atsReadability: number; // /15
    structureAndFormatting: number; // /15
  };
  detectedSkills: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  projectQualityFeedback: string[];
  careerAlignment: string;
  actionableSuggestions: string[];
  rawTextPreview?: string;
}

export interface SyllabusAnalysisResult {
  id: string;
  userId: string;
  syllabusTitle: string;
  targetRole?: string;
  analyzedAt: string;
  totalTopicsCount: number;
  topicBreakdown: {
    unitName: string;
    topics: string[];
    priority: 'High' | 'Medium' | 'Low';
    difficulty: 'Easy' | 'Moderate' | 'Challenging';
    industryRelevance: string;
  }[];
  priorityTopics: string[];
  difficultTopics: string[];
  skillGapsForIndustry: string[];
  learningSequence: {
    step: number;
    title: string;
    topics: string[];
    rationale: string;
  }[];
  studyPlan: {
    weekOrModule: string;
    focusAreas: string[];
    actionItems: string[];
    expectedOutcome: string;
  }[];
  careerRelevanceScore: number; // 0-100
  careerRelevanceSummary: string;
}

export interface ProjectAnalysisResult {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  analysisDate: string;
  overallScore: number; // 0-100
  categoryScores: {
    architecture: number; // /10
    technicalDepth: number; // /15
    complexity: number; // /10
    techStackQuality: number; // /10
    backendDatabase: number; // /10
    authAndSecurity: number; // /10
    scalability: number; // /10
    testingAndEvidence: number; // /10
    deploymentAndDocs: number; // /10
    resumeImpact: number; // /5
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  evidenceSummary: {
    hasTechStack: boolean;
    hasGithub: boolean;
    hasLiveDemo: boolean;
    hasArchitecture: boolean;
    isVerifiedRepo: boolean;
    repoDetails?: {
      stars: number;
      forks: number;
      languages: string[];
      hasReadme: boolean;
      lastPush?: string;
    };
  };
}

export interface GitHubEvidence {
  username: string;
  profileUrl: string;
  avatarUrl: string;
  bio: string;
  publicReposCount: number;
  followersCount: number;
  followingCount: number;
  accountCreatedAt: string;
  topRepositories: {
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    updatedAt: string;
    hasReadme: boolean;
  }[];
  languagesDetected: string[];
  totalStars: number;
  totalForks: number;
}

export interface GitHubReadinessResult {
  id: string;
  userId: string;
  githubUrl: string;
  username: string;
  analyzedAt: string;
  overallScore: number; // 0-100
  categoryScores: {
    profileQuality: number; // /15
    projectQuality: number; // /25
    documentation: number; // /20
    repoOrganization: number; // /15
    activityConsistency: number; // /15
    engineeringPresentation: number; // /10
  };
  evidenceSummary: GitHubEvidence;
  strengths: string[];
  weaknesses: string[];
  highestImpactImprovements: string[];
  recruiterRecommendations: string[];
}

export interface LinkedInReadinessResult {
  id: string;
  userId: string;
  linkedinUrl: string;
  analyzedAt: string;
  evidenceSource: 'pdf' | 'text' | 'verified_meta';
  overallScore: number; // 0-100
  categoryScores: {
    profileCompleteness: number; // /15
    headlinePositioning: number; // /15
    aboutSection: number; // /15
    skillsEndorsements: number; // /15
    projectsPortfolio: number; // /15
    experienceInternships: number; // /10
    educationCertifications: number; // /5
    professionalPresentation: number; // /5
    careerAlignment: number; // /5
  };
  extractedSummary?: {
    headline: string;
    about: string;
    skillsCount: number;
    experienceCount: number;
  };
  strengths: string[];
  weaknesses: string[];
  highestImpactImprovements: string[];
  recruiterFacingTips: string[];
}

export interface InternshipReadinessResult {
  id: string;
  userId: string;
  studentProfileId: string;
  analyzedAt: string;
  overallScore: number; // 0-100
  readinessLevel: 'Not Ready' | 'Early Preparation' | 'Approaching Readiness' | 'Internship Ready' | 'Highly Competitive';
  strengths: string[];
  blockers: string[];
  priorityActions: string[];
  missingEvidence: string[];
  nextSteps: string[];
  categoryBreakdown: {
    codingAndDSA: { score: number; status: string };
    projectProofOfWork: { score: number; status: string };
    resumeHealth: { score: number; status: string };
    onlinePresence: { score: number; status: string };
    roleAlignment: { score: number; status: string };
  };
}

export interface CareerRoadmapTask {
  id: string;
  title: string;
  description: string;
  category: 'Skill' | 'Project' | 'DSA' | 'Resume' | 'Networking' | 'Application';
  estimatedHours: number;
  deliverable: string;
  completed?: boolean;
}

export interface CareerRoadmapPhase {
  phaseName: '30-Day Foundation' | '60-Day Acceleration' | '90-Day Placement Ready';
  days: number;
  primaryObjective: string;
  milestones: string[];
  tasks: CareerRoadmapTask[];
}

export interface CareerRoadmapResult {
  id: string;
  userId: string;
  studentProfileId: string;
  targetRole: string;
  generatedAt: string;
  summary: string;
  phases: CareerRoadmapPhase[];
}

export interface CareerSimulationScenario {
  addedSkills: string[];
  addedProjects: string[];
  addedCertifications: string[];
  improvedDsaCount: number;
  improvedGithub: boolean;
  improvedLinkedin: boolean;
  improvedResume: boolean;
}

export interface CareerSimulationResult {
  id: string;
  userId: string;
  simulatedAt: string;
  currentScore: number;
  projectedScore: number;
  scoreDelta: number;
  rationale: string;
  categoryImpacts: {
    category: string;
    current: number;
    projected: number;
    diff: number;
    impactExplanation: string;
  }[];
  strategicAdvice: string[];
}

export interface EntityAnalysisRecord {
  id: string;
  userId: string;
  entityType: 'project' | 'github' | 'linkedin' | 'resume' | 'syllabus' | 'roadmap' | 'internship' | 'simulation';
  entityId: string;
  analysisData: any;
  createdAt: string;
  updatedAt: string;
}


