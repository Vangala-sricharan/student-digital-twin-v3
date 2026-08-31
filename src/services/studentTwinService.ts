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

// Measure byte size of JSON payloads safely
export const measurePayloadBytes = (payload: any): number => {
  try {
    if (!payload) return 0;
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return new TextEncoder().encode(str).length;
  } catch {
    return 0;
  }
};

// Safe diagnostic logger for API operations (Never logs tokens, keys, passwords or sensitive data)
export const logTwinApiDiag = (
  operation: 'Cloud Sync' | 'Cloud Load' | 'Cloud Delete' | 'Cloud Upsert',
  method: string,
  moduleName: string,
  payloadBytes: number,
  recordCount: number,
  status: number,
  result: 'SUCCESS' | 'FAILED',
  reason?: string | null
) => {
  const lines = [
    `[${operation}]`,
    `${method} /api/twin?module=${moduleName}`,
    `Payload: ${payloadBytes} bytes | Records: ${recordCount}`,
    `Status: ${status}`,
    `Result: ${result}`,
    reason ? `Reason: ${reason}` : null,
  ].filter(Boolean);

  if (result === 'SUCCESS') {
    console.log(lines.join('\n'));
  } else {
    console.warn(lines.join('\n'));
  }
};

/**
 * Get active Supabase JWT Bearer token for serverless authentication
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? String(token).trim() : null;
  } catch {
    return null;
  }
}

/**
 * Centralized authenticated dispatcher for /api/twin serverless endpoints
 * Browser ➔ Vercel /api/twin?module=... ➔ Supabase ➔ PostgreSQL
 */
