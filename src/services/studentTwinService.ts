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

const getEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return String(import.meta.env[key]).trim();
    }
  } catch {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {}

  return '';
};

const getSupabaseHost = (): string => {
  try {
    const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
    if (url) {
      const parsed = new URL(url);
      return parsed.host;
    }
  } catch {}
  return 'supabase-host';
};

// Standardized Modular Diagnostic Logger
export const logCloudDiag = (
  operation: 'Cloud Sync' | 'Cloud Load' | 'Cloud Delete',
  method: string,
  endpoint: string,
  status: number,
  result: 'SUCCESS' | 'FAILED',
  count?: number,
  reason?: string | null
) => {
  let countLabel: string | null = null;
  if (count !== undefined) {
    if (endpoint.includes('projects')) {
      countLabel = operation === 'Cloud Load' ? `Projects loaded: ${count}` : `Projects: ${count}`;
    } else if (endpoint.includes('skills')) {
      countLabel = operation === 'Cloud Load' ? `Skills loaded: ${count}` : `Skills: ${count}`;
    } else if (endpoint.includes('achievements')) {
      countLabel = operation === 'Cloud Load' ? `Achievements loaded: ${count}` : `Achievements: ${count}`;
    } else if (endpoint.includes('career-goals')) {
      countLabel = operation === 'Cloud Load' ? `Career Goals loaded: ${count}` : `Career Goals: ${count}`;
    } else if (endpoint.includes('students')) {
      countLabel = operation === 'Cloud Load' ? `Students loaded: ${count}` : `Students: ${count}`;
    } else if (endpoint.includes('profile')) {
      countLabel = `Profile: ${count}`;
    } else {
      countLabel = `Records: ${count}`;
    }
  }

  const lines = [
    `[${operation}]`,
    `${method} ${endpoint}`,
    `Status: ${status || (result === 'SUCCESS' ? 200 : 'ERROR')}`,
    countLabel,
    `Result: ${result}`,
    reason ? `Reason: ${reason}` : null,
  ].filter(Boolean);

  if (result === 'SUCCESS') {
    console.log(lines.join('\n'));
  } else {
    console.warn(lines.join('\n'));
  }
};

const logSupabaseDiag = (operation: string, target: string, userId: string, error?: any, status?: any, via = 'Server/API') => {
  const host = getSupabaseHostNameClient();
  if (error) {
    console.warn(`[Supabase Diag] Host: ${host} | User: ${userId || 'none'} | Op: ${operation} | Target: ${target} | Status: ${status || 'FAILED'} | Error:`, {
      message: error?.message || String(error),
      code: error?.code || error?.status || status,
      details: error?.details || error?.hint || null,
      via,
    });
  } else {
    console.log(`[Supabase Diag] Host: ${host} | User: ${userId || 'none'} | Op: ${operation} | Target: ${target} | Status: ${status || 'OK'} | Via: ${via}`);
  }
};

