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
    path: '/api/twin/students',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/students', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'student_profiles', userId });

    let studentsData: any[] = [];
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          studentsData = data.map((st: any) => ({
            id: st.id,
            userId: st.user_id || userId,
            name: st.name || '',
            university: st.university || '',
            degree: st.degree || 'B.Tech',
            branch: st.branch || '',
            year: st.year || '1st Year',
            careerGoal: st.career_goal || st.careerGoal || '',
            targetRole: st.target_role || st.targetRole || '',
            profileData: st.profile_data || st.profileData,
            isActive: Boolean(st.is_active ?? st.isActive ?? false),
            createdAt: st.created_at || st.createdAt || new Date().toISOString(),
            updatedAt: st.updated_at || st.updatedAt || new Date().toISOString(),
          }));
          source = 'supabase_table';
        }
      } catch {}
    }

    if (studentsData.length === 0) {
      const metadataStudents = user?.user_metadata?.students;
      if (Array.isArray(metadataStudents) && metadataStudents.length > 0) {
        studentsData = metadataStudents;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        if (freshUserRes.success && Array.isArray(freshUserRes.user?.user_metadata?.students)) {
          studentsData = freshUserRes.user.user_metadata.students;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, count: studentsData.length, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      count: studentsData.length,
      source,
      data: studentsData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/students', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/students', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'student_profiles', userId });

    const bodyItems = Array.isArray(req.body?.students)
      ? req.body.students
      : Array.isArray(req.body)
      ? req.body
      : req.body?.student
      ? [req.body.student]
      : req.body
      ? [req.body]
      : [];

    const now = new Date().toISOString();
    const rowsToUpsert = bodyItems.map((s: any) => ({
      id: s.id || `sp_${userId}_${Date.now()}`,
      user_id: userId,
      name: s.name || '',
      university: s.university || '',
      degree: s.degree || 'B.Tech',
      branch: s.branch || '',
      year: s.year || '1st Year',
      career_goal: s.careerGoal || s.career_goal || '',
      target_role: s.targetRole || s.target_role || '',
      profile_data: s.profileData || s.profile_data || null,
      is_active: Boolean(s.isActive ?? s.is_active),
      updated_at: now,
    }));

    let source = 'bridge_cache';
    let cloudWritten = false;
    let readBackVerified = false;

    if (isServerSupabaseConfigured) {
      if (rowsToUpsert.length > 0) {
        try {
          const { data: saved, error } = await client
            .from('student_profiles')
            .upsert(rowsToUpsert, { onConflict: 'id' })
            .select();

          if (!error && saved) {
            source = 'supabase_table';
            cloudWritten = true;
            readBackVerified = true;
          }
        } catch {}
      }

      if (token) {
        try {
          const updateRes = await updateSupabaseUserMetadata(token, {
            students: rowsToUpsert,
            student_twins: rowsToUpsert,
          });

          if (updateRes.success) {
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && (readBackRes.user?.user_metadata?.students || rowsToUpsert.length === 0)) {
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

    setBridgeCache(userId, 'students', rowsToUpsert);

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
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/students', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/students', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || req.body?.id;
    if (id) {
      const cached: any[] = getBridgeCache(userId, 'students') || [];
      setBridgeCache(userId, 'students', cached.filter((c: any) => c.id !== id));
      if (isServerSupabaseConfigured) {
        try {
          await client.from('student_profiles').delete().eq('id', id).eq('user_id', userId);
        } catch {}
      }
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
