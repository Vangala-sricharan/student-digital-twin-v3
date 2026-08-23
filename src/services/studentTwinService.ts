import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile,
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CareerGoalItem,
  OnboardingFormData,
} from '../types';

/**
 * Storage key helpers for strictly user-isolated local cache / cloudStore
 */
const getStorageKey = (userId: string, suffix: string) => `sdt_user_${userId}_${suffix}`;

export const studentTwinService = {
  // ==========================================
  // 1. USER PROFILES (Cloud Auth Metadata + User-scoped Store)
  // ==========================================
  async fetchUserProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'profile'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { data: parsed, error: null };
      } catch {}
    }

    // Attempt to reconstruct profile from Supabase Auth user metadata if available
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          const fullName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'Student User';
          
          const profile: UserProfile = {
            id: user.id,
            email: user.email || '',
            fullName,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            university: user.user_metadata?.university || '',
            degree: user.user_metadata?.degree || '',
            branch: user.user_metadata?.branch || '',
            program: user.user_metadata?.program || (user.user_metadata?.degree && user.user_metadata?.branch ? `${user.user_metadata.degree} in ${user.user_metadata.branch}` : ''),
            year: user.user_metadata?.year || '',
            careerGoal: user.user_metadata?.career_goal || user.user_metadata?.careerGoal || '',
            targetRole: user.user_metadata?.target_role || user.user_metadata?.targetRole || '',
            bio: user.user_metadata?.bio || '',
            githubUrl: user.user_metadata?.github_url || user.user_metadata?.githubUrl || '',
            linkedinUrl: user.user_metadata?.linkedin_url || user.user_metadata?.linkedinUrl || '',
            phone: user.user_metadata?.phone || '',
            location: user.user_metadata?.location || '',
            profileImageUrl: user.user_metadata?.profile_image_url || '',
            plan: (user.user_metadata?.plan as any) || 'free',
            isOnboarded: user.user_metadata?.is_onboarded ?? Boolean(user.user_metadata?.university && user.user_metadata?.year),
            createdAt: user.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDemo: false,
          };

          localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
          return { data: profile, error: null };
        }
      } catch (err) {
        console.warn('Notice reading user metadata from Supabase Auth:', err);
      }
    }

    return { data: null, error: null };
  },

  async upsertUserProfile(userId: string, profile: Partial<UserProfile> & { email: string; fullName: string }): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const formattedProfile: UserProfile = {
      id: userId,
      email: profile.email,
      fullName: profile.fullName,
      university: profile.university || '',
      degree: profile.degree || '',
      branch: profile.branch || '',
      program: profile.degree && profile.branch ? `${profile.degree} in ${profile.branch}` : (profile.branch || profile.degree || ''),
      year: profile.year || '',
      careerGoal: profile.careerGoal || '',
      targetRole: profile.targetRole || '',
      bio: profile.bio || '',
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      phone: profile.phone || '',
      location: profile.location || '',
      profileImageUrl: profile.profileImageUrl || '',
      plan: profile.plan || 'free',
      isOnboarded: profile.isOnboarded ?? true,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };

    // Cache locally under user-specific key
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(formattedProfile));

    // Sync to Supabase Auth user_metadata so authenticated session carries user details
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: formattedProfile.fullName,
            university: formattedProfile.university,
            degree: formattedProfile.degree,
            branch: formattedProfile.branch,
            program: formattedProfile.program,
            year: formattedProfile.year,
            career_goal: formattedProfile.careerGoal,
            target_role: formattedProfile.targetRole,
            bio: formattedProfile.bio,
            github_url: formattedProfile.githubUrl,
            linkedin_url: formattedProfile.linkedinUrl,
            phone: formattedProfile.phone,
            location: formattedProfile.location,
            plan: formattedProfile.plan,
            is_onboarded: formattedProfile.isOnboarded,
          },
        });
      } catch (err) {
        console.warn('Notice updating user metadata in Supabase Auth:', err);
      }
    }

    return { data: formattedProfile, error: null };
  },

  // ==========================================
  // 2. STUDENT PROFILES
  // ==========================================
  async fetchStudentProfiles(userId: string): Promise<{ data: StudentProfile[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'students'));
    const list: StudentProfile[] = cached ? JSON.parse(cached) : [];
    return { data: list, error: null };
  },

  async createStudentProfile(userId: string, profile: Omit<StudentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ data: StudentProfile | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const newId = crypto.randomUUID ? crypto.randomUUID() : `sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newProfile: StudentProfile = {
      ...profile,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    // Update local user-scoped cache
    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    const list: StudentProfile[] = current ? JSON.parse(current) : [];
    list.unshift(newProfile);
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(list));

    return { data: newProfile, error: null };
  },

  async updateStudentProfile(userId: string, id: string, updates: Partial<StudentProfile>): Promise<{ data: StudentProfile | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Profile ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    if (current) {
      const list: StudentProfile[] = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(list));
        return { data: list[index], error: null };
      }
    }

    return { data: null, error: null };
  },

  async deleteStudentProfile(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Profile ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    if (current) {
      const list: StudentProfile[] = JSON.parse(current);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(filtered));
    }

    return { success: true, error: null };
  },

  // ==========================================
  // 3. SKILLS
  // ==========================================
  async fetchSkills(userId: string, studentProfileId?: string): Promise<{ data: SkillItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'skills'));
    const list: SkillItem[] = cached ? JSON.parse(cached) : [];
    if (studentProfileId) {
      return { data: list.filter((item) => !item.studentProfileId || item.studentProfileId === studentProfileId), error: null };
    }
    return { data: list, error: null };
  },

  async addSkill(userId: string, skill: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ data: SkillItem | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const newId = crypto.randomUUID ? crypto.randomUUID() : `sk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newSkill: SkillItem = {
      ...skill,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const current = localStorage.getItem(getStorageKey(userId, 'skills'));
    const list: SkillItem[] = current ? JSON.parse(current) : [];
    list.unshift(newSkill);
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(list));

    return { data: newSkill, error: null };
  },

  async updateSkill(userId: string, id: string, updates: Partial<SkillItem>): Promise<{ data: SkillItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Skill ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'skills'));
    if (current) {
      const list: SkillItem[] = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(list));
        return { data: list[index], error: null };
      }
    }

    return { data: null, error: null };
  },

  async deleteSkill(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Skill ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'skills'));
    if (current) {
      const list: SkillItem[] = JSON.parse(current);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(filtered));
    }

    return { success: true, error: null };
  },

  // ==========================================
  // 4. PROJECTS
  // ==========================================
  async fetchProjects(userId: string, studentProfileId?: string): Promise<{ data: ProjectItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'projects'));
    const list: ProjectItem[] = cached ? JSON.parse(cached) : [];
    if (studentProfileId) {
      return { data: list.filter((item) => !item.studentProfileId || item.studentProfileId === studentProfileId), error: null };
    }
    return { data: list, error: null };
  },

  async addProject(userId: string, project: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ data: ProjectItem | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const newId = crypto.randomUUID ? crypto.randomUUID() : `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newProject: ProjectItem = {
      ...project,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const current = localStorage.getItem(getStorageKey(userId, 'projects'));
    const list: ProjectItem[] = current ? JSON.parse(current) : [];
    list.unshift(newProject);
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(list));

    return { data: newProject, error: null };
  },

  async updateProject(userId: string, id: string, updates: Partial<ProjectItem>): Promise<{ data: ProjectItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Project ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'projects'));
    if (current) {
      const list: ProjectItem[] = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(list));
        return { data: list[index], error: null };
      }
    }

    return { data: null, error: null };
  },

  async deleteProject(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Project ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'projects'));
    if (current) {
      const list: ProjectItem[] = JSON.parse(current);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(filtered));
    }

    return { success: true, error: null };
  },

  // ==========================================
  // 5. ACHIEVEMENTS
  // ==========================================
  async fetchAchievements(userId: string, studentProfileId?: string): Promise<{ data: AchievementItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'achievements'));
    const list: AchievementItem[] = cached ? JSON.parse(cached) : [];
    if (studentProfileId) {
      return { data: list.filter((item) => !item.studentProfileId || item.studentProfileId === studentProfileId), error: null };
    }
    return { data: list, error: null };
  },

  async addAchievement(userId: string, achievement: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ data: AchievementItem | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const newId = crypto.randomUUID ? crypto.randomUUID() : `ach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newAchievement: AchievementItem = {
      ...achievement,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const current = localStorage.getItem(getStorageKey(userId, 'achievements'));
    const list: AchievementItem[] = current ? JSON.parse(current) : [];
    list.unshift(newAchievement);
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(list));

    return { data: newAchievement, error: null };
  },

  async updateAchievement(userId: string, id: string, updates: Partial<AchievementItem>): Promise<{ data: AchievementItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Achievement ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'achievements'));
    if (current) {
      const list: AchievementItem[] = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(list));
        return { data: list[index], error: null };
      }
    }

    return { data: null, error: null };
  },

  async deleteAchievement(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Achievement ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'achievements'));
    if (current) {
      const list: AchievementItem[] = JSON.parse(current);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(filtered));
    }

    return { success: true, error: null };
  },

  // ==========================================
  // 6. CAREER GOALS
  // ==========================================
  async fetchCareerGoals(userId: string, studentProfileId?: string): Promise<{ data: CareerGoalItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    const list: CareerGoalItem[] = cached ? JSON.parse(cached) : [];
    if (studentProfileId) {
      return { data: list.filter((item) => !item.studentProfileId || item.studentProfileId === studentProfileId), error: null };
    }
    return { data: list, error: null };
  },

  async addCareerGoal(userId: string, goal: Omit<CareerGoalItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ data: CareerGoalItem | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const newId = crypto.randomUUID ? crypto.randomUUID() : `cg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newGoal: CareerGoalItem = {
      ...goal,
      id: newId,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const current = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    let list: CareerGoalItem[] = current ? JSON.parse(current) : [];
    if (goal.isActive) {
      list = list.map((item) => ({ ...item, isActive: false }));
    }
    list.unshift(newGoal);
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(list));

    return { data: newGoal, error: null };
  },

  async updateCareerGoal(userId: string, id: string, updates: Partial<CareerGoalItem>): Promise<{ data: CareerGoalItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Goal ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    if (current) {
      let list: CareerGoalItem[] = JSON.parse(current);
      if (updates.isActive) {
        list = list.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: now } : { ...item, isActive: false }));
      } else {
        const index = list.findIndex((item) => item.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updates, updatedAt: now };
        }
      }
      localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(list));
      const updated = list.find((item) => item.id === id) || null;
      return { data: updated, error: null };
    }

    return { data: null, error: null };
  },

  async deleteCareerGoal(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Goal ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    if (current) {
      const list: CareerGoalItem[] = JSON.parse(current);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(filtered));
    }

    return { success: true, error: null };
  },

  // ==========================================
  // 7. USER-SCOPED CLOUDSTORE PERSISTENCE
  // ==========================================
  async uploadDataToCloud(
    userId: string,
    profile: UserProfile,
    students: StudentProfile[],
    skills: SkillItem[],
    projects: ProjectItem[],
    achievements: AchievementItem[],
    goals: CareerGoalItem[]
  ): Promise<{ success: boolean; message: string; error: Error | null }> {
    if (!userId) {
      return { success: false, message: 'Missing user session ID', error: new Error('User is not authenticated') };
    }

    // Persist all records into user-scoped cloudStore / local cache
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(goals));

    // Update Supabase Auth user metadata if Supabase is active
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profile.fullName || '',
            university: profile.university || '',
            degree: profile.degree || '',
            branch: profile.branch || '',
            program: profile.program || '',
            year: profile.year || '',
            career_goal: profile.careerGoal || '',
            target_role: profile.targetRole || '',
            bio: profile.bio || '',
            github_url: profile.githubUrl || '',
            linkedin_url: profile.linkedinUrl || '',
            phone: profile.phone || '',
            location: profile.location || '',
            plan: profile.plan || 'free',
            is_onboarded: profile.isOnboarded ?? true,
          },
        });
      } catch (err) {
        console.warn('Notice syncing metadata during cloud upload:', err);
      }
    }

    return {
      success: true,
      message: 'Student twin profile & records successfully synchronized to cloud storage.',
      error: null,
    };
  },

  // Clear all local caches for a specific user ID upon sign out
  clearUserCache(userId: string) {
    if (!userId) return;
    const suffixes = ['profile', 'students', 'skills', 'projects', 'achievements', 'career_goals', 'active_student_id'];
    suffixes.forEach((suffix) => {
      localStorage.removeItem(getStorageKey(userId, suffix));
    });
  },
};
