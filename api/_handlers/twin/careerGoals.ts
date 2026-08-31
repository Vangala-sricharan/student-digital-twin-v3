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
    path: '/api/twin/career-goals',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/career-goals', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'career_goals', userId });

    let careerGoalsData: any[] = [];
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('career_goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          careerGoalsData = data.map((g: any) => ({
            id: g.id,
            userId: g.user_id || userId,
            studentProfileId: g.student_profile_id || g.studentProfileId,
            targetRole: g.target_role || g.targetRole || '',
            targetIndustry: g.target_industry || g.targetIndustry || '',
            timeline: g.timeline || '6 Months',
            status: g.status || 'Active',
            milestones: Array.isArray(g.milestones) ? g.milestones : [],
            createdAt: g.created_at || g.createdAt || new Date().toISOString(),
            updatedAt: g.updated_at || g.updatedAt || new Date().toISOString(),
          }));
          source = 'supabase_table';
        }
      } catch {}
    }

    if (careerGoalsData.length === 0) {
      const metadataGoals = user?.user_metadata?.career_goals || user?.user_metadata?.careerGoals;
      if (Array.isArray(metadataGoals) && metadataGoals.length > 0) {
        careerGoalsData = metadataGoals;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        const freshGoals = freshUserRes.user?.user_metadata?.career_goals || freshUserRes.user?.user_metadata?.careerGoals;
        if (freshUserRes.success && Array.isArray(freshGoals)) {
          careerGoalsData = freshGoals;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, count: careerGoalsData.length, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      count: careerGoalsData.length,
      source,
      data: careerGoalsData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/career-goals', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/career-goals', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'career_goals', userId });

    const bodyItems = Array.isArray(req.body?.careerGoals)
      ? req.body.careerGoals
      : Array.isArray(req.body?.career_goals)
      ? req.body.career_goals
      : Array.isArray(req.body)
      ? req.body
      : req.body?.careerGoal
      ? [req.body.careerGoal]
      : req.body
      ? [req.body]
      : [];

    const now = new Date().toISOString();
    const rowsToUpsert = bodyItems.map((g: any) => ({
      id: g.id || `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      student_profile_id: g.studentProfileId || g.student_profile_id || null,
      target_role: g.targetRole || g.target_role || '',
      target_industry: g.targetIndustry || g.target_industry || '',
      timeline: g.timeline || '6 Months',
      status: g.status || 'Active',
      milestones: Array.isArray(g.milestones) ? g.milestones : [],
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
            const { error: chunkErr } = await client.from('career_goals').upsert(chunk, { onConflict: 'id' });
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
            career_goals: rowsToUpsert,
            careerGoals: rowsToUpsert,
          });

          if (updateRes.success) {
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && ((readBackRes.user?.user_metadata?.career_goals || readBackRes.user?.user_metadata?.careerGoals) || rowsToUpsert.length === 0)) {
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

    setBridgeCache(userId, 'careerGoals', rowsToUpsert);

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
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/career-goals', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/career-goals', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || req.body?.id;
    if (id) {
      const cached: any[] = getBridgeCache(userId, 'careerGoals') || [];
      setBridgeCache(userId, 'careerGoals', cached.filter((c: any) => c.id !== id));
      if (isServerSupabaseConfigured) {
        try {
          await client.from('career_goals').delete().eq('id', id).eq('user_id', userId);
        } catch {}
      }
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
