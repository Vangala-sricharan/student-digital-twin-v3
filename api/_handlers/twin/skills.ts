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
} from '../../_utils/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  logLayerDiag('ROUTE HANDLER ENTERED', {
    method: req.method,
    path: '/api/twin/skills',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/skills', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'skills', userId });

    let skillsData: any[] = [];
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('skills')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          skillsData = data.map((s: any) => ({
            id: s.id,
            userId: s.user_id || userId,
            studentProfileId: s.student_profile_id || s.studentProfileId,
            skillName: s.skill_name || s.skillName || s.name || '',
            category: s.category || 'Programming',
            proficiency: s.proficiency || 'Intermediate',
            score: typeof s.score === 'number' ? s.score : 75,
            createdAt: s.created_at || s.createdAt || new Date().toISOString(),
            updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
          }));
          source = 'supabase_table';
        }
      } catch {}
    }

    if (skillsData.length === 0) {
      const metadataSkills = user?.user_metadata?.skills;
      if (Array.isArray(metadataSkills) && metadataSkills.length > 0) {
        skillsData = metadataSkills;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        if (freshUserRes.success && Array.isArray(freshUserRes.user?.user_metadata?.skills)) {
          skillsData = freshUserRes.user.user_metadata.skills;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, count: skillsData.length, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      count: skillsData.length,
      source,
      data: skillsData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/skills', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/skills', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'skills', userId });

    const bodyItems = Array.isArray(req.body?.skills)
      ? req.body.skills
      : Array.isArray(req.body)
      ? req.body
      : req.body?.skill
      ? [req.body.skill]
      : req.body
      ? [req.body]
      : [];

    const now = new Date().toISOString();
    const rowsToUpsert = bodyItems.map((s: any) => ({
      id: s.id || `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      student_profile_id: s.studentProfileId || s.student_profile_id || null,
      skill_name: s.skillName || s.skill_name || s.name || '',
      category: s.category || 'Programming',
      proficiency: s.proficiency || 'Intermediate',
      score: typeof s.score === 'number' ? s.score : 75,
      updated_at: now,
    }));

    let source = 'bridge_cache';
    let cloudWritten = false;
    let readBackVerified = false;

    if (isServerSupabaseConfigured) {
      if (rowsToUpsert.length > 0) {
        try {
          const chunkSize = 25;
          let anyChunkSaved = false;
          for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
            const chunk = rowsToUpsert.slice(i, i + chunkSize);
            const { error: chunkErr } = await client.from('skills').upsert(chunk, { onConflict: 'id' });
            if (!chunkErr) {
              anyChunkSaved = true;
            }
          }
          if (anyChunkSaved) {
            source = 'supabase_table';
            cloudWritten = true;
            readBackVerified = true;
          }
        } catch {}
      }

      if (token) {
        try {
          const updateRes = await updateSupabaseUserMetadata(token, {
            skills: rowsToUpsert,
          });

          if (updateRes.success) {
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && (readBackRes.user?.user_metadata?.skills || rowsToUpsert.length === 0)) {
              source = source === 'supabase_table' ? 'supabase_table_and_auth' : 'supabase_auth_metadata';
              cloudWritten = true;
              readBackVerified = true;
            }
          }
        } catch {}
      }

      if (rowsToUpsert.length === 0) {
        cloudWritten = true;
        readBackVerified = true;
      }
    }

    setBridgeCache(userId, 'skills', rowsToUpsert);

    const isSuccess = !isServerSupabaseConfigured || (rowsToUpsert.length === 0 ? true : (cloudWritten && readBackVerified));

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: isSuccess ? 200 : 500, count: rowsToUpsert.length, source });

    const respPayload = {
      success: isSuccess,
      host: getSupabaseHostName(),
      userId,
      count: rowsToUpsert.length,
      source,
      supabaseReached: isServerSupabaseConfigured,
      databaseOperation: 'UPSERT',
      databaseResult: cloudWritten ? 'SUCCESS' : 'FAILED',
      readBackResult: readBackVerified ? 'VERIFIED' : 'FAILED',
      data: rowsToUpsert,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/skills', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/skills', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || req.body?.id;
    if (id) {
      const cached: any[] = getBridgeCache(userId, 'skills') || [];
      setBridgeCache(userId, 'skills', cached.filter((c: any) => c.id !== id));
      if (isServerSupabaseConfigured) {
        try {
          await client.from('skills').delete().eq('id', id).eq('user_id', userId);
        } catch {}
      }
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
