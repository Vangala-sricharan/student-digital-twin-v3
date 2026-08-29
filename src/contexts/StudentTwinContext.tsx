import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDemo } from './DemoContext';
import { studentTwinService } from '../services/studentTwinService';
import {
  DEMO_USER_PROFILE,
  DEMO_STUDENT_PROFILES,
  DEMO_SKILLS,
  DEMO_PROJECTS,
  DEMO_ACHIEVEMENTS,
  DEMO_CAREER_GOALS,
} from '../constants/demoData';
import {
  UserProfile,
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CareerGoalItem,
  SubscriptionRecord,
  OnboardingFormData,
  UserPortfolioRecord,
} from '../types';

interface StudentTwinContextType {
  userProfile: UserProfile | null;
  isPro: boolean;
  studentProfiles: StudentProfile[];
  activeStudentProfile: StudentProfile | null;
  activeStudentProfileId: string | null;
  skills: SkillItem[];
  allSkills: SkillItem[];
  projects: ProjectItem[];
  allProjects: ProjectItem[];
  achievements: AchievementItem[];
  allAchievements: AchievementItem[];
  careerGoals: CareerGoalItem[];
  allCareerGoals: CareerGoalItem[];
  activeCareerGoal: CareerGoalItem | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncMessage: string | null;
  isOnboarded: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  // Actions
  completeOnboarding: (data: OnboardingFormData) => Promise<{ success: boolean; error: Error | null }>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error: Error | null }>;
  setActiveStudent: (studentProfileId: string) => void;
  createStudentProfile: (data: Omit<StudentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: StudentProfile | null; error: Error | null }>;
  updateStudentProfile: (id: string, data: Partial<StudentProfile>) => Promise<{ data: StudentProfile | null; error: Error | null }>;
  deleteStudentProfile: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  // Skills CRUD
  addSkill: (data: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: SkillItem | null; error: Error | null }>;
  updateSkill: (id: string, data: Partial<SkillItem>) => Promise<{ data: SkillItem | null; error: Error | null }>;
  deleteSkill: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  // Projects CRUD
  addProject: (data: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: ProjectItem | null; error: Error | null }>;
  updateProject: (id: string, data: Partial<ProjectItem>) => Promise<{ data: ProjectItem | null; error: Error | null }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  // Achievements CRUD
  addAchievement: (data: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: AchievementItem | null; error: Error | null }>;
  updateAchievement: (id: string, data: Partial<AchievementItem>) => Promise<{ data: AchievementItem | null; error: Error | null }>;
  deleteAchievement: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  // Career Goals CRUD
  addCareerGoal: (data: Omit<CareerGoalItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: CareerGoalItem | null; error: Error | null }>;
  updateCareerGoal: (id: string, data: Partial<CareerGoalItem>) => Promise<{ data: CareerGoalItem | null; error: Error | null }>;
  deleteCareerGoal: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  setActiveGoal: (id: string) => Promise<{ success: boolean; error: Error | null }>;
  // Explicit Cloud upload
  uploadDataToCloud: (overrideProfile?: Partial<UserProfile>) => Promise<{ success: boolean; message: string; error: Error | null }>;
  savePortfolioRecord: (record: UserPortfolioRecord) => Promise<{ success: boolean; error: Error | null }>;
  upgradeSubscription: (targetPlan: 'pro_monthly' | 'pro_annual', billingCycle: 'monthly' | 'annual', transactionRef?: string) => Promise<{ success: boolean; error: Error | null }>;
  refreshData: () => Promise<void>;
}

const StudentTwinContext = createContext<StudentTwinContextType | undefined>(undefined);