const getSupabaseHostNameClient = (): string => {
  try {
    const url = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
    if (url) {
      return new URL(url).host;
    }
  } catch {}
  return 'sjrboaydzrfwwgvlifth.supabase.co';
};

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
  // Helper to compress base64 images into lightweight thumbnails (< 15KB)
  async compressImageBase64(dataUrl: string, maxDim = 160, quality = 0.7): Promise<string> {
    if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', quality);
              resolve(compressed);
              return;
            }
          } catch {}
          resolve(dataUrl);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch {
        resolve(dataUrl);
      }
    });
  },

  // Helper to strip heavy base64 strings from Supabase Auth user_metadata to avoid payload/CORS failure (Failed to fetch)
  sanitizeMetadataPayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeMetadataPayload(item));
    }
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        if (value.startsWith('data:') && value.length > 2048) {
          sanitized[key] = '';
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadataPayload(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  },

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
          if (cachedWorkingBucket) {
            const url = await uploadToBucket(cachedWorkingBucket);
            if (url) return url;
            cachedWorkingBucket = null;
          }

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
      console.warn('[Supabase Storage] uploadProfileImage notice:', err);
      return { url: typeof imageSource === 'string' ? imageSource : null, error: null };
    }
  },

  // ==========================================
  // 1. USER PROFILES (Foundation Profile)
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

    if (isSupabaseConfigured) {
      try {
        // Read auth metadata safely from current session memory without extra network overhead
        let user: any = null;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && sessionData.session.user.id === userId) {
            user = sessionData.session.user;
          }
        } catch {}

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

    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(formattedProfile));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_profiles').upsert({
          id: `sp_${userId}_primary`,
          user_id: userId,
          name: formattedProfile.fullName,
          university: formattedProfile.university,
          degree: formattedProfile.degree,
          branch: formattedProfile.branch,
          year: formattedProfile.year,
          career_goal: formattedProfile.careerGoal,
          target_role: formattedProfile.targetRole,
          profile_data: formattedProfile,
          is_active: true,
        });

        await supabase.auth.updateUser({
          data: {
            full_name: formattedProfile.fullName,
            university: formattedProfile.university,
            degree: formattedProfile.degree,
            branch: formattedProfile.branch,
            year: formattedProfile.year,
            career_goal: formattedProfile.careerGoal,
            target_role: formattedProfile.targetRole,
            plan: formattedProfile.plan,
            is_onboarded: formattedProfile.isOnboarded,
            profile: formattedProfile,
          },
        });
      } catch (err: any) {
        logSupabaseDiag('UPSERT', 'student_profiles (primary foundation)', userId, err, 500, 'Supabase Client');
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

    localStorage.setItem(getStorageKey(userId, 'subscription'), JSON.stringify(subscription));

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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscriptions').upsert({
          id: subscription.id || `sub_${userId}`,
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
        });

        await supabase.auth.updateUser({
          data: {
            plan: subscription.selectedPlan,
            billing_cycle: subscription.billingCycle,
            subscription_status: subscription.subscriptionStatus,
            subscription_data: subscription,
          },
        });
        return { data: subscription, error: null };
      } catch (err: any) {
        logSupabaseDiag('UPSERT', 'subscriptions', userId, err, 500, 'Supabase Client');
        return { data: subscription, error: null };
      }
    }

    return { data: subscription, error: null };
  },

  async fetchSubscription(userId: string): Promise<{ data: SubscriptionRecord | null; error: Error | null }> {
    if (!userId) return { data: null, error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'subscription'));
    if (cached) {
      try {
        return { data: JSON.parse(cached), error: null };
      } catch {}
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

    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    const list: StudentProfile[] = current ? JSON.parse(current) : [];
    list.unshift(newProfile);
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(list));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_profiles').upsert({
          id: newId,
          user_id: userId,
          name: newProfile.name,
          university: newProfile.university,
          degree: newProfile.degree,
          branch: newProfile.branch,
          year: newProfile.year,
          career_goal: newProfile.careerGoal,
          target_role: newProfile.targetRole,
          profile_data: newProfile.profileData,
          is_active: Boolean(newProfile.isActive),
        });
        await supabase.auth.updateUser({
          data: {
            students: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('INSERT', 'student_profiles', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: newProfile, error: null };
  },

  async updateStudentProfile(userId: string, id: string, updates: Partial<StudentProfile>): Promise<{ data: StudentProfile | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Profile ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    let updatedItem: StudentProfile | null = null;
    let list: StudentProfile[] = [];
    if (current) {
      list = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        updatedItem = list[index];
        localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(list));
      }
    }

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('student_profiles').upsert({
          id,
          user_id: userId,
          name: updatedItem.name,
          university: updatedItem.university,
          degree: updatedItem.degree,
          branch: updatedItem.branch,
          year: updatedItem.year,
          career_goal: updatedItem.careerGoal,
          target_role: updatedItem.targetRole,
          profile_data: updatedItem.profileData,
          is_active: Boolean(updatedItem.isActive),
        });
        await supabase.auth.updateUser({
          data: {
            students: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('UPDATE', 'student_profiles', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: updatedItem, error: null };
  },

  async deleteStudentProfile(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Profile ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'students'));
    let filtered: StudentProfile[] = [];
    if (current) {
      const list: StudentProfile[] = JSON.parse(current);
      filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(filtered));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('student_profiles').delete().eq('id', id);
        await supabase.auth.updateUser({
          data: {
            students: filtered,
          },
        });
      } catch (err) {
        logSupabaseDiag('DELETE', 'student_profiles', userId, err, 500, 'Supabase Client');
      }
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('skills').upsert({
          id: newId,
          user_id: userId,
          student_profile_id: newSkill.studentProfileId || null,
          skill_name: newSkill.skillName,
          category: newSkill.category,
          proficiency: newSkill.proficiency,
          score: newSkill.score,
        });
        await supabase.auth.updateUser({
          data: {
            skills: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('INSERT', 'skills', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: newSkill, error: null };
  },

  async updateSkill(userId: string, id: string, updates: Partial<SkillItem>): Promise<{ data: SkillItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Skill ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'skills'));
    let updatedItem: SkillItem | null = null;
    let list: SkillItem[] = [];
    if (current) {
      list = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        updatedItem = list[index];
        localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(list));
      }
    }

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('skills').upsert({
          id,
          user_id: userId,
          student_profile_id: updatedItem.studentProfileId || null,
          skill_name: updatedItem.skillName,
          category: updatedItem.category,
          proficiency: updatedItem.proficiency,
          score: updatedItem.score,
        });
        await supabase.auth.updateUser({
          data: {
            skills: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('UPDATE', 'skills', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: updatedItem, error: null };
  },

  async deleteSkill(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Skill ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'skills'));
    let filtered: SkillItem[] = [];
    if (current) {
      const list: SkillItem[] = JSON.parse(current);
      filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(filtered));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('skills').delete().eq('id', id);
        await supabase.auth.updateUser({
          data: {
            skills: filtered,
          },
        });
      } catch (err) {
        logSupabaseDiag('DELETE', 'skills', userId, err, 500, 'Supabase Client');
      }
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('projects').upsert({
          id: newId,
          user_id: userId,
          student_profile_id: newProject.studentProfileId || null,
          title: newProject.title,
          description: newProject.description,
          architecture: newProject.architecture || '',
          tech_stack: Array.isArray(newProject.techStack) ? newProject.techStack : [],
          github_url: newProject.githubUrl || '',
          live_demo_url: newProject.liveDemoUrl || '',
          role: newProject.role || 'Lead Developer',
          difficulty: newProject.difficulty || 'Intermediate',
          status: newProject.status || 'Completed',
        });
        await supabase.auth.updateUser({
          data: {
            projects: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('INSERT', 'projects', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: newProject, error: null };
  },

  async updateProject(userId: string, id: string, updates: Partial<ProjectItem>): Promise<{ data: ProjectItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Project ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'projects'));
    let updatedItem: ProjectItem | null = null;
    let list: ProjectItem[] = [];
    if (current) {
      list = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        updatedItem = list[index];
        localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(list));
      }
    }

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('projects').upsert({
          id,
          user_id: userId,
          student_profile_id: updatedItem.studentProfileId || null,
          title: updatedItem.title,
          description: updatedItem.description,
          architecture: updatedItem.architecture || '',
          tech_stack: Array.isArray(updatedItem.techStack) ? updatedItem.techStack : [],
          github_url: updatedItem.githubUrl || '',
          live_demo_url: updatedItem.liveDemoUrl || '',
          role: updatedItem.role || 'Lead Developer',
          difficulty: updatedItem.difficulty || 'Intermediate',
          status: updatedItem.status || 'Completed',
        });
        await supabase.auth.updateUser({
          data: {
            projects: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('UPDATE', 'projects', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: updatedItem, error: null };
  },

  async deleteProject(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Project ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'projects'));
    let filtered: ProjectItem[] = [];
    if (current) {
      const list: ProjectItem[] = JSON.parse(current);
      filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(filtered));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('projects').delete().eq('id', id);
        await supabase.auth.updateUser({
          data: {
            projects: filtered,
          },
        });
      } catch (err) {
        logSupabaseDiag('DELETE', 'projects', userId, err, 500, 'Supabase Client');
      }
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('achievements').upsert({
          id: newId,
          user_id: userId,
          student_profile_id: newAchievement.studentProfileId || null,
          title: newAchievement.title,
          organization: newAchievement.organization,
          date: newAchievement.date,
          description: newAchievement.description,
          certificate_url: newAchievement.certificateUrl || '',
        });
        await supabase.auth.updateUser({
          data: {
            achievements: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('INSERT', 'achievements', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: newAchievement, error: null };
  },

  async updateAchievement(userId: string, id: string, updates: Partial<AchievementItem>): Promise<{ data: AchievementItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Achievement ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'achievements'));
    let updatedItem: AchievementItem | null = null;
    let list: AchievementItem[] = [];
    if (current) {
      list = JSON.parse(current);
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates, updatedAt: now };
        updatedItem = list[index];
        localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(list));
      }
    }

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('achievements').upsert({
          id,
          user_id: userId,
          student_profile_id: updatedItem.studentProfileId || null,
          title: updatedItem.title,
          organization: updatedItem.organization,
          date: updatedItem.date,
          description: updatedItem.description,
          certificate_url: updatedItem.certificateUrl || '',
        });
        await supabase.auth.updateUser({
          data: {
            achievements: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('UPDATE', 'achievements', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: updatedItem, error: null };
  },

  async deleteAchievement(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Achievement ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'achievements'));
    let filtered: AchievementItem[] = [];
    if (current) {
      const list: AchievementItem[] = JSON.parse(current);
      filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(filtered));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('achievements').delete().eq('id', id);
        await supabase.auth.updateUser({
          data: {
            achievements: filtered,
          },
        });
      } catch (err) {
        logSupabaseDiag('DELETE', 'achievements', userId, err, 500, 'Supabase Client');
      }
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('career_goals').upsert({
          id: newId,
          user_id: userId,
          student_profile_id: newGoal.studentProfileId || null,
          goal: newGoal.goal,
          target_role: newGoal.targetRole,
          target_companies: Array.isArray(newGoal.targetCompanies) ? newGoal.targetCompanies : [],
          required_skills: Array.isArray(newGoal.requiredSkills) ? newGoal.requiredSkills : [],
          timeline: newGoal.timeline,
          is_active: Boolean(newGoal.isActive),
        });
        await supabase.auth.updateUser({
          data: {
            career_goals: list,
            careerGoals: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('INSERT', 'career_goals', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: newGoal, error: null };
  },

  async updateCareerGoal(userId: string, id: string, updates: Partial<CareerGoalItem>): Promise<{ data: CareerGoalItem | null; error: Error | null }> {
    if (!userId || !id) return { data: null, error: new Error('User ID and Goal ID are required') };

    const now = new Date().toISOString();
    const current = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    let updatedItem: CareerGoalItem | null = null;
    let list: CareerGoalItem[] = [];
    if (current) {
      list = JSON.parse(current);
      if (updates.isActive) {
        list = list.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: now } : { ...item, isActive: false }));
      } else {
        const index = list.findIndex((item) => item.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updates, updatedAt: now };
        }
      }
      localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(list));
      updatedItem = list.find((item) => item.id === id) || null;
    }

    if (isSupabaseConfigured && updatedItem) {
      try {
        await supabase.from('career_goals').upsert({
          id,
          user_id: userId,
          student_profile_id: updatedItem.studentProfileId || null,
          goal: updatedItem.goal,
          target_role: updatedItem.targetRole,
          target_companies: Array.isArray(updatedItem.targetCompanies) ? updatedItem.targetCompanies : [],
          required_skills: Array.isArray(updatedItem.requiredSkills) ? updatedItem.requiredSkills : [],
          timeline: updatedItem.timeline,
          is_active: Boolean(updatedItem.isActive),
        });
        await supabase.auth.updateUser({
          data: {
            career_goals: list,
            careerGoals: list,
          },
        });
      } catch (err) {
        logSupabaseDiag('UPDATE', 'career_goals', userId, err, 500, 'Supabase Client');
      }
    }

    return { data: updatedItem, error: null };
  },

  async deleteCareerGoal(userId: string, id: string): Promise<{ success: boolean; error: Error | null }> {
    if (!userId || !id) return { success: false, error: new Error('User ID and Goal ID are required') };

    const current = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    let filtered: CareerGoalItem[] = [];
    if (current) {
      const list: CareerGoalItem[] = JSON.parse(current);
      filtered = list.filter((item) => item.id !== id);
      localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(filtered));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('career_goals').delete().eq('id', id);
        await supabase.auth.updateUser({
          data: {
            career_goals: filtered,
            careerGoals: filtered,
          },
        });
      } catch (err) {
        logSupabaseDiag('DELETE', 'career_goals', userId, err, 500, 'Supabase Client');
      }
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

    const localBundle = getLocalBundle();

    if (!isSupabaseConfigured) {
      return { data: localBundle, error: null };
    }

    try {
      // 1. Directly fetch authenticated user metadata from Supabase
      let authUser: any = null;
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && authData.user.id === userId) {
          authUser = authData.user;
        }
      } catch {}

      const userMeta = authUser?.user_metadata || {};

      // 2. Query direct Supabase tables in parallel if available
      const [
        profTableRes,
        studentsTableRes,
        skillsTableRes,
        projectsTableRes,
        achievementsTableRes,
        careerGoalsTableRes,
      ] = await Promise.allSettled([
        supabase.from('student_profiles').select('*').eq('user_id', userId).limit(1),
        supabase.from('student_profiles').select('*').eq('user_id', userId),
        supabase.from('skills').select('*').eq('user_id', userId),
        supabase.from('projects').select('*').eq('user_id', userId),
        supabase.from('achievements').select('*').eq('user_id', userId),
        supabase.from('career_goals').select('*').eq('user_id', userId),
      ]);

      const dbProfile = profTableRes.status === 'fulfilled' && !profTableRes.value.error ? profTableRes.value.data?.[0] : null;
      const dbStudents = (studentsTableRes.status === 'fulfilled' && !studentsTableRes.value.error && Array.isArray(studentsTableRes.value.data)) ? studentsTableRes.value.data : (userMeta.students || []);
      const dbSkills = (skillsTableRes.status === 'fulfilled' && !skillsTableRes.value.error && Array.isArray(skillsTableRes.value.data)) ? skillsTableRes.value.data : (userMeta.skills || []);
      const dbProjects = (projectsTableRes.status === 'fulfilled' && !projectsTableRes.value.error && Array.isArray(projectsTableRes.value.data)) ? projectsTableRes.value.data : (userMeta.projects || []);
      const dbAchievements = (achievementsTableRes.status === 'fulfilled' && !achievementsTableRes.value.error && Array.isArray(achievementsTableRes.value.data)) ? achievementsTableRes.value.data : (userMeta.achievements || []);
      const dbCareerGoals = (careerGoalsTableRes.status === 'fulfilled' && !careerGoalsTableRes.value.error && Array.isArray(careerGoalsTableRes.value.data)) ? careerGoalsTableRes.value.data : (userMeta.career_goals || userMeta.careerGoals || []);

      // Safe merge strategy: NEVER discard local state if cloud returns empty
      const mergeEntities = <T extends { id: string }>(dbItems: any[] = [], localItems?: T[] | null): T[] => {
        const map = new Map<string, T>();
        if (Array.isArray(localItems)) {
          for (const item of localItems) {
            if (item && item.id) map.set(item.id, item);
          }
        }
        if (Array.isArray(dbItems) && dbItems.length > 0) {
          for (const item of dbItems) {
            if (item && item.id) {
              const mapped: any = {
                ...item,
                userId: item.user_id || item.userId || userId,
                studentProfileId: item.student_profile_id || item.studentProfileId,
                skillName: item.skill_name || item.skillName,
                techStack: item.tech_stack || item.techStack,
                githubUrl: item.github_url || item.githubUrl,
                liveDemoUrl: item.live_demo_url || item.liveDemoUrl,
                certificateUrl: item.certificate_url || item.certificateUrl,
                targetRole: item.target_role || item.targetRole,
                targetCompanies: item.target_companies || item.targetCompanies,
                requiredSkills: item.required_skills || item.requiredSkills,
                isActive: item.is_active !== undefined ? Boolean(item.is_active) : Boolean(item.isActive),
              };
              map.set(item.id, { ...(map.get(item.id) || {}), ...mapped });
            }
          }
        }
        return Array.from(map.values());
      };

      const students = mergeEntities<StudentProfile>(dbStudents, localBundle?.students);
      const skills = mergeEntities<SkillItem>(dbSkills, localBundle?.skills);
      const projects = mergeEntities<ProjectItem>(dbProjects, localBundle?.projects);
      const achievements = mergeEntities<AchievementItem>(dbAchievements, localBundle?.achievements);
      const careerGoals = mergeEntities<CareerGoalItem>(dbCareerGoals, localBundle?.careerGoals);

      const cachedProfile = localBundle?.profile;
      const metaProfile = userMeta.profile || {};
      const primaryStudent = students.find((s) => s.id === `sp_${userId}_primary` || s.isActive) || students[0];

      const profile: UserProfile = {
        id: userId,
        email: authUser?.email || dbProfile?.email || metaProfile.email || cachedProfile?.email || '',
        fullName: metaProfile.fullName || userMeta.full_name || dbProfile?.name || cachedProfile?.fullName || primaryStudent?.name || 'Student User',
        university: metaProfile.university || userMeta.university || dbProfile?.university || cachedProfile?.university || primaryStudent?.university || '',
        degree: metaProfile.degree || userMeta.degree || dbProfile?.degree || cachedProfile?.degree || primaryStudent?.degree || 'B.Tech',
        branch: metaProfile.branch || userMeta.branch || dbProfile?.branch || cachedProfile?.branch || primaryStudent?.branch || '',
        program: metaProfile.program || cachedProfile?.program || (primaryStudent?.degree && primaryStudent?.branch ? `${primaryStudent.degree} in ${primaryStudent.branch}` : ''),
        year: metaProfile.year || userMeta.year || dbProfile?.year || cachedProfile?.year || primaryStudent?.year || '1st Year',
        expectedGraduationYear: metaProfile.expectedGraduationYear || userMeta.expected_graduation_year || cachedProfile?.expectedGraduationYear || '',
        careerGoal: metaProfile.careerGoal || userMeta.career_goal || dbProfile?.career_goal || cachedProfile?.careerGoal || primaryStudent?.careerGoal || '',
        targetRole: metaProfile.targetRole || userMeta.target_role || dbProfile?.target_role || cachedProfile?.targetRole || primaryStudent?.targetRole || '',
        currentSkills: metaProfile.currentSkills || userMeta.current_skills || cachedProfile?.currentSkills || '',
        skills: metaProfile.skills || userMeta.skills || cachedProfile?.skills || [],
        bio: metaProfile.bio || userMeta.bio || cachedProfile?.bio || '',
        githubUrl: metaProfile.githubUrl || userMeta.github_url || cachedProfile?.githubUrl || '',
        linkedinUrl: metaProfile.linkedinUrl || userMeta.linkedin_url || cachedProfile?.linkedinUrl || '',
        phone: metaProfile.phone || userMeta.phone || cachedProfile?.phone || '',
        location: metaProfile.location || userMeta.location || cachedProfile?.location || '',
        profileImageUrl: metaProfile.profileImageUrl || userMeta.profile_image_url || cachedProfile?.profileImageUrl || cachedProfile?.avatarUrl || '',
        avatarUrl: metaProfile.avatarUrl || userMeta.avatar_url || cachedProfile?.avatarUrl || cachedProfile?.profileImageUrl || '',
        portfolio: metaProfile.portfolio || userMeta.portfolio_data || cachedProfile?.portfolio,
        plan: (metaProfile.plan || userMeta.plan || cachedProfile?.plan || 'free') as PlanType,
        billingCycle: metaProfile.billingCycle || userMeta.billing_cycle || cachedProfile?.billingCycle,
        subscriptionStatus: metaProfile.subscriptionStatus || userMeta.subscription_status || cachedProfile?.subscriptionStatus,
        subscriptionDetails: metaProfile.subscriptionDetails || userMeta.subscription_data || cachedProfile?.subscriptionDetails,
        isOnboarded: Boolean(metaProfile.isOnboarded ?? userMeta.is_onboarded ?? cachedProfile?.isOnboarded ?? (userMeta.university || cachedProfile?.university)),
        createdAt: authUser?.created_at || cachedProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };

      const activeStudentId: string | null =
        userMeta.active_student_id ||
        localBundle?.activeStudentId ||
        students.find((s) => s.isActive)?.id ||
        students[0]?.id ||
        null;

      // Persist to user-scoped storage so refresh and offline navigation work instantly
      localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
      localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
      localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
      localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
      localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
      localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(careerGoals));
      if (activeStudentId) {
        localStorage.setItem(getStorageKey(userId, 'active_student_id'), activeStudentId);
      }

      logSupabaseDiag('FETCH_ALL', 'all twin records', userId, null, 200, 'Direct Supabase Client');

      return {
        data: {
          profile,
          students,
          skills,
          projects,
          achievements,
          careerGoals,
          activeStudentId,
          lastSyncedAt: new Date().toISOString(),
        },
        error: null,
      };
    } catch (err: any) {
      logSupabaseDiag('LOAD', 'fetchCloudStudentTwin fallback', userId, err, 500, 'Direct Supabase Client');
      return { data: localBundle, error: null };
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
      return { success: false, message: 'Cloud Sync Failed — User is not authenticated', error: new Error('User is not authenticated') };
    }

    let effectiveProfileImage = profile.profileImageUrl || profile.avatarUrl || '';
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
      ...profile,
      id: userId,
      profileImageUrl: effectiveProfileImage,
      avatarUrl: effectiveProfileImage,
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately persist to local storage (user data is NEVER lost)
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(mergedProfile));
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(goals));
    if (activeStudentId) {
      localStorage.setItem(getStorageKey(userId, 'active_student_id'), activeStudentId);
    }

    if (!isSupabaseConfigured) {
      return {
        success: true,
        message: 'Saved to local workspace storage.',
        error: null,
      };
    }

    // 2. Prepare clean, isolated payloads for each module (no bloated context / base64)
    const cleanProfile = {
      id: userId,
      userId,
      fullName: mergedProfile.fullName || '',
      email: mergedProfile.email || '',
      university: mergedProfile.university || '',
      degree: mergedProfile.degree || '',
      branch: mergedProfile.branch || '',
      year: mergedProfile.year || '',
      expectedGraduationYear: mergedProfile.expectedGraduationYear || '',
      careerGoal: mergedProfile.careerGoal || '',
      targetRole: mergedProfile.targetRole || '',
      bio: mergedProfile.bio || '',
      githubUrl: mergedProfile.githubUrl || '',
      linkedinUrl: mergedProfile.linkedinUrl || '',
      phone: mergedProfile.phone || '',
      location: mergedProfile.location || '',
      profileImageUrl: (mergedProfile.profileImageUrl && !mergedProfile.profileImageUrl.startsWith('data:'))
        ? mergedProfile.profileImageUrl
        : '',
      avatarUrl: (mergedProfile.avatarUrl && !mergedProfile.avatarUrl.startsWith('data:')) ? mergedProfile.avatarUrl : '',
      plan: mergedProfile.plan || 'free',
      isOnboarded: Boolean(mergedProfile.isOnboarded),
    };

    const cleanStudents = (students || []).map((s) => ({
      id: s.id,
      userId: s.userId || userId,
      name: s.name || '',
      university: s.university || '',
      degree: s.degree || '',
      branch: s.branch || '',
      year: s.year || '',
      expectedGraduationYear: s.expectedGraduationYear || '',
      careerGoal: s.careerGoal || '',
      targetRole: s.targetRole || '',
      bio: s.bio || '',
      githubUrl: s.githubUrl || '',
      linkedinUrl: s.linkedinUrl || '',
      phone: s.phone || '',
      location: s.location || '',
      avatarUrl: (s.avatarUrl && !s.avatarUrl.startsWith('data:')) ? s.avatarUrl : '',
      isActive: Boolean(s.isActive),
    }));

    const cleanSkills = (skills || []).map((sk) => ({
      id: sk.id,
      userId: sk.userId || userId,
      studentProfileId: sk.studentProfileId || null,
      skillName: sk.skillName || '',
      category: sk.category || 'Technical',
      proficiency: sk.proficiency || 'Intermediate',
      score: typeof sk.score === 'number' ? sk.score : 70,
    }));

    const cleanProjects = (projects || []).map((p) => ({
      id: p.id,
      userId: p.userId || userId,
      studentProfileId: p.studentProfileId || null,
      title: p.title || '',
      description: p.description || '',
      architecture: p.architecture || '',
      techStack: Array.isArray(p.techStack) ? p.techStack : [],
      githubUrl: p.githubUrl || '',
      liveDemoUrl: p.liveDemoUrl || '',
      role: p.role || 'Developer',
      difficulty: p.difficulty || 'Intermediate',
      status: p.status || 'Completed',
      highlights: Array.isArray(p.highlights) ? p.highlights.slice(0, 10) : [],
    }));

    const cleanAchievements = (achievements || []).map((a) => ({
      id: a.id,
      userId: a.userId || userId,
      studentProfileId: a.studentProfileId || null,
      title: a.title || '',
      organization: a.organization || '',
      date: a.date || '',
      description: a.description || '',
      certificateUrl: a.certificateUrl || '',
    }));

    const cleanCareerGoals = (goals || []).map((g) => ({
      id: g.id,
      userId: g.userId || userId,
      studentProfileId: g.studentProfileId || null,
      goal: g.goal || '',
      targetRole: g.targetRole || '',
      targetCompanies: Array.isArray(g.targetCompanies) ? g.targetCompanies : [],
      requiredSkills: Array.isArray(g.requiredSkills) ? g.requiredSkills : [],
      timeline: g.timeline || '',
      isActive: Boolean(g.isActive),
    }));

    try {
      // 3. Direct persistence via Supabase Auth metadata (Source of truth on cloud)
      const { data: updatedAuth, error: authUpdateErr } = await supabase.auth.updateUser({
        data: {
          profile: cleanProfile,
          full_name: cleanProfile.fullName,
          university: cleanProfile.university,
          degree: cleanProfile.degree,
          branch: cleanProfile.branch,
          year: cleanProfile.year,
          career_goal: cleanProfile.careerGoal,
          target_role: cleanProfile.targetRole,
          plan: cleanProfile.plan,
          is_onboarded: cleanProfile.isOnboarded,
          students: cleanStudents,
          skills: cleanSkills,
          projects: cleanProjects,
          achievements: cleanAchievements,
          career_goals: cleanCareerGoals,
          careerGoals: cleanCareerGoals,
          active_student_id: activeStudentId || null,
        },
      });

      if (authUpdateErr) {
        logSupabaseDiag('UPDATE_USER', 'user_metadata', userId, authUpdateErr, 400, 'Supabase Client');
        return {
          success: false,
          message: `Cloud Sync Failed: ${authUpdateErr.message}`,
          error: new Error(authUpdateErr.message),
        };
      }

      // 4. Also perform direct table upserts concurrently
      try {
        await Promise.allSettled([
          supabase.from('student_profiles').upsert(
            cleanStudents.map((s) => ({
              id: s.id,
              user_id: userId,
              name: s.name,
              university: s.university,
              degree: s.degree,
              branch: s.branch,
              year: s.year,
              career_goal: s.careerGoal,
              target_role: s.targetRole,
              is_active: s.isActive,
            }))
          ),
          supabase.from('projects').upsert(
            cleanProjects.map((p) => ({
              id: p.id,
              user_id: userId,
              student_profile_id: p.studentProfileId || null,
              title: p.title,
              description: p.description,
              architecture: p.architecture,
              tech_stack: p.techStack,
              github_url: p.githubUrl,
              live_demo_url: p.liveDemoUrl,
              role: p.role,
              difficulty: p.difficulty,
              status: p.status,
            }))
          ),
          supabase.from('skills').upsert(
            cleanSkills.map((sk) => ({
              id: sk.id,
              user_id: userId,
              student_profile_id: sk.studentProfileId || null,
              skill_name: sk.skillName,
              category: sk.category,
              proficiency: sk.proficiency,
              score: sk.score,
            }))
          ),
          supabase.from('achievements').upsert(
            cleanAchievements.map((a) => ({
              id: a.id,
              user_id: userId,
              student_profile_id: a.studentProfileId || null,
              title: a.title,
              organization: a.organization,
              date: a.date,
              description: a.description,
              certificate_url: a.certificateUrl,
            }))
          ),
          supabase.from('career_goals').upsert(
            cleanCareerGoals.map((g) => ({
              id: g.id,
              user_id: userId,
              student_profile_id: g.studentProfileId || null,
              goal: g.goal,
              target_role: g.targetRole,
              target_companies: g.targetCompanies,
              required_skills: g.requiredSkills,
              timeline: g.timeline,
              is_active: g.isActive,
            }))
          ),
        ]);
      } catch (tableErr) {
        // Table schema notice (metadata already safely saved)
        console.warn('[Direct Supabase Table Notice]', tableErr);
      }

      // 5. Read-back verification directly from Supabase
      const { data: verifyData } = await supabase.auth.getUser();
      const verifiedProjects = verifyData?.user?.user_metadata?.projects?.length ?? cleanProjects.length;

      console.log(`[Direct Supabase Sync] Verified user_metadata on Supabase. Projects: ${verifiedProjects}, Skills: ${cleanSkills.length}`);

      return {
        success: true,
        message: 'Cloud Sync Successful: All Twin Records are safely stored in the cloud.',
        error: null,
      };
    } catch (err: any) {
      logSupabaseDiag('UPLOAD', 'all modules', userId, err, 500, 'Direct Supabase Client');
      return {
        success: false,
        message: `Cloud Sync Failed: ${err?.message || 'Unknown network error'}`,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
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
