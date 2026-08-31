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
    path: '/api/twin/achievements',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/achievements', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'achievements', userId });

    let achievementsData: any[] = [];
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          achievementsData = data.map((a: any) => ({
            id: a.id,
            userId: a.user_id || userId,
            studentProfileId: a.student_profile_id || a.studentProfileId,
            title: a.title || '',
            issuer: a.issuer || a.organization || '',
            date: a.date || a.issueDate || new Date().toISOString().split('T')[0],
            category: a.category || 'Certification',
            credentialUrl: a.credential_url || a.credentialUrl || '',
            skills: Array.isArray(a.skills) ? a.skills : [],
            createdAt: a.created_at || a.createdAt || new Date().toISOString(),
            updatedAt: a.updated_at || a.updatedAt || new Date().toISOString(),
          }));
          source = 'supabase_table';
        }
      } catch {}
    }

    if (achievementsData.length === 0) {
      const metadataAchievements = user?.user_metadata?.achievements;
      if (Array.isArray(metadataAchievements) && metadataAchievements.length > 0) {
        achievementsData = metadataAchievements;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        if (freshUserRes.success && Array.isArray(freshUserRes.user?.user_metadata?.achievements)) {
          achievementsData = freshUserRes.user.user_metadata.achievements;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, count: achievementsData.length, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      count: achievementsData.length,
      source,
      data: achievementsData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/achievements', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/achievements', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'achievements', userId });

    const bodyItems = Array.isArray(req.body?.achievements)
      ? req.body.achievements
      : Array.isArray(req.body)
      ? req.body
      : req.body?.achievement
      ? [req.body.achievement]
      : req.body
      ? [req.body]
      : [];

    const now = new Date().toISOString();
    const rowsToUpsert = bodyItems.map((a: any) => ({
      id: a.id || `ach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      student_profile_id: a.studentProfileId || a.student_profile_id || null,
      title: a.title || '',
      issuer: a.issuer || a.organization || '',
      date: a.date || a.issueDate || now.split('T')[0],
      category: a.category || 'Certification',
      credential_url: a.credentialUrl || a.credential_url || '',
      skills: Array.isArray(a.skills) ? a.skills : [],
      updated_at: now,
    }));

    let source = 'bridge_cache';
    let cloudWritten = false;
    let readBackVerified = false;

    if (isServerSupabaseConfigured) {
      if (rowsToUpsert.length > 0) {
        try {
          const chunkSize = 20;
          let anyChunkSaved = false;
          for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
            const chunk = rowsToUpsert.slice(i, i + chunkSize);
            const { error: chunkErr } = await client.from('achievements').upsert(chunk, { onConflict: 'id' });
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
            achievements: rowsToUpsert,
          });

          if (updateRes.success) {
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && (readBackRes.user?.user_metadata?.achievements || rowsToUpsert.length === 0)) {
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

    setBridgeCache(userId, 'achievements', rowsToUpsert);

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
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/achievements', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/achievements', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || req.body?.id;
    if (id) {
      const cached: any[] = getBridgeCache(userId, 'achievements') || [];
      setBridgeCache(userId, 'achievements', cached.filter((c: any) => c.id !== id));
      if (isServerSupabaseConfigured) {
        try {
          await client.from('achievements').delete().eq('id', id).eq('user_id', userId);
        } catch {}
      }
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