export const StudentTwinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isDemoMode, demoProfile, updateDemoProfile } = useDemo();
  const userId = user?.id || '';

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [activeStudentProfileId, setActiveStudentProfileId] = useState<string | null>(null);
  
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectItem[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementItem[]>([]);
  const [allCareerGoals, setAllCareerGoals] = useState<CareerGoalItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Load all user records from Supabase / cache when authenticated user changes
  const loadUserData = useCallback(async (targetUserId: string) => {
    if (!targetUserId) {
      setUserProfile(null);
      setStudentProfiles([]);
      setActiveStudentProfileId(null);
      setAllSkills([]);
      setAllProjects([]);
      setAllAchievements([]);
      setAllCareerGoals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch complete cloud bundle (user metadata & local cache)
      const { data: cloudBundle } = await studentTwinService.fetchCloudStudentTwin(targetUserId);

      if (cloudBundle && cloudBundle.profile) {
        setUserProfile(cloudBundle.profile);
        setStudentProfiles(cloudBundle.students || []);
        setAllSkills(cloudBundle.skills || []);
        setAllProjects(cloudBundle.projects || []);
        setAllAchievements(cloudBundle.achievements || []);
        setAllCareerGoals(cloudBundle.careerGoals || []);

        const activeId =
          cloudBundle.activeStudentId ||
          cloudBundle.students?.find((s) => s.isActive)?.id ||
          cloudBundle.students?.[0]?.id ||
          null;
        setActiveStudentProfileId(activeId);

        const hasOnboardingDone = Boolean(
          cloudBundle.profile.isOnboarded ||
          (cloudBundle.profile.university && cloudBundle.profile.year)
        );
        setShowOnboarding(!hasOnboardingDone);
      } else {
        // Brand new user with no cloud data yet
        const { data: profile } = await studentTwinService.fetchUserProfile(targetUserId);
        const loadedProfile = profile || {
          id: targetUserId,
          email: user?.email || '',
          fullName: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          university: '',
          degree: '',
          branch: '',
          program: '',
          year: '',
          careerGoal: '',
          targetRole: '',
          plan: 'free' as const,
          isOnboarded: false,
          createdAt: user?.created_at || new Date().toISOString(),
          isDemo: false,
        };

        // Check if there is any local cached data before resetting to empty arrays
        const localCachedProjectsStr = localStorage.getItem(`sdt_user_${targetUserId}_projects`);
        const localCachedStudentsStr = localStorage.getItem(`sdt_user_${targetUserId}_students`);
        const localCachedSkillsStr = localStorage.getItem(`sdt_user_${targetUserId}_skills`);
        const localCachedAchievementsStr = localStorage.getItem(`sdt_user_${targetUserId}_achievements`);
        const localCachedGoalsStr = localStorage.getItem(`sdt_user_${targetUserId}_career_goals`);
        const localActiveStudentId = localStorage.getItem(`sdt_user_${targetUserId}_active_student_id`);

        const cachedProjects: ProjectItem[] = localCachedProjectsStr ? JSON.parse(localCachedProjectsStr) : [];
        const cachedStudents: StudentProfile[] = localCachedStudentsStr ? JSON.parse(localCachedStudentsStr) : [];
        const cachedSkills: SkillItem[] = localCachedSkillsStr ? JSON.parse(localCachedSkillsStr) : [];
        const cachedAchievements: AchievementItem[] = localCachedAchievementsStr ? JSON.parse(localCachedAchievementsStr) : [];
        const cachedGoals: CareerGoalItem[] = localCachedGoalsStr ? JSON.parse(localCachedGoalsStr) : [];

        setUserProfile(loadedProfile);
        setStudentProfiles(cachedStudents);
        setAllSkills(cachedSkills);
        setAllProjects(cachedProjects);
        setAllAchievements(cachedAchievements);
        setAllCareerGoals(cachedGoals);
        setActiveStudentProfileId(localActiveStudentId || cachedStudents[0]?.id || null);
        setShowOnboarding(!loadedProfile.isOnboarded && !loadedProfile.university);
      }
    } catch (err) {
      console.warn('Error loading student twin user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Handle Authentication Changes & Strict Isolation (Clear stale state when user changes or load demo data)
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadUserData(userId);
    } else if (isDemoMode) {
      // Initialize isolated demo data for Sricharan Vangala showcase
      setUserProfile(demoProfile || DEMO_USER_PROFILE);
      setStudentProfiles(DEMO_STUDENT_PROFILES);
      setActiveStudentProfileId(DEMO_STUDENT_PROFILES[0].id);
      setAllSkills(DEMO_SKILLS);
      setAllProjects(DEMO_PROJECTS);
      setAllAchievements(DEMO_ACHIEVEMENTS);
      setAllCareerGoals(DEMO_CAREER_GOALS);
      setShowOnboarding(false);
      setIsLoading(false);
    } else {
      // Clear all state on logout
      setUserProfile(null);
      setStudentProfiles([]);
      setActiveStudentProfileId(null);
      setAllSkills([]);
      setAllProjects([]);
      setAllAchievements([]);
      setAllCareerGoals([]);
      setShowOnboarding(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, isDemoMode, demoProfile, loadUserData]);

  // Filter items by active student profile (or show all user items if no active student profile)
  const activeStudentProfile = studentProfiles.find((s) => s.id === activeStudentProfileId) || (studentProfiles.length > 0 ? studentProfiles[0] : null);

  const skills = allSkills.filter(
    (item) => !activeStudentProfileId || !item.studentProfileId || item.studentProfileId === activeStudentProfileId
  );

  const projects = allProjects.filter(
    (item) => !activeStudentProfileId || !item.studentProfileId || item.studentProfileId === activeStudentProfileId
  );

  const achievements = allAchievements.filter(
    (item) => !activeStudentProfileId || !item.studentProfileId || item.studentProfileId === activeStudentProfileId
  );

  const careerGoals = allCareerGoals.filter(
    (item) => !activeStudentProfileId || !item.studentProfileId || item.studentProfileId === activeStudentProfileId
  );

  const activeCareerGoal = careerGoals.find((g) => g.isActive) || (careerGoals.length > 0 ? careerGoals[0] : null);

  // Switch Active Student Profile (Clears stale data safely and saves active ID)
  const setActiveStudent = (studentProfileId: string) => {
    setActiveStudentProfileId(studentProfileId);
    if (userId) {
      localStorage.setItem(`sdt_user_${userId}_active_student_id`, studentProfileId);
    }
  };

  // Complete First-Time Onboarding
  const completeOnboarding = async (data: OnboardingFormData): Promise<{ success: boolean; error: Error | null }> => {
    if (!userId) return { success: false, error: new Error('User is not authenticated') };

    try {
      setIsSyncing(true);
      const parsedSkills = data.currentSkills
        ? data.currentSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // 1. Save User Profile
      const updatedProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        fullName: data.fullName,
        university: data.university,
        degree: data.degree,
        branch: data.branch,
        program: `${data.degree} in ${data.branch}`,
        year: data.year,
        expectedGraduationYear: data.expectedGraduationYear,
        careerGoal: data.careerGoal,
        targetRole: data.targetRole || data.careerGoal,
        currentSkills: data.currentSkills || '',
        skills: parsedSkills,
        bio: data.bio || '',
        githubUrl: data.githubUrl || '',
        linkedinUrl: data.linkedinUrl || '',
        phone: data.phone || '',
        location: data.location || '',
        plan: 'free',
        isOnboarded: true,
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };

      const { data: savedProfile, error: profileErr } = await studentTwinService.upsertUserProfile(userId, updatedProfile);
      if (profileErr) throw profileErr;

      setUserProfile(savedProfile || updatedProfile);

      // 2. Create primary default Student Profile for this authenticated user
      const { data: newStudent, error: studentErr } = await studentTwinService.createStudentProfile(userId, {
        name: data.fullName,
        university: data.university,
        degree: data.degree,
        branch: data.branch,
        year: data.year,
        expectedGraduationYear: data.expectedGraduationYear,
        careerGoal: data.careerGoal,
        targetRole: data.targetRole || data.careerGoal,
        currentSkills: data.currentSkills || '',
        profileData: {
          bio: data.bio || '',
          githubUrl: data.githubUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          phone: data.phone || '',
          location: data.location || '',
        },
        isActive: true,
      });

      if (studentErr) throw studentErr;

      if (newStudent) {
        setStudentProfiles([newStudent]);
        setActiveStudentProfileId(newStudent.id);
        localStorage.setItem(`sdt_user_${userId}_active_student_id`, newStudent.id);

        // 3. If skills were entered, initialize skill items
        if (parsedSkills.length > 0) {
          const createdSkills: SkillItem[] = [];
          for (const skillName of parsedSkills) {
            try {
              const { data: skillItem } = await studentTwinService.addSkill(userId, {
                studentProfileId: newStudent.id,
                skillName,
                category: 'Programming',
                proficiency: 'Intermediate',
                score: 75,
              });
              if (skillItem) {
                createdSkills.push(skillItem);
              }
            } catch {}
          }
          if (createdSkills.length > 0) {
            setAllSkills(createdSkills);
          }
        }

        // 4. Initialize career goal item
        if (data.careerGoal) {
          try {
            const { data: goalItem } = await studentTwinService.addCareerGoal(userId, {
              studentProfileId: newStudent.id,
              goal: `Become a ${data.careerGoal}`,
              targetRole: data.targetRole || data.careerGoal,
              targetCompanies: ['Top Tech Companies', 'High-Growth Startups'],
              requiredSkills: parsedSkills.slice(0, 4),
              timeline: `By ${data.expectedGraduationYear || 'Graduation'}`,
              isActive: true,
            });
            if (goalItem) {
              setAllCareerGoals([goalItem]);
            }
          } catch {}
        }
      }

      setShowOnboarding(false);
      setIsSyncing(false);
      return { success: true, error: null };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, error: new Error(err.message || 'Failed to complete onboarding') };
    }
  };

  // Update User Profile
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<{ success: boolean; error: Error | null }> => {
    if (isDemoMode) {
      const merged: UserProfile = {
        ...(userProfile || demoProfile || DEMO_USER_PROFILE),
        ...data,
        updatedAt: new Date().toISOString(),
      };
      updateDemoProfile(merged);
      setUserProfile(merged);
      return { success: true, error: null };
    }

    if (!userId || !userProfile) return { success: false, error: new Error('User not found') };

    try {
      setIsSyncing(true);
      const merged: UserProfile = {
        ...userProfile,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const { data: saved, error } = await studentTwinService.upsertUserProfile(userId, merged);
      if (error) throw error;

      setUserProfile(saved || merged);
      setIsSyncing(false);
      return { success: true, error: null };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, error: new Error(err.message || 'Failed to update profile') };
    }
  };

  // Student Profiles CRUD
  const createStudentProfile = async (data: Omit<StudentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newProfile: StudentProfile = {
        ...data,
        id: `demo-student-${Date.now()}`,
        userId: 'demo-creator-showcase',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setStudentProfiles((prev) => [newProfile, ...prev]);
      if (data.isActive || studentProfiles.length === 0) {
        setActiveStudentProfileId(newProfile.id);
      }
      return { data: newProfile, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.createStudentProfile(userId, data);
    if (res.data) {
      setStudentProfiles((prev) => [res.data!, ...prev]);
      if (data.isActive || studentProfiles.length === 0) {
        setActiveStudentProfileId(res.data.id);
        localStorage.setItem(`sdt_user_${userId}_active_student_id`, res.data.id);
      }
    }
    return res;
  };

  const updateStudentProfile = async (id: string, data: Partial<StudentProfile>) => {
    if (isDemoMode) {
      let updated: StudentProfile | null = null;
      setStudentProfiles((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updated = { ...item, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return item;
        })
      );
      return { data: updated, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.updateStudentProfile(userId, id, data);
    if (res.data) {
      setStudentProfiles((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
    }
    return res;
  };

  const deleteStudentProfile = async (id: string) => {
    if (isDemoMode) {
      setStudentProfiles((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        if (activeStudentProfileId === id) {
          const nextActive = filtered[0]?.id || null;
          setActiveStudentProfileId(nextActive);
        }
        return filtered;
      });
      return { success: true, error: null };
    }

    if (!userId) return { success: false, error: new Error('User not authenticated') };
    const res = await studentTwinService.deleteStudentProfile(userId, id);
    if (res.success) {
      setStudentProfiles((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        if (activeStudentProfileId === id) {
          const nextActive = filtered[0]?.id || null;
          setActiveStudentProfileId(nextActive);
          if (nextActive) {
            localStorage.setItem(`sdt_user_${userId}_active_student_id`, nextActive);
          } else {
            localStorage.removeItem(`sdt_user_${userId}_active_student_id`);
          }
        }
        return filtered;
      });
    }
    return res;
  };

  // Skills CRUD
  const addSkill = async (data: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newSkill: SkillItem = {
        ...data,
        id: `demo-skill-${Date.now()}`,
        userId: 'demo-creator-showcase',
        studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAllSkills((prev) => [newSkill, ...prev]);
      return { data: newSkill, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.addSkill(userId, {
      ...data,
      studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
    });
    if (res.data) {
      setAllSkills((prev) => [res.data!, ...prev]);
    }
    return res;
  };

  const updateSkill = async (id: string, data: Partial<SkillItem>) => {
    if (isDemoMode) {
      let updated: SkillItem | null = null;
      setAllSkills((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updated = { ...item, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return item;
        })
      );
      return { data: updated, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.updateSkill(userId, id, data);
    if (res.data) {
      setAllSkills((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
    }
    return res;
  };

  const deleteSkill = async (id: string) => {
    if (isDemoMode) {
      setAllSkills((prev) => prev.filter((item) => item.id !== id));
      return { success: true, error: null };
    }

    if (!userId) return { success: false, error: new Error('User not authenticated') };
    const res = await studentTwinService.deleteSkill(userId, id);
    if (res.success) {
      setAllSkills((prev) => prev.filter((item) => item.id !== id));
    }
    return res;
  };

  // Projects CRUD
  const addProject = async (data: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newProject: ProjectItem = {
        ...data,
        id: `demo-proj-${Date.now()}`,
        userId: 'demo-creator-showcase',
        studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAllProjects((prev) => [newProject, ...prev]);
      return { data: newProject, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.addProject(userId, {
      ...data,
      studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
    });
    if (res.data) {
      setAllProjects((prev) => [res.data!, ...prev]);
    }
    return res;
  };

  const updateProject = async (id: string, data: Partial<ProjectItem>) => {
    if (isDemoMode) {
      let updated: ProjectItem | null = null;
      setAllProjects((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updated = { ...item, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return item;
        })
      );
      return { data: updated, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.updateProject(userId, id, data);
    if (res.data) {
      setAllProjects((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
    }
    return res;
  };

  const deleteProject = async (id: string) => {
    if (isDemoMode) {
      setAllProjects((prev) => prev.filter((item) => item.id !== id));
      return { success: true, error: null };
    }

    if (!userId) return { success: false, error: new Error('User not authenticated') };
    const res = await studentTwinService.deleteProject(userId, id);
    if (res.success) {
      setAllProjects((prev) => prev.filter((item) => item.id !== id));
    }
    return res;
  };

  // Achievements CRUD
  const addAchievement = async (data: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newAch: AchievementItem = {
        ...data,
        id: `demo-ach-${Date.now()}`,
        userId: 'demo-creator-showcase',
        studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAllAchievements((prev) => [newAch, ...prev]);
      return { data: newAch, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.addAchievement(userId, {
      ...data,
      studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
    });
    if (res.data) {
      setAllAchievements((prev) => [res.data!, ...prev]);
    }
    return res;
  };

  const updateAchievement = async (id: string, data: Partial<AchievementItem>) => {
    if (isDemoMode) {
      let updated: AchievementItem | null = null;
      setAllAchievements((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updated = { ...item, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return item;
        })
      );
      return { data: updated, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.updateAchievement(userId, id, data);
    if (res.data) {
      setAllAchievements((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
    }
    return res;
  };

  const deleteAchievement = async (id: string) => {
    if (isDemoMode) {
      setAllAchievements((prev) => prev.filter((item) => item.id !== id));
      return { success: true, error: null };
    }

    if (!userId) return { success: false, error: new Error('User not authenticated') };
    const res = await studentTwinService.deleteAchievement(userId, id);
    if (res.success) {
      setAllAchievements((prev) => prev.filter((item) => item.id !== id));
    }
    return res;
  };

  // Career Goals CRUD
  const addCareerGoal = async (data: Omit<CareerGoalItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      const newGoal: CareerGoalItem = {
        ...data,
        id: `demo-goal-${Date.now()}`,
        userId: 'demo-creator-showcase',
        studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAllCareerGoals((prev) => {
        if (data.isActive) {
          return [newGoal, ...prev.map((g) => ({ ...g, isActive: false }))];
        }
        return [newGoal, ...prev];
      });
      return { data: newGoal, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.addCareerGoal(userId, {
      ...data,
      studentProfileId: data.studentProfileId || activeStudentProfileId || undefined,
    });
    if (res.data) {
      setAllCareerGoals((prev) => {
        if (data.isActive) {
          return [res.data!, ...prev.map((g) => ({ ...g, isActive: false }))];
        }
        return [res.data!, ...prev];
      });
    }
    return res;
  };

  const updateCareerGoal = async (id: string, data: Partial<CareerGoalItem>) => {
    if (isDemoMode) {
      let updated: CareerGoalItem | null = null;
      setAllCareerGoals((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            updated = { ...item, ...data };
            return updated;
          }
          if (data.isActive) return { ...item, isActive: false };
          return item;
        })
      );
      return { data: updated, error: null };
    }

    if (!userId) return { data: null, error: new Error('User not authenticated') };
    const res = await studentTwinService.updateCareerGoal(userId, id, data);
    if (res.data) {
      setAllCareerGoals((prev) =>
        prev.map((item) => {
          if (item.id === id) return res.data!;
          if (data.isActive) return { ...item, isActive: false };
          return item;
        })
      );
    }
    return res;
  };

  const deleteCareerGoal = async (id: string) => {
    if (isDemoMode) {
      setAllCareerGoals((prev) => prev.filter((item) => item.id !== id));
      return { success: true, error: null };
    }

    if (!userId) return { success: false, error: new Error('User not authenticated') };
    const res = await studentTwinService.deleteCareerGoal(userId, id);
    if (res.success) {
      setAllCareerGoals((prev) => prev.filter((item) => item.id !== id));
    }
    return res;
  };

  const setActiveGoal = async (id: string): Promise<{ success: boolean; error: Error | null }> => {
    const res = await updateCareerGoal(id, { isActive: true });
    return { success: Boolean(res.data), error: res.error };
  };

  // Explicit Cloud Upload (Requirement 17)
  const uploadDataToCloud = async (overrideProfile?: Partial<UserProfile>): Promise<{ success: boolean; message: string; error: Error | null }> => {
    if (!userId || !userProfile) {
      return { success: false, message: 'User is not logged in', error: new Error('Not authenticated') };
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('Uploading student twin records to Supabase...');

    const existingImage = userProfile.profileImageUrl || userProfile.avatarUrl || '';
    const incomingImage = overrideProfile?.profileImageUrl !== undefined ? overrideProfile.profileImageUrl : (overrideProfile?.avatarUrl !== undefined ? overrideProfile.avatarUrl : existingImage);
    const effectiveImage = incomingImage || existingImage;

    const profileToUpload: UserProfile = {
      ...userProfile,
      ...(overrideProfile || {}),
      profileImageUrl: effectiveImage,
      avatarUrl: effectiveImage,
    };
    setUserProfile(profileToUpload);

    const res = await studentTwinService.uploadDataToCloud(
      userId,
      profileToUpload,
      studentProfiles,
      allSkills,
      allProjects,
      allAchievements,
      allCareerGoals,
      activeStudentProfileId
    );

    // Refresh userProfile from local cache to reflect uploaded storage URLs
    try {
      const cached = localStorage.getItem(`sdt_user_${userId}_profile`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!parsed.profileImageUrl && effectiveImage) {
          parsed.profileImageUrl = effectiveImage;
          parsed.avatarUrl = effectiveImage;
          localStorage.setItem(`sdt_user_${userId}_profile`, JSON.stringify(parsed));
        }
        setUserProfile(parsed);
      }
    } catch {}

    setIsSyncing(false);
    if (res.success) {
      setSyncStatus('success');
      setSyncMessage(res.message);
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage(null);
      }, 4000);
    } else {
      setSyncStatus('error');
      setSyncMessage(res.message);
    }

    return res;
  };

  const upgradeSubscription = async (
    targetPlan: 'pro_monthly' | 'pro_annual',
    billingCycle: 'monthly' | 'annual',
    transactionRef?: string
  ): Promise<{ success: boolean; error: Error | null }> => {
    // Determine target plan strictly by selected billing cycle (NEVER activate annual when monthly is selected)
    const confirmedTargetPlan: 'pro_monthly' | 'pro_annual' = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';
    const amount = billingCycle === 'annual' ? 1499 : 499;
    const now = new Date();
    const expiresAt = new Date(now);
    if (billingCycle === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    if (isDemoMode) {
      const subRecord: SubscriptionRecord = {
        userId: demoProfile.id,
        email: demoProfile.email || 'vangalasricharan7@gmail.com',
        selectedPlan: confirmedTargetPlan,
        billingCycle,
        amount,
        currency: 'INR',
        paymentMethod: 'UPI',
        upiId: '8520981574@ybl',
        transactionRef: transactionRef?.trim() || `DEMO_UPI_${Date.now()}`,
        paymentStatus: 'paid',
        subscriptionStatus: 'active',
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      };

      const updatedProfile: UserProfile = {
        ...demoProfile,
        plan: confirmedTargetPlan,
        billingCycle,
        subscriptionStatus: 'active',
        subscriptionDetails: subRecord,
        updatedAt: new Date().toISOString(),
      };

      updateDemoProfile(updatedProfile);
      setUserProfile(updatedProfile);
      return { success: true, error: null };
    }

    if (!userId || !userProfile) {
      return { success: false, error: new Error('User is not authenticated') };
    }

    try {
      setIsSyncing(true);

      const subRecord: SubscriptionRecord = {
        userId,
        email: userProfile.email || user?.email || '',
        selectedPlan: confirmedTargetPlan,
        billingCycle,
        amount,
        currency: 'INR',
        paymentMethod: 'UPI',
        upiId: '8520981574@ybl',
        transactionRef: transactionRef?.trim() || undefined,
        paymentStatus: 'paid',
        subscriptionStatus: 'active',
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
      };

      const { data: savedSub, error: subErr } = await studentTwinService.saveSubscription(userId, subRecord);
      if (subErr) {
        console.error('[StudentTwinContext] saveSubscription error:', subErr);
        setIsSyncing(false);
        return { success: false, error: subErr };
      }

      const updatedProfile: UserProfile = {
        ...userProfile,
        plan: confirmedTargetPlan,
        billingCycle,
        subscriptionStatus: 'active',
        subscriptionDetails: savedSub || subRecord,
        updatedAt: new Date().toISOString(),
      };

      setUserProfile(updatedProfile);

      // Persist user profile directly
      await studentTwinService.upsertUserProfile(userId, updatedProfile);

      setIsSyncing(false);
      return { success: true, error: null };
    } catch (err: any) {
      setIsSyncing(false);
      console.error('[StudentTwinContext] upgradeSubscription error:', err);
      return { success: false, error: new Error(err.message || 'Failed to submit subscription upgrade') };
    }
  };

  const savePortfolioRecord = async (record: UserPortfolioRecord): Promise<{ success: boolean; error: Error | null }> => {
    if (isDemoMode) {
      const current = userProfile || demoProfile || DEMO_USER_PROFILE;
      const merged: UserProfile = {
        ...current,
        portfolio: record,
        updatedAt: new Date().toISOString(),
      };
      updateDemoProfile(merged);
      setUserProfile(merged);
      return { success: true, error: null };
    }

    if (!userId || !userProfile) {
      return { success: false, error: new Error('User not found') };
    }

    try {
      setIsSyncing(true);
      const merged: UserProfile = {
        ...userProfile,
        portfolio: record,
        updatedAt: new Date().toISOString(),
      };

      const { data: saved, error } = await studentTwinService.upsertUserProfile(userId, merged);
      if (error) throw error;

      setUserProfile(saved || merged);
      await studentTwinService.uploadDataToCloud(
        userId,
        saved || merged,
        studentProfiles,
        allSkills,
        allProjects,
        allAchievements,
        allCareerGoals,
        activeStudentProfileId
      );
      setIsSyncing(false);
      return { success: true, error: null };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, error: new Error(err.message || 'Failed to save portfolio') };
    }
  };

  const refreshData = async () => {
    if (userId) {
      await loadUserData(userId);
    }
  };

  const isPro = Boolean(
    isDemoMode ||
    userProfile?.plan === 'pro' ||
    userProfile?.plan === 'annual' ||
    userProfile?.plan === 'pro_monthly' ||
    userProfile?.plan === 'pro_annual' ||
    (userProfile?.plan as string) === 'campus'
  );

  return (
    <StudentTwinContext.Provider
      value={{
        userProfile,
        isPro,
        studentProfiles,
        activeStudentProfile,
        activeStudentProfileId,
        skills,
        allSkills,
        projects,
        allProjects,
        achievements,
        allAchievements,
        careerGoals,
        allCareerGoals,
        activeCareerGoal,
        isLoading,
        isSyncing,
        syncStatus,
        syncMessage,
        isOnboarded: Boolean(userProfile?.isOnboarded || (userProfile?.university && userProfile?.year)),
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
        updateUserProfile,
        setActiveStudent,
        createStudentProfile,
        updateStudentProfile,
        deleteStudentProfile,
        addSkill,
        updateSkill,
        deleteSkill,
        addProject,
        updateProject,
        deleteProject,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        addCareerGoal,
        updateCareerGoal,
        deleteCareerGoal,
        setActiveGoal,
        uploadDataToCloud,
        savePortfolioRecord,
        upgradeSubscription,
        refreshData,
      }}
    >
      {children}
    </StudentTwinContext.Provider>
  );
};

export const useStudentTwin = (): StudentTwinContextType => {
  const context = useContext(StudentTwinContext);
  if (!context) {
    throw new Error('useStudentTwin must be used within a StudentTwinProvider');
  }
  return context;
};