async function callTwinApi<T = any>(
  moduleName: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: Error | null; success: boolean; count?: number; status?: number }> {
  const method = options.method || 'GET';
  const query = new URLSearchParams();
  query.set('module', moduleName);

  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, v);
      }
    });
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authHeaderVal = token ? `Bearer ${token}` : '';
  if (token) {
    headers['Authorization'] = authHeaderVal;
  }

  // Safe header diagnostics (Never logs actual token or cookie values)
  const tokenBytes = token ? new TextEncoder().encode(token).length : 0;
  const authHeaderBytes = authHeaderVal ? new TextEncoder().encode(`Authorization: ${authHeaderVal}`).length : 0;
  const rawCookie = typeof document !== 'undefined' ? document.cookie : '';
  const cookieBytes = rawCookie ? new TextEncoder().encode(rawCookie).length : 0;
  const customHeaderBytes = Object.entries(headers).reduce(
    (acc, [k, v]) => acc + new TextEncoder().encode(`${k}: ${v}`).length,
    0
  );

  console.log('[TWIN AUTH REQUEST]', {
    tokenPresent: Boolean(token),
    tokenBytes,
    authorizationHeaderBytes: authHeaderBytes,
    cookieHeaderPresent: Boolean(rawCookie),
    cookieHeaderBytes: cookieBytes,
    totalCustomHeaderBytes: customHeaderBytes,
  });

  const hasBody = method === 'POST' || method === 'PUT' || (method === 'DELETE' && options.body);
  const payloadStr = hasBody && options.body !== undefined ? JSON.stringify(options.body) : undefined;
  const payloadBytes = payloadStr ? new TextEncoder().encode(payloadStr).length : 0;

  const count = Array.isArray(options.body)
    ? options.body.length
    : options.body && typeof options.body === 'object'
    ? Object.keys(options.body).length
    : 0;

  const url = `/api/twin?${query.toString()}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: payloadStr,
      credentials: 'omit',
    });

    const status = response.status;
    let json: any = null;

    try {
      const text = await response.text();
      if (text) {
        json = JSON.parse(text);
      }
    } catch {}

    if (!response.ok) {
      const errMsg = json?.error || json?.message || `HTTP ${status}: ${response.statusText}`;
      logTwinApiDiag('Cloud Upsert', method, moduleName, payloadBytes, count, status, 'FAILED', errMsg);
      return {
        data: null,
        error: new Error(errMsg),
        success: false,
        status,
      };
    }

    const success = json?.success !== undefined ? Boolean(json.success) : true;
    const responseCount = json?.count !== undefined ? json.count : count;

    logTwinApiDiag(
      method === 'GET' ? 'Cloud Load' : method === 'DELETE' ? 'Cloud Delete' : 'Cloud Upsert',
      method,
      moduleName,
      payloadBytes,
      responseCount,
      status,
      success ? 'SUCCESS' : 'FAILED',
      json?.error || null
    );

    return {
      data: json?.data !== undefined ? json.data : json,
      error: null,
      success,
      count: responseCount,
      status,
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Network fetch failed';
    logTwinApiDiag('Cloud Upsert', method, moduleName, payloadBytes, count, 500, 'FAILED', errMsg);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(errMsg),
      success: false,
      status: 500,
    };
  }
}

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

  // Helper to strip heavy base64 strings from payloads
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
          } catch {}
          return null;
        };

        if (cachedWorkingBucket) {
          const url = await uploadToBucket(cachedWorkingBucket);
          if (url) return { url, error: null };
          cachedWorkingBucket = null;
        }

        const bucketsToTry = ['avatars', 'profiles', 'user-avatars', 'public'];
        for (const b of bucketsToTry) {
          const url = await uploadToBucket(b);
          if (url) {
            cachedWorkingBucket = b;
            return { url, error: null };
          }
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

    try {
      const { data, error } = await callTwinApi<UserProfile>('profile', {
        method: 'GET',
        params: { userId },
      });

      if (!error && data) {
        const profile: UserProfile = {
          id: userId,
          email: data.email || cachedProfile?.email || '',
          fullName: data.fullName || (data as any).full_name || cachedProfile?.fullName || 'Student User',
          university: data.university || cachedProfile?.university || '',
          degree: data.degree || cachedProfile?.degree || 'B.Tech',
          branch: data.branch || cachedProfile?.branch || '',
          program: data.program || cachedProfile?.program || '',
          year: data.year || cachedProfile?.year || '1st Year',
          expectedGraduationYear: data.expectedGraduationYear || (data as any).expected_graduation_year || cachedProfile?.expectedGraduationYear || '',
          careerGoal: data.careerGoal || (data as any).career_goal || cachedProfile?.careerGoal || '',
          targetRole: data.targetRole || (data as any).target_role || cachedProfile?.targetRole || '',
          currentSkills: data.currentSkills || (data as any).current_skills || cachedProfile?.currentSkills || '',
          skills: data.skills || cachedProfile?.skills || [],
          bio: data.bio || cachedProfile?.bio || '',
          githubUrl: data.githubUrl || (data as any).github_url || cachedProfile?.githubUrl || '',
          linkedinUrl: data.linkedinUrl || (data as any).linkedin_url || cachedProfile?.linkedinUrl || '',
          phone: data.phone || cachedProfile?.phone || '',
          location: data.location || cachedProfile?.location || '',
          profileImageUrl: data.profileImageUrl || (data as any).profile_image_url || data.avatarUrl || cachedProfile?.profileImageUrl || '',
          avatarUrl: data.avatarUrl || data.profileImageUrl || cachedProfile?.avatarUrl || '',
          portfolio: data.portfolio || cachedProfile?.portfolio,
          plan: (data.plan || cachedProfile?.plan || 'free') as PlanType,
          billingCycle: data.billingCycle || (data as any).billing_cycle || cachedProfile?.billingCycle,
          subscriptionStatus: data.subscriptionStatus || (data as any).subscription_status || cachedProfile?.subscriptionStatus,
          subscriptionDetails: data.subscriptionDetails || (data as any).subscription_data || cachedProfile?.subscriptionDetails,
          isOnboarded: data.isOnboarded !== undefined ? Boolean(data.isOnboarded) : Boolean(cachedProfile?.isOnboarded),
          createdAt: data.createdAt || (data as any).created_at || cachedProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDemo: false,
        };

        localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(profile));
        return { data: profile, error: null };
      }
    } catch {}

    if (cachedProfile) {
      return { data: cachedProfile, error: null };
    }

    return { data: null, error: null };
  },

  async upsertUserProfile(
    userId: string,
    profile: Partial<UserProfile> & { email: string; fullName: string }
  ): Promise<{ data: UserProfile | null; error: Error | null }> {
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

    // Always persist to local cache immediately
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(formattedProfile));

    // Call /api/twin?module=profile
    try {
      const { data, error } = await callTwinApi('profile', {
        method: 'POST',
        body: { profile: formattedProfile, userId },
      });

      if (error) {
        return { data: formattedProfile, error: null }; // Keep local state intact
      }

      return { data: formattedProfile, error: null };
    } catch {
      return { data: formattedProfile, error: null };
    }
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
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        const updatedProfile: UserProfile = {
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

    try {
      await callTwinApi('item', {
        method: 'POST',
        body: {
          table: 'subscriptions',
          id: subscription.id || `sub_${userId}`,
          data: {
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
          },
        },
      });
    } catch {}

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
    const localList: StudentProfile[] = cached ? JSON.parse(cached) : [];

    try {
      const { data, error } = await callTwinApi<StudentProfile[]>('students', {
        method: 'GET',
        params: { userId },
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(data));
        return { data, error: null };
      }
    } catch {}

    return { data: localList, error: null };
  },

  async createStudentProfile(
    userId: string,
    profile: Omit<StudentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: StudentProfile | null; error: Error | null }> {
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

    try {
      await callTwinApi('students', {
        method: 'POST',
        body: { students: list, student: newProfile, userId },
      });
    } catch {}

    return { data: newProfile, error: null };
  },

  async updateStudentProfile(
    userId: string,
    id: string,
    updates: Partial<StudentProfile>
  ): Promise<{ data: StudentProfile | null; error: Error | null }> {
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

    if (updatedItem) {
      try {
        await callTwinApi('students', {
          method: 'POST',
          body: { students: list, student: updatedItem, userId },
        });
      } catch {}
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

    try {
      await callTwinApi('students', {
        method: 'DELETE',
        params: { id, userId },
        body: { id },
      });
    } catch {}

    return { success: true, error: null };
  },

  // ==========================================
  // 3. SKILLS
  // ==========================================
  async fetchSkills(userId: string, studentProfileId?: string): Promise<{ data: SkillItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'skills'));
    const localList: SkillItem[] = cached ? JSON.parse(cached) : [];

    try {
      const { data, error } = await callTwinApi<SkillItem[]>('skills', {
        method: 'GET',
        params: { userId },
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(data));
        const filtered = studentProfileId ? data.filter((s) => !s.studentProfileId || s.studentProfileId === studentProfileId) : data;
        return { data: filtered, error: null };
      }
    } catch {}

    const filteredLocal = studentProfileId ? localList.filter((s) => !s.studentProfileId || s.studentProfileId === studentProfileId) : localList;
    return { data: filteredLocal, error: null };
  },

  async addSkill(
    userId: string,
    skill: Omit<SkillItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: SkillItem | null; error: Error | null }> {
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

    try {
      await callTwinApi('skills', {
        method: 'POST',
        body: { skills: list, skill: newSkill, userId },
      });
    } catch {}

    return { data: newSkill, error: null };
  },

  async updateSkill(
    userId: string,
    id: string,
    updates: Partial<SkillItem>
  ): Promise<{ data: SkillItem | null; error: Error | null }> {
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

    if (updatedItem) {
      try {
        await callTwinApi('skills', {
          method: 'POST',
          body: { skills: list, skill: updatedItem, userId },
        });
      } catch {}
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

    try {
      await callTwinApi('skills', {
        method: 'DELETE',
        params: { id, userId },
        body: { id },
      });
    } catch {}

    return { success: true, error: null };
  },

  // ==========================================
  // 4. PROJECTS
  // ==========================================
  async fetchProjects(userId: string, studentProfileId?: string): Promise<{ data: ProjectItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'projects'));
    const localList: ProjectItem[] = cached ? JSON.parse(cached) : [];

    try {
      const { data, error } = await callTwinApi<ProjectItem[]>('projects', {
        method: 'GET',
        params: { userId },
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(data));
        const filtered = studentProfileId ? data.filter((p) => !p.studentProfileId || p.studentProfileId === studentProfileId) : data;
        return { data: filtered, error: null };
      }
    } catch {}

    const filteredLocal = studentProfileId ? localList.filter((p) => !p.studentProfileId || p.studentProfileId === studentProfileId) : localList;
    return { data: filteredLocal, error: null };
  },

  async addProject(
    userId: string,
    project: Omit<ProjectItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: ProjectItem | null; error: Error | null }> {
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

    try {
      await callTwinApi('projects', {
        method: 'POST',
        body: { projects: list, project: newProject, userId },
      });
    } catch {}

    return { data: newProject, error: null };
  },

  async updateProject(
    userId: string,
    id: string,
    updates: Partial<ProjectItem>
  ): Promise<{ data: ProjectItem | null; error: Error | null }> {
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

    if (updatedItem) {
      try {
        await callTwinApi('projects', {
          method: 'POST',
          body: { projects: list, project: updatedItem, userId },
        });
      } catch {}
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

    try {
      await callTwinApi('projects', {
        method: 'DELETE',
        params: { id, userId },
        body: { id },
      });
    } catch {}

    return { success: true, error: null };
  },

  // ==========================================
  // 5. ACHIEVEMENTS
  // ==========================================
  async fetchAchievements(userId: string, studentProfileId?: string): Promise<{ data: AchievementItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'achievements'));
    const localList: AchievementItem[] = cached ? JSON.parse(cached) : [];

    try {
      const { data, error } = await callTwinApi<AchievementItem[]>('achievements', {
        method: 'GET',
        params: { userId },
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(data));
        const filtered = studentProfileId ? data.filter((a) => !a.studentProfileId || a.studentProfileId === studentProfileId) : data;
        return { data: filtered, error: null };
      }
    } catch {}

    const filteredLocal = studentProfileId ? localList.filter((a) => !a.studentProfileId || a.studentProfileId === studentProfileId) : localList;
    return { data: filteredLocal, error: null };
  },

  async addAchievement(
    userId: string,
    achievement: Omit<AchievementItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: AchievementItem | null; error: Error | null }> {
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

    try {
      await callTwinApi('achievements', {
        method: 'POST',
        body: { achievements: list, achievement: newAchievement, userId },
      });
    } catch {}

    return { data: newAchievement, error: null };
  },

  async updateAchievement(
    userId: string,
    id: string,
    updates: Partial<AchievementItem>
  ): Promise<{ data: AchievementItem | null; error: Error | null }> {
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

    if (updatedItem) {
      try {
        await callTwinApi('achievements', {
          method: 'POST',
          body: { achievements: list, achievement: updatedItem, userId },
        });
      } catch {}
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

    try {
      await callTwinApi('achievements', {
        method: 'DELETE',
        params: { id, userId },
        body: { id },
      });
    } catch {}

    return { success: true, error: null };
  },

  // ==========================================
  // 6. CAREER GOALS
  // ==========================================
  async fetchCareerGoals(userId: string, studentProfileId?: string): Promise<{ data: CareerGoalItem[]; error: Error | null }> {
    if (!userId) return { data: [], error: new Error('User ID is required') };

    const cached = localStorage.getItem(getStorageKey(userId, 'career_goals'));
    const localList: CareerGoalItem[] = cached ? JSON.parse(cached) : [];

    try {
      const { data, error } = await callTwinApi<CareerGoalItem[]>('career-goals', {
        method: 'GET',
        params: { userId },
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(data));
        const filtered = studentProfileId ? data.filter((g) => !g.studentProfileId || g.studentProfileId === studentProfileId) : data;
        return { data: filtered, error: null };
      }
    } catch {}

    const filteredLocal = studentProfileId ? localList.filter((g) => !g.studentProfileId || g.studentProfileId === studentProfileId) : localList;
    return { data: filteredLocal, error: null };
  },

  async addCareerGoal(
    userId: string,
    goal: Omit<CareerGoalItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: CareerGoalItem | null; error: Error | null }> {
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

    try {
      await callTwinApi('career-goals', {
        method: 'POST',
        body: { careerGoals: list, careerGoal: newGoal, userId },
      });
    } catch {}

    return { data: newGoal, error: null };
  },

  async updateCareerGoal(
    userId: string,
    id: string,
    updates: Partial<CareerGoalItem>
  ): Promise<{ data: CareerGoalItem | null; error: Error | null }> {
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

    if (updatedItem) {
      try {
        await callTwinApi('career-goals', {
          method: 'POST',
          body: { careerGoals: list, careerGoal: updatedItem, userId },
        });
      } catch {}
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

    try {
      await callTwinApi('career-goals', {
        method: 'DELETE',
        params: { id, userId },
        body: { id },
      });
    } catch {}

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

    try {
      // Call serverless /api/twin?module=load to fetch from Supabase tables
      const { data: cloudData, error: loadErr } = await callTwinApi<any>('load', {
        method: 'GET',
        params: { userId },
      });

      if (!loadErr && cloudData) {
        const mergeEntities = <T extends { id: string }>(cloudItems: any[] = [], localItems?: T[] | null): T[] => {
          const map = new Map<string, T>();
          if (Array.isArray(localItems)) {
            for (const item of localItems) {
              if (item && item.id) map.set(item.id, item);
            }
          }
          if (Array.isArray(cloudItems) && cloudItems.length > 0) {
            for (const item of cloudItems) {
              if (item && item.id) {
                const mapped: any = {
                  ...item,
                  userId: item.user_id || item.userId || userId,
                  studentProfileId: item.student_profile_id || item.studentProfileId,
                  skillName: item.skill_name || item.skillName || item.name,
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

        const students = mergeEntities<StudentProfile>(cloudData.students, localBundle?.students);
        const skills = mergeEntities<SkillItem>(cloudData.skills, localBundle?.skills);
        const projects = mergeEntities<ProjectItem>(cloudData.projects, localBundle?.projects);
        const achievements = mergeEntities<AchievementItem>(cloudData.achievements, localBundle?.achievements);
        const careerGoals = mergeEntities<CareerGoalItem>(cloudData.careerGoals, localBundle?.careerGoals);

        const cloudProfile = cloudData.profile || {};
        const cachedProfile = localBundle?.profile;
        const primaryStudent = students.find((s) => s.id === `sp_${userId}_primary` || s.isActive) || students[0];

        const profile: UserProfile = {
          id: userId,
          email: cloudProfile.email || cachedProfile?.email || '',
          fullName: cloudProfile.fullName || cloudProfile.full_name || cachedProfile?.fullName || primaryStudent?.name || 'Student User',
          university: cloudProfile.university || cachedProfile?.university || primaryStudent?.university || '',
          degree: cloudProfile.degree || cachedProfile?.degree || primaryStudent?.degree || 'B.Tech',
          branch: cloudProfile.branch || cachedProfile?.branch || primaryStudent?.branch || '',
          program: cloudProfile.program || cachedProfile?.program || (primaryStudent?.degree && primaryStudent?.branch ? `${primaryStudent.degree} in ${primaryStudent.branch}` : ''),
          year: cloudProfile.year || cachedProfile?.year || primaryStudent?.year || '1st Year',
          expectedGraduationYear: cloudProfile.expectedGraduationYear || cloudProfile.expected_graduation_year || cachedProfile?.expectedGraduationYear || '',
          careerGoal: cloudProfile.careerGoal || cloudProfile.career_goal || cachedProfile?.careerGoal || primaryStudent?.careerGoal || '',
          targetRole: cloudProfile.targetRole || cloudProfile.target_role || cachedProfile?.targetRole || primaryStudent?.targetRole || '',
          currentSkills: cloudProfile.currentSkills || cloudProfile.current_skills || cachedProfile?.currentSkills || '',
          skills: cloudProfile.skills || cachedProfile?.skills || [],
          bio: cloudProfile.bio || cachedProfile?.bio || '',
          githubUrl: cloudProfile.githubUrl || cloudProfile.github_url || cachedProfile?.githubUrl || '',
          linkedinUrl: cloudProfile.linkedinUrl || cloudProfile.linkedin_url || cachedProfile?.linkedinUrl || '',
          phone: cloudProfile.phone || cachedProfile?.phone || '',
          location: cloudProfile.location || cachedProfile?.location || '',
          profileImageUrl: cloudProfile.profileImageUrl || cloudProfile.profile_image_url || cloudProfile.avatarUrl || cachedProfile?.profileImageUrl || '',
          avatarUrl: cloudProfile.avatarUrl || cloudProfile.profileImageUrl || cachedProfile?.avatarUrl || '',
          portfolio: cloudProfile.portfolio || cachedProfile?.portfolio,
          plan: (cloudProfile.plan || cachedProfile?.plan || 'free') as PlanType,
          billingCycle: cloudProfile.billingCycle || cloudProfile.billing_cycle || cachedProfile?.billingCycle,
          subscriptionStatus: cloudProfile.subscriptionStatus || cloudProfile.subscription_status || cachedProfile?.subscriptionStatus,
          subscriptionDetails: cloudProfile.subscriptionDetails || cloudProfile.subscription_data || cachedProfile?.subscriptionDetails,
          isOnboarded: Boolean(cloudProfile.isOnboarded ?? cloudProfile.is_onboarded ?? cachedProfile?.isOnboarded ?? (cloudProfile.university || cachedProfile?.university)),
          createdAt: cloudProfile.createdAt || cloudProfile.created_at || cachedProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDemo: false,
        };

        const activeStudentId: string | null =
          cloudData.activeStudentId ||
          localBundle?.activeStudentId ||
          students.find((s) => s.isActive)?.id ||
          students[0]?.id ||
          null;

        // Persist to user-scoped local storage for instant responsiveness & offline navigation
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
            lastSyncedAt: new Date().toISOString(),
          },
          error: null,
        };
      }
    } catch {}

    return { data: localBundle, error: null };
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
      } catch {}
    }

    const mergedProfile: UserProfile = {
      ...profile,
      id: userId,
      profileImageUrl: effectiveProfileImage,
      avatarUrl: effectiveProfileImage,
      updatedAt: new Date().toISOString(),
    };

    // 1. Immediately persist to local storage (user edits are NEVER lost)
    localStorage.setItem(getStorageKey(userId, 'profile'), JSON.stringify(mergedProfile));
    localStorage.setItem(getStorageKey(userId, 'students'), JSON.stringify(students));
    localStorage.setItem(getStorageKey(userId, 'skills'), JSON.stringify(skills));
    localStorage.setItem(getStorageKey(userId, 'projects'), JSON.stringify(projects));
    localStorage.setItem(getStorageKey(userId, 'achievements'), JSON.stringify(achievements));
    localStorage.setItem(getStorageKey(userId, 'career_goals'), JSON.stringify(goals));
    if (activeStudentId) {
      localStorage.setItem(getStorageKey(userId, 'active_student_id'), activeStudentId);
    }

    // 2. Prepare clean payloads for each module (no bloated context / base64)
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

    // 3. Execute modular synchronization via /api/twin?module=sync
    try {
      const { data, error, success } = await callTwinApi('sync', {
        method: 'POST',
        body: {
          userId,
          profile: cleanProfile,
          students: cleanStudents,
          skills: cleanSkills,
          projects: cleanProjects,
          achievements: cleanAchievements,
          careerGoals: cleanCareerGoals,
          activeStudentId: activeStudentId || null,
        },
      });

      if (error) {
        return {
          success: false,
          message: `Cloud Sync Notice: ${error.message || 'Failed to sync'}`,
          error,
        };
      }

      return {
        success: success ?? true,
        message: 'Cloud Sync Successful: All Twin Records are safely stored in the cloud.',
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Cloud Sync Failed: ${err?.message || 'Network exception'}`,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  },

  // Clear temporary local state for this user session upon logout (Cloud data remains in Supabase)
  clearUserCache(userId: string) {
    if (!userId) return;
    const suffixes = ['profile', 'students', 'skills', 'projects', 'achievements', 'career_goals', 'active_student_id', 'subscription'];
    suffixes.forEach((suffix) => {
      localStorage.removeItem(getStorageKey(userId, suffix));
    });
  },
};
