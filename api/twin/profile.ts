import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAuthedClient,
  authenticateRequest,
  updateSupabaseUserMetadata,
  getSupabaseUserFromToken,
  logLayerDiag,
  isServerSupabaseConfigured,
  getSupabaseHostName,
  getBridgeCache,
  setBridgeCache,
} from '../_utils/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  logLayerDiag('ROUTE HANDLER ENTERED', {
    method: req.method,
    path: '/api/twin/profile',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/profile', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'user_profiles', userId });

    let profileData: any = null;
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data: profileRow, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && profileRow) {
          profileData = profileRow;
          source = 'supabase_table';
          logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, source: 'user_profiles_table' });
        }
      } catch {}
    }

    if (!profileData) {
      // Check Auth user_metadata
      const metadataProfile = user?.user_metadata?.profile;
      if (metadataProfile) {
        profileData = metadataProfile;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        if (freshUserRes.success && freshUserRes.user?.user_metadata?.profile) {
          profileData = freshUserRes.user.user_metadata.profile;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      source,
      data: profileData || null,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/profile', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/profile', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'user_profiles', userId });

    const profile = req.body?.profile || req.body || {};
    const now = new Date().toISOString();

    const userProfilePayload = {
      id: userId,
      user_id: userId,
      full_name: profile.fullName || profile.full_name || '',
      email: profile.email || user?.email || '',
      university: profile.university || '',
      degree: profile.degree || '',
      branch: profile.branch || '',
      year: profile.year || '',
      career_goal: profile.careerGoal || profile.career_goal || '',
      target_role: profile.targetRole || profile.target_role || '',
      bio: profile.bio || '',
      github_url: profile.githubUrl || profile.github_url || '',
      linkedin_url: profile.linkedinUrl || profile.linkedin_url || '',
      phone: profile.phone || '',
      location: profile.location || '',
      profile_image_url: profile.profileImageUrl || profile.avatarUrl || profile.profile_image_url || '',
      plan: profile.plan || 'free',
      is_onboarded: Boolean(profile.isOnboarded ?? profile.is_onboarded),
      updated_at: now,
    };

    let savedData = userProfilePayload;
    let cloudWritten = false;
    let readBackVerified = false;
    let source = 'bridge_cache';

    if (isServerSupabaseConfigured) {
      try {
        const { data: saved, error } = await client
          .from('user_profiles')
          .upsert(userProfilePayload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!error && saved) {
          savedData = saved;
          source = 'supabase_table';
          cloudWritten = true;
          readBackVerified = true;
        }
      } catch {}

      if (token) {
        try {
          const updateRes = await updateSupabaseUserMetadata(token, {
            profile: userProfilePayload,
            full_name: userProfilePayload.full_name,
            university: userProfilePayload.university,
            degree: userProfilePayload.degree,
            branch: userProfilePayload.branch,
            year: userProfilePayload.year,
            career_goal: userProfilePayload.career_goal,
            target_role: userProfilePayload.target_role,
            plan: userProfilePayload.plan,
            is_onboarded: userProfilePayload.is_onboarded,
          });

          if (updateRes.success) {
            // Authoritative fresh read-back from Supabase
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && readBackRes.user?.user_metadata?.profile) {
              source = source === 'supabase_table' ? 'supabase_table_and_auth' : 'supabase_auth_metadata';
              cloudWritten = true;
              readBackVerified = true;
            }
          }
        } catch {}
      }
    }

    setBridgeCache(userId, 'profile', userProfilePayload);

    const isSuccess = !isServerSupabaseConfigured || (cloudWritten && readBackVerified);

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: isSuccess ? 200 : 500, source });
    const respPayload = {
      success: isSuccess,
      host: getSupabaseHostName(),
      userId,
      source,
      supabaseReached: isServerSupabaseConfigured,
      databaseOperation: 'UPSERT',
      databaseResult: cloudWritten ? 'SUCCESS' : 'FAILED',
      readBackResult: readBackVerified ? 'VERIFIED' : 'FAILED',
      data: savedData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/profile', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/profile', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
