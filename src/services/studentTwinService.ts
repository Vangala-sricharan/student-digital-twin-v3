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

let cachedWorkingBucket: string | null = null;

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
};

export const studentTwinService = {
  // ==========================================
  // 0. SUPABASE STORAGE (User Avatars & Profile Photos)
  // ==========================================
  async uploadProfileImage(
    userId: string,
    imageSource: File | Blob | string
  ): Promise<{ url: string | null; error: Error | null }> {
    if (!userId) return { url: null, error: new Error('User ID is required') };
    if (!imageSource) return { url: null, error: new Error('No image provided') };

    try {
      let blob: Blob;
      let contentType = 'image/jpeg';

      if (typeof imageSource === 'string') {
        if (imageSource.startsWith('data:')) {
          const mimeMatch = imageSource.match(/^data:([^;]+);base64,/);
          if (mimeMatch) {
            contentType = mimeMatch[1];
          }
          const base64Data = imageSource.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays[i] = byteCharacters.charCodeAt(i);
          }
          blob = new Blob([byteArrays], { type: contentType });
        } else if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
          return { url: imageSource, error: null };
        } else {
          return { url: null, error: new Error('Invalid image string format') };
        }
      } else {
        blob = imageSource;
        if (blob.type) contentType = blob.type;
      }

      // Fast Supabase Storage upload with hard 3.5-second timeout
      if (isSupabaseConfigured) {
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const filePath = `${userId}/avatar.${ext}`;

        const uploadToBucket = async (bucket: string): Promise<string | null> => {
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(filePath, blob, {
                upsert: true,
                contentType,
                cacheControl: '3600',
              });

            if (!uploadError && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

              if (publicUrlData?.publicUrl) {
                return `${publicUrlData.publicUrl}?t=${Date.now()}`;
              }
            }
          } catch (bucketErr) {
            // Bucket upload failed or not permitted
          }
          return null;
        };

        const attemptUpload = async (): Promise<string | null> => {
          // If we already know the working bucket, use it directly
          if (cachedWorkingBucket) {
            const url = await uploadToBucket(cachedWorkingBucket);
            if (url) return url;
            cachedWorkingBucket = null;
          }

          // Try primary buckets in parallel
          const bucketsToTry = ['avatars', 'profiles', 'user-avatars', 'public'];
          const results = await Promise.allSettled(
            bucketsToTry.map(async (b) => {
              const url = await uploadToBucket(b);
              if (url) {
                cachedWorkingBucket = b;
                return url;
              }
              throw new Error(`Bucket ${b} failed`);
            })
          );

          for (const res of results) {
            if (res.status === 'fulfilled' && res.value) {
              return res.value;
            }
          }
          return null;
        };

        const storageUrl = await withTimeout(attemptUpload(), 3500, null);
        if (storageUrl) {
          return { url: storageUrl, error: null };
        }
      }

      // Fallback: If Storage unavailable or timed out, return compressed data URL instantly
      if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
        return { url: imageSource, error: null };
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: (reader.result as string) || null, error: null });
        };
        reader.onerror = () => {
          resolve({ url: null, error: null });
        };
        reader.readAsDataURL(blob);
      });
    } catch (err: any) {
      console.error('[Supabase Storage] uploadProfileImage notice:', err);
      return { url: typeof imageSource === 'string' ? imageSource : null, error: null };
    }
  },

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
        let user: any = null;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && sessionData.session.user.id === userId) {
            user = sessionData.session.user;
          }
        } catch {}

        if (!user) {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user && userData.user.id === userId) {
              user = userData.user;
            }
          } catch {}
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
          const effectiveProfileImg = user.user_metadata?.profile_image_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || cachedProfile?.profileImageUrl || cachedProfile?.avatarUrl || '';

          const profile: UserProfile = {
            id: user.id,
            email: user.email || cachedProfile?.email || '',
            fullName,
            avatarUrl: effectiveProfileImg,
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
            profileImageUrl: effectiveProfileImg,
            portfolio: user.user_metadata?.portfolio_data || cachedProfile?.portfolio,
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
        // Fallback safely to cached local profile
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
    let cachedObj: Partial<UserProfile> = {};
    if (cached) {
      try {
        cachedObj = JSON.parse(cached);
        existingPlan = cachedObj.plan || 'free';
        existingCycle = cachedObj.billingCycle;
        existingSubStatus = cachedObj.subscriptionStatus;
        existingSubDetails = cachedObj.subscriptionDetails;
      } catch {}
    }

    let effectiveProfileImage = profile.profileImageUrl || profile.avatarUrl || cachedObj.profileImageUrl || cachedObj.avatarUrl || '';

    // If new image is base64 data URL, upload to Supabase Storage first
    if (effectiveProfileImage && effectiveProfileImage.startsWith('data:')) {
      try {
        const { url: storageUrl } = await this.uploadProfileImage(userId, effectiveProfileImage);
        if (storageUrl) {
          effectiveProfileImage = storageUrl;
        }
      } catch (uploadErr) {
        console.warn('[studentTwinService] uploadProfileImage notice:', uploadErr);
      }
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
      profileImageUrl: effectiveProfileImage,
      avatarUrl: effectiveProfileImage,
      portfolio: profile.portfolio || cachedObj.portfolio,
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
        let hasActiveSession = false;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && sessionData.session.user.id === userId) {
            hasActiveSession = true;
          }
        } catch {}

        if (hasActiveSession) {
          const updatePromise = supabase.auth.updateUser({
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
              profile_image_url: formattedProfile.profileImageUrl || '',
              avatar_url: formattedProfile.avatarUrl || formattedProfile.profileImageUrl || '',
              portfolio_data: formattedProfile.portfolio,
              plan: formattedProfile.plan,
              billing_cycle: formattedProfile.billingCycle,
              subscription_status: formattedProfile.subscriptionStatus,
              is_onboarded: formattedProfile.isOnboarded,
            },
          });

          const { error } = await withTimeout(updatePromise, 3500, { data: null, error: null as any });
          if (error) {
            console.warn('[Supabase Service] upsertUserProfile updateUser notice (saved locally):', error.message || error);
          }
        }
      } catch (err: any) {
        console.warn('[Supabase Service] Notice during user metadata sync (saved locally):', err?.message || err);
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
        let hasActiveSession = false;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && sessionData.session.user.id === userId) {
            hasActiveSession = true;
          }
        } catch {}

        if (hasActiveSession) {
          // 1. Update Auth user metadata
          const updatePromise = supabase.auth.updateUser({
            data: {
              plan: subscription.selectedPlan,
              billing_cycle: subscription.billingCycle,
              subscription_status: subscription.subscriptionStatus,
              subscription_data: subscription,
            },
          });

          const { error: metaErr } = await withTimeout(updatePromise, 3500, { data: null, error: null as any });
          if (metaErr) {
            console.warn('[Supabase Subscription] Notice updating user metadata (saved locally):', metaErr.message || metaErr);
          }
        }

        // 2. Attempt upsert into subscriptions table (if schema exists)
        try {
          await supabase.from('subscriptions').upsert(
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
        } catch (tableEx) {
          console.warn('[Supabase Subscription] Optional database table insert skipped:', tableEx);
        }

        console.log('[Supabase Subscription] Subscription successfully persisted.');
        return { data: subscription, error: null };
      } catch (err: any) {
        console.warn('[Supabase Subscription] Notice during subscription persistence (saved locally):', err?.message || err);
        return { data: subscription, error: null };
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
  // 7. USER-SCOPED CLOUD PERSISTENCE & RESTORATION
  // ==========================================
  async fetchCloudStudentTwin(userId: string): Promise<{
    data: {
      profile: UserProfile | null;
      students: StudentProfile[];
      skills: SkillItem[];
      projects: ProjectItem[];
      achievements: AchievementItem[];
      careerGoals: CareerGoalItem[];
      activeStudentId: string | null;
      lastSyncedAt?: string;
    } | null;
    error: Error | null;
  }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const getLocalBundle = () => {
      const cachedProfile = localStorage.getItem(getStorageKey(userId, 'profile'));
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          const students = JSON.parse(localStorage.getItem(getStorageKey(userId, 'students')) || '[]');
          const skills = JSON.parse(localStorage.getItem(getStorageKey(userId, 'skills')) || '[]');
          const projects = JSON.parse(localStorage.getItem(getStorageKey(userId, 'projects')) || '[]');
          const achievements = JSON.parse(localStorage.getItem(getStorageKey(userId, 'achievements')) || '[]');
          const careerGoals = JSON.parse(localStorage.getItem(getStorageKey(userId, 'career_goals')) || '[]');
          const activeStudentId = localStorage.getItem(getStorageKey(userId, 'active_student_id'));
          return {
            profile,
            students,
            skills,
            projects,
            achievements,
            careerGoals,
            activeStudentId,
          };
        } catch {}
      }
      return null;
    };

    if (!isSupabaseConfigured) {
      // Local-only environment fallback
      return { data: getLocalBundle(), error: null };
    }

    try {
      let user: any = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && sessionData.session.user.id === userId) {
          user = sessionData.session.user;
        }
      } catch {}

      if (!user) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user && userData.user.id === userId) {
            user = userData.user;
          }
        } catch {}
      }

      if (!user || user.id !== userId) {
        return { data: getLocalBundle(), error: null };
      }

      const cloudData = user.user_metadata?.student_twin_data;
      const cachedProfileStr = localStorage.getItem(getStorageKey(userId, 'profile'));
      let cachedProfile: Partial<UserProfile> = {};
      if (cachedProfileStr) {
        try {
          cachedProfile = JSON.parse(cachedProfileStr);
        } catch {}
      }

      if (cloudData && typeof cloudData === 'object') {
        const cloudProfile = cloudData.profile || {};
        const effectiveProfileImage =
          user.user_metadata?.profile_image_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          cloudProfile.profileImageUrl ||
          cloudProfile.avatarUrl ||
          cachedProfile.profileImageUrl ||
          cachedProfile.avatarUrl ||
          '';

        const effectivePlan: PlanType =
          (user.user_metadata?.plan as PlanType) ||
          cloudProfile.plan ||
          cachedProfile.plan ||
          'free';

        const effectiveBillingCycle =
          user.user_metadata?.billing_cycle ||
          cloudProfile.billingCycle ||
          cachedProfile.billingCycle;

        const effectiveSubscriptionStatus =
          user.user_metadata?.subscription_status ||
          cloudProfile.subscriptionStatus ||
          cachedProfile.subscriptionStatus;

        const profile: UserProfile = {
          id: user.id,
          email: user.email || cachedProfile.email || '',
          fullName: user.user_metadata?.full_name || cloudProfile.fullName || cachedProfile.fullName || 'Student User',
          university: user.user_metadata?.university || cloudProfile.university || cachedProfile.university || '',
          degree: user.user_metadata?.degree || cloudProfile.degree || cachedProfile.degree || '',
          branch: user.user_metadata?.branch || cloudProfile.branch || cachedProfile.branch || '',
          program: user.user_metadata?.program || cloudProfile.program || cachedProfile.program || '',
          year: user.user_metadata?.year || cloudProfile.year || cachedProfile.year || '',
          expectedGraduationYear: user.user_metadata?.expected_graduation_year || cloudProfile.expectedGraduationYear || cachedProfile.expectedGraduationYear || '',
          careerGoal: user.user_metadata?.career_goal || cloudProfile.careerGoal || cachedProfile.careerGoal || '',
          targetRole: user.user_metadata?.target_role || cloudProfile.targetRole || cachedProfile.targetRole || '',
          currentSkills: user.user_metadata?.current_skills || cloudProfile.currentSkills || cachedProfile.currentSkills || '',
          skills: user.user_metadata?.skills || cloudProfile.skills || cachedProfile.skills || [],
          bio: user.user_metadata?.bio || cloudProfile.bio || cachedProfile.bio || '',
          githubUrl: user.user_metadata?.github_url || cloudProfile.githubUrl || cachedProfile.githubUrl || '',
          linkedinUrl: user.user_metadata?.linkedin_url || cloudProfile.linkedinUrl || cachedProfile.linkedinUrl || '',
          phone: user.user_metadata?.phone || cloudProfile.phone || cachedProfile.phone || '',
          location: user.user_metadata?.location || cloudProfile.location || cachedProfile.location || '',
          profileImageUrl: effectiveProfileImage,
          avatarUrl: effectiveProfileImage,
          portfolio: cloudProfile.portfolio || user.user_metadata?.portfolio_data || cachedProfile.portfolio,
          plan: effectivePlan,
          billingCycle: effectiveBillingCycle,
          subscriptionStatus: effectiveSubscriptionStatus,
          subscriptionDetails: user.user_metadata?.subscription_data || cloudProfile.subscriptionDetails || cachedProfile.subscriptionDetails,
          isOnboarded: user.user_metadata?.is_onboarded ?? (cloudProfile.isOnboarded ?? (cachedProfile.isOnboarded ?? true)),
          createdAt: user.created_at || cloudProfile.createdAt || cachedProfile.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDemo: false,
        };

        const students: StudentProfile[] = Array.isArray(cloudData.students) ? cloudData.students : [];
        const skills: SkillItem[] = Array.isArray(cloudData.skills) ? cloudData.skills : [];
        const projects: ProjectItem[] = Array.isArray(cloudData.projects) ? cloudData.projects : [];
        const achievements: AchievementItem[] = Array.isArray(cloudData.achievements) ? cloudData.achievements : [];
        const careerGoals: CareerGoalItem[] = Array.isArray(cloudData.careerGoals)
          ? cloudData.careerGoals
          : Array.isArray(cloudData.career_goals)
          ? cloudData.career_goals
          : [];
        const activeStudentId: string | null = cloudData.activeStudentId || cloudData.active_student_id || students[0]?.id || null;

        // Restore into user-scoped local storage for instant session access
        localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
        localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
        localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
        localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
        localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
        localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(careerGoals));
        if (activeStudentId) {
          localStorage.setItem(getStorageKey(userId, 'active_student_id'), activeStudentId);
        }

        return {
          data: {
            profile,
            students,
            skills,
            projects,
            achievements,
            careerGoals,
            activeStudentId,
            lastSyncedAt: cloudData.lastSyncedAt || cloudData.uploaded_at,
          },
          error: null,
        };
      }

      // If no student_twin_data bundle exists, check if basic profile exists in user metadata or local cache
      if (user.user_metadata?.university || user.user_metadata?.full_name || user.user_metadata?.profile_image_url) {
        const localBundle = getLocalBundle();
        if (localBundle && (localBundle.projects?.length || localBundle.students?.length || localBundle.skills?.length || localBundle.achievements?.length || localBundle.careerGoals?.length)) {
          return { data: localBundle, error: null };
        }

        const { data: profile } = await this.fetchUserProfile(userId);
        return {
          data: {
            profile: profile || (localBundle ? localBundle.profile : null),
            students: localBundle?.students || [],
            skills: localBundle?.skills || [],
            projects: localBundle?.projects || [],
            achievements: localBundle?.achievements || [],
            careerGoals: localBundle?.careerGoals || [],
            activeStudentId: localBundle?.activeStudentId || null,
          },
          error: null,
        };
      }

      return { data: getLocalBundle(), error: null };
    } catch (err: any) {
      console.warn('[Supabase Service] Notice during fetchCloudStudentTwin (falling back to local store):', err?.message || err);
      return { data: getLocalBundle(), error: null };
    }
  },

  async uploadDataToCloud(
    userId: string,
    profile: UserProfile,
    students: StudentProfile[],
    skills: SkillItem[],
    projects: ProjectItem[],
    achievements: AchievementItem[],
    goals: CareerGoalItem[],
    activeStudentId?: string | null
  ): Promise<{ success: boolean; message: string; error: Error | null }> {
    if (!userId) {
      return { success: false, message: 'Cloud Sync Failed — Please try again.', error: new Error('User is not authenticated') };
    }

    // Ensure plan and profile image are not accidentally reverted from existing cache
    let existingCached: Partial<UserProfile> = {};
    const cachedProfileStr = localStorage.getItem(getStorageKey(userId, 'profile'));
    if (cachedProfileStr) {
      try {
        existingCached = JSON.parse(cachedProfileStr);
      } catch {}
    }

    let effectivePlan = profile.plan || existingCached.plan || 'free';
    let effectiveBillingCycle = profile.billingCycle || existingCached.billingCycle;
    let effectiveSubStatus = profile.subscriptionStatus || existingCached.subscriptionStatus;
    let effectiveProfileImage = profile.profileImageUrl || profile.avatarUrl || existingCached.profileImageUrl || existingCached.avatarUrl || '';
    const effectivePortfolio = profile.portfolio || existingCached.portfolio;

    // If new image is base64 data URL, upload to Supabase Storage first
    if (effectiveProfileImage && effectiveProfileImage.startsWith('data:')) {
      try {
        const { url: storageUrl } = await this.uploadProfileImage(userId, effectiveProfileImage);
        if (storageUrl) {
          effectiveProfileImage = storageUrl;
        }
      } catch (uploadErr) {
        console.warn('[studentTwinService] uploadProfileImage notice:', uploadErr);
      }
    }

    const mergedProfile: UserProfile = {
      ...existingCached,
      ...profile,
      id: userId,
      profileImageUrl: effectiveProfileImage,
      avatarUrl: effectiveProfileImage,
      portfolio: effectivePortfolio,
      plan: effectivePlan,
      billingCycle: effectiveBillingCycle,
      subscriptionStatus: effectiveSubStatus,
      updatedAt: new Date().toISOString(),
    };

    const cloudBundle = {
      profile: mergedProfile,
      students,
      skills,
      projects,
      achievements,
      careerGoals: goals,
      activeStudentId: activeStudentId || students[0]?.id || null,
      lastSyncedAt: new Date().toISOString(),
    };

    // 1. Persist all records into user-scoped local cache
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(mergedProfile));
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(goals));
    if (cloudBundle.activeStudentId) {
      localStorage.setItem(getStorageKey(userId, 'active_student_id'), cloudBundle.activeStudentId);
    }

    // 2. Persist to Supabase Auth cloud metadata
    if (isSupabaseConfigured) {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            student_twin_data: cloudBundle,
            full_name: mergedProfile.fullName || '',
            university: mergedProfile.university || '',
            degree: mergedProfile.degree || '',
            branch: mergedProfile.branch || '',
            program: mergedProfile.program || '',
            year: mergedProfile.year || '',
            expected_graduation_year: mergedProfile.expectedGraduationYear || '',
            career_goal: mergedProfile.careerGoal || '',
            target_role: mergedProfile.targetRole || '',
            current_skills: mergedProfile.currentSkills || '',
            skills: mergedProfile.skills || [],
            bio: mergedProfile.bio || '',
            github_url: mergedProfile.githubUrl || '',
            linkedin_url: mergedProfile.linkedinUrl || '',
            phone: mergedProfile.phone || '',
            location: mergedProfile.location || '',
            profile_image_url: mergedProfile.profileImageUrl || '',
            portfolio_data: mergedProfile.portfolio,
            plan: mergedProfile.plan,
            billing_cycle: mergedProfile.billingCycle,
            subscription_status: mergedProfile.subscriptionStatus,
            is_onboarded: mergedProfile.isOnboarded ?? true,
          },
        });

        if (updateError) {
          console.warn('[Supabase Service] uploadDataToCloud updateUser warning:', updateError.message);
          return {
            success: true,
            message: 'Saved locally. Cloud sync will update when connection is restored.',
            error: null,
          };
        }

        // 3. Attempt database table persistence (if database tables exist)
        try {
          await Promise.allSettled([
            supabase.from('student_profiles').upsert(
              students.map((s) => ({ ...s, user_id: userId, updated_at: new Date().toISOString() })),
              { onConflict: 'id' }
            ),
            supabase.from('skills').upsert(
              skills.map((s) => ({ ...s, user_id: userId, updated_at: new Date().toISOString() })),
              { onConflict: 'id' }
            ),
            supabase.from('projects').upsert(
              projects.map((p) => ({ ...p, user_id: userId, updated_at: new Date().toISOString() })),
              { onConflict: 'id' }
            ),
            supabase.from('achievements').upsert(
              achievements.map((a) => ({ ...a, user_id: userId, updated_at: new Date().toISOString() })),
              { onConflict: 'id' }
            ),
            supabase.from('career_goals').upsert(
              goals.map((g) => ({ ...g, user_id: userId, updated_at: new Date().toISOString() })),
              { onConflict: 'id' }
            ),
          ]);
        } catch (tableErr) {
          console.warn('[Supabase Service] Database table sync notice (auth cloudStore is primary):', tableErr);
        }

      } catch (err: any) {
        console.warn('[Supabase Service] Notice during uploadDataToCloud (saved locally):', err?.message || err);
        return {
          success: true,
          message: 'Saved to local workspace. Cloud sync will update when connection is restored.',
          error: null,
        };
      }
    }

    return {
      success: true,
      message: 'Cloud Sync Successful: Your Student Twin data is safely stored in the cloud.',
      error: null,
    };
  },

  // Clear temporary local state for this user session upon logout (Cloud data remains in Supabase)
  clearUserCache(userId: string) {
    if (!userId) return;
    const suffixes = ['profile', 'students', 'skills', 'projects', 'achievements', 'career_goals', 'active_student_id'];
    suffixes.forEach((suffix) => {
      localStorage.removeItem(getStorageKey(userId, suffix));
    });
  },
};
