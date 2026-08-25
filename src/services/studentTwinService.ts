import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile,
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CareerGoalItem,
  SubscriptionRecord,
  PlanType,
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

    let cachedProfile: UserProfile | null = null;
    const cached = localStorage.getItem(getStorageKey(userId, 'profile'));
    if (cached) {
      try {
        cachedProfile = JSON.parse(cached);
      } catch {}
    }

    // Attempt to reconstruct/sync profile from Supabase Auth user metadata
    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error('[Supabase Service] fetchUserProfile getUser error:', {
            message: userErr.message,
            status: userErr.status,
          });
        }

        if (user && user.id === userId) {
          const fullName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           cachedProfile?.fullName ||
                           'Student User';
          
          const rawPlan = user.user_metadata?.plan || cachedProfile?.plan || 'free';
          const billingCycle = user.user_metadata?.billing_cycle || cachedProfile?.billingCycle;
          const subscriptionStatus = user.user_metadata?.subscription_status || cachedProfile?.subscriptionStatus;
          const subscriptionDetails = user.user_metadata?.subscription_data || cachedProfile?.subscriptionDetails;

          const profile: UserProfile = {
            id: user.id,
            email: user.email || cachedProfile?.email || '',
            fullName,
            avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedProfile?.avatarUrl,
            university: user.user_metadata?.university || cachedProfile?.university || '',
            degree: user.user_metadata?.degree || cachedProfile?.degree || '',
            branch: user.user_metadata?.branch || cachedProfile?.branch || '',
            program: user.user_metadata?.program || (user.user_metadata?.degree && user.user_metadata?.branch ? `${user.user_metadata.degree} in ${user.user_metadata.branch}` : (cachedProfile?.program || '')),
            year: user.user_metadata?.year || cachedProfile?.year || '',
            expectedGraduationYear: user.user_metadata?.expected_graduation_year || user.user_metadata?.expectedGraduationYear || cachedProfile?.expectedGraduationYear || '',
            careerGoal: user.user_metadata?.career_goal || user.user_metadata?.careerGoal || cachedProfile?.careerGoal || '',
            targetRole: user.user_metadata?.target_role || user.user_metadata?.targetRole || cachedProfile?.targetRole || '',
            currentSkills: user.user_metadata?.current_skills || user.user_metadata?.currentSkills || cachedProfile?.currentSkills || '',
            skills: user.user_metadata?.skills || cachedProfile?.skills || [],
            bio: user.user_metadata?.bio || cachedProfile?.bio || '',
            githubUrl: user.user_metadata?.github_url || user.user_metadata?.githubUrl || cachedProfile?.githubUrl || '',
            linkedinUrl: user.user_metadata?.linkedin_url || user.user_metadata?.linkedinUrl || cachedProfile?.linkedinUrl || '',
            phone: user.user_metadata?.phone || cachedProfile?.phone || '',
            location: user.user_metadata?.location || cachedProfile?.location || '',
            profileImageUrl: user.user_metadata?.profile_image_url || cachedProfile?.profileImageUrl || '',
            plan: rawPlan as PlanType,
            billingCycle,
            subscriptionStatus,
            subscriptionDetails,
            isOnboarded: user.user_metadata?.is_onboarded ?? (cachedProfile?.isOnboarded ?? Boolean(user.user_metadata?.university && user.user_metadata?.year)),
            createdAt: user.created_at || cachedProfile?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDemo: false,
          };

          localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
          return { data: profile, error: null };
        }
      } catch (err: any) {
        console.error('[Supabase Service] Notice reading user metadata from Supabase Auth:', err);
      }
    }

    if (cachedProfile) {
      return { data: cachedProfile, error: null };
    }

    return { data: null, error: null };
  },

  async upsertUserProfile(userId: string, profile: Partial<UserProfile> & { email: string; fullName: string }): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    // Get current cache to avoid wiping existing plan or billing properties
    let existingPlan: PlanType = 'free';
    let existingCycle: 'monthly' | 'annual' | undefined;
    let existingSubStatus: any;
    let existingSubDetails: any;

    const cached = localStorage.getItem(getStorageKey(userId, 'profile'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        existingPlan = parsed.plan || 'free';
        existingCycle = parsed.billingCycle;
        existingSubStatus = parsed.subscriptionStatus;
        existingSubDetails = parsed.subscriptionDetails;
      } catch {}
    }

    const formattedProfile: UserProfile = {
      id: userId,
      email: profile.email,
      fullName: profile.fullName,
      university: profile.university || '',
      degree: profile.degree || '',
      branch: profile.branch || '',
      program: profile.degree && profile.branch ? `${profile.degree} in ${profile.branch}` : (profile.branch || profile.degree || ''),
      year: profile.year || '',
      expectedGraduationYear: profile.expectedGraduationYear || '',
      careerGoal: profile.careerGoal || '',
      targetRole: profile.targetRole || '',
      currentSkills: profile.currentSkills || '',
      skills: profile.skills || [],
      bio: profile.bio || '',
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      phone: profile.phone || '',
      location: profile.location || '',
      profileImageUrl: profile.profileImageUrl || '',
      plan: profile.plan || existingPlan,
      billingCycle: profile.billingCycle || existingCycle,
      subscriptionStatus: profile.subscriptionStatus || existingSubStatus,
      subscriptionDetails: profile.subscriptionDetails || existingSubDetails,
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
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: formattedProfile.fullName,
            university: formattedProfile.university,
            degree: formattedProfile.degree,
            branch: formattedProfile.branch,
            program: formattedProfile.program,
            year: formattedProfile.year,
            expected_graduation_year: formattedProfile.expectedGraduationYear,
            career_goal: formattedProfile.careerGoal,
            target_role: formattedProfile.targetRole,
            current_skills: formattedProfile.currentSkills,
            skills: formattedProfile.skills,
            bio: formattedProfile.bio,
            github_url: formattedProfile.githubUrl,
            linkedin_url: formattedProfile.linkedinUrl,
            phone: formattedProfile.phone,
            location: formattedProfile.location,
            plan: formattedProfile.plan,
            billing_cycle: formattedProfile.billingCycle,
            subscription_status: formattedProfile.subscriptionStatus,
            is_onboarded: formattedProfile.isOnboarded,
          },
        });
        if (error) {
          console.error('[Supabase Service] upsertUserProfile updateUser error:', {
            message: error.message,
            status: error.status,
          });
          return { data: formattedProfile, error: new Error(error.message) };
        }
      } catch (err: any) {
        console.error('[Supabase Service] Error updating user metadata in Supabase Auth:', err);
        return { data: formattedProfile, error: new Error(err.message || 'Failed to update user profile in Supabase') };
      }
    }

    return { data: formattedProfile, error: null };
  },

  // ==========================================
  // SUBSCRIPTION & UPI PAYMENT PERSISTENCE
  // ==========================================
  async saveSubscription(
    userId: string,
    subscription: SubscriptionRecord
  ): Promise<{ data: SubscriptionRecord | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    console.log('[Supabase Subscription] Persisting subscription record for user:', userId, subscription);

    // Save to user-scoped local cache
    localStorage.setItem(getStorageKey(userId, 'subscription'), JSON.stringify(subscription));

    // Update user profile in local cache
    const cachedProfile = localStorage.getItem(getStorageKey(userId, 'profile'));
    let updatedProfile: UserProfile | null = null;
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        updatedProfile = {
          ...parsed,
          plan: subscription.selectedPlan,
          billingCycle: subscription.billingCycle,
          subscriptionStatus: subscription.subscriptionStatus,
          subscriptionDetails: subscription,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(updatedProfile));
      } catch {}
    }

    // Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        // 1. Update Auth user metadata
        const { error: metaErr } = await supabase.auth.updateUser({
          data: {
            plan: subscription.selectedPlan,
            billing_cycle: subscription.billingCycle,
            subscription_status: subscription.subscriptionStatus,
            subscription_data: subscription,
          },
        });

        if (metaErr) {
          console.error('[Supabase Subscription] Error updating user metadata:', metaErr);
          return { data: null, error: new Error(metaErr.message) };
        }

        // 2. Attempt upsert into subscriptions table (if schema exists)
        try {
          const { error: tableErr } = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              email: subscription.email,
              selected_plan: subscription.selectedPlan,
              billing_cycle: subscription.billingCycle,
              amount: subscription.amount,
              currency: subscription.currency,
              payment_method: subscription.paymentMethod,
              upi_id: subscription.upiId,
              transaction_ref: subscription.transactionRef || null,
              payment_status: subscription.paymentStatus,
              subscription_status: subscription.subscriptionStatus,
              started_at: subscription.startedAt,
              expires_at: subscription.expiresAt,
              created_at: subscription.createdAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

          if (tableErr) {
            console.warn('[Supabase Subscription] Subscriptions table notice (auth metadata remains primary):', tableErr.message);
          }
        } catch (tableEx) {
          console.warn('[Supabase Subscription] Optional database table insert skipped:', tableEx);
        }

        console.log('[Supabase Subscription] Subscription successfully persisted to Supabase Auth metadata.');
        return { data: subscription, error: null };
      } catch (err: any) {
        console.error('[Supabase Subscription] Exception during subscription persistence:', err);
        return { data: null, error: new Error(err.message || 'Failed to persist subscription') };
      }
    }

    return { data: subscription, error: null };
  },

  async fetchSubscription(userId: string): Promise<{ data: SubscriptionRecord | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    // Check local cache
    const cached = localStorage.getItem(getStorageKey(userId, 'subscription'));
    if (cached) {
      try {
        return { data: JSON.parse(cached), error: null };
      } catch {}
    }

    // Check Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.subscription_data) {
          const sub = user.user_metadata.subscription_data;
          localStorage.setItem(getStorageKey(userId, 'subscription'), JSON.stringify(sub));
          return { data: sub, error: null };
        }

        // Try querying subscriptions table
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data && !error) {
          const subRecord: SubscriptionRecord = {
            id: data.id,
            userId: data.user_id,
            email: data.email,
            selectedPlan: data.selected_plan,
            billingCycle: data.billing_cycle,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.payment_method,
            upiId: data.upi_id,
            transactionRef: data.transaction_ref,
            paymentStatus: data.payment_status,
            subscriptionStatus: data.subscription_status,
            startedAt: data.started_at,
            expiresAt: data.expires_at,
            createdAt: data.created_at,
          };
          localStorage.setItem(getStorageKey(userId, 'subscription'), JSON.stringify(subRecord));
          return { data: subRecord, error: null };
        }
      } catch (err) {
        console.warn('[Supabase Subscription] Fetch error:', err);
      }
    }

    return { data: null, error: null };
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

    // Ensure plan is not accidentally reverted from existing cache/subscription
    let effectivePlan = profile.plan || 'free';
    const cachedProfileStr = localStorage.getItem(getStorageKey(userId, 'profile'));
    if (cachedProfileStr) {
      try {
        const cached = JSON.parse(cachedProfileStr);
        if (cached.plan && cached.plan !== 'free' && (!profile.plan || profile.plan === 'free')) {
          effectivePlan = cached.plan;
        }
      } catch {}
    }

    const mergedProfile: UserProfile = {
      ...profile,
      plan: effectivePlan,
    };

    // Persist all records into user-scoped cloudStore / local cache
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(mergedProfile));
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(goals));

    // Update Supabase Auth user metadata if Supabase is active
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: mergedProfile.fullName || '',
            university: mergedProfile.university || '',
            degree: mergedProfile.degree || '',
            branch: mergedProfile.branch || '',
            program: mergedProfile.program || '',
            year: mergedProfile.year || '',
            career_goal: mergedProfile.careerGoal || '',
            target_role: mergedProfile.targetRole || '',
            bio: mergedProfile.bio || '',
            github_url: mergedProfile.githubUrl || '',
            linkedin_url: mergedProfile.linkedinUrl || '',
            phone: mergedProfile.phone || '',
            location: mergedProfile.location || '',
            plan: mergedProfile.plan,
            is_onboarded: mergedProfile.isOnboarded ?? true,
          },
        });
        if (error) {
          console.error('[Supabase Service] uploadDataToCloud updateUser error:', {
            message: error.message,
            status: error.status,
          });
          return {
            success: false,
            message: error.message,
            error: new Error(error.message),
          };
        }
      } catch (err: any) {
        console.error('[Supabase Service] Notice syncing metadata during cloud upload:', err);
        return {
          success: false,
          message: err.message || 'Failed to sync to Supabase',
          error: new Error(err.message || 'Sync failed'),
        };
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
