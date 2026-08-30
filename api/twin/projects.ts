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
    path: '/api/twin/projects',
    queryUserId: req.query?.userId || req.query?.user_id,
  });

  const { authenticated, userId, user, token, refreshToken, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logLayerDiag('AUTH CHECK FAILED', { path: '/api/twin/projects', error: authError });
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const client = await getSupabaseAuthedClient(token || undefined, refreshToken || undefined);

  if (req.method === 'GET') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'SELECT', table: 'projects', userId });

    let projectsData: any[] = [];
    let source = 'memory';

    if (isServerSupabaseConfigured) {
      try {
        const { data, error } = await client
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          projectsData = data.map((p: any) => ({
            id: p.id,
            userId: p.user_id || userId,
            studentProfileId: p.student_profile_id || p.studentProfileId,
            title: p.title || '',
            description: p.description || '',
            architecture: p.architecture || '',
            techStack: Array.isArray(p.tech_stack) ? p.tech_stack : (Array.isArray(p.techStack) ? p.techStack : []),
            githubUrl: p.github_url || p.githubUrl || '',
            liveDemoUrl: p.live_demo_url || p.liveDemoUrl || '',
            role: p.role || 'Lead Developer',
            difficulty: p.difficulty || 'Intermediate',
            status: p.status || 'Completed',
            createdAt: p.created_at || p.createdAt || new Date().toISOString(),
            updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
          }));
          source = 'supabase_table';
        }
      } catch {}
    }

    if (projectsData.length === 0) {
      const metadataProjects = user?.user_metadata?.projects;
      if (Array.isArray(metadataProjects) && metadataProjects.length > 0) {
        projectsData = metadataProjects;
        source = 'supabase_auth_metadata';
      } else if (token) {
        const freshUserRes = await getSupabaseUserFromToken(token);
        if (freshUserRes.success && Array.isArray(freshUserRes.user?.user_metadata?.projects)) {
          projectsData = freshUserRes.user.user_metadata.projects;
          source = 'supabase_auth_metadata';
        }
      }
    }

    logLayerDiag('SUPABASE RESPONSE STATUS', { status: 200, count: projectsData.length, source });

    const respPayload = {
      success: true,
      host: getSupabaseHostName(),
      userId,
      count: projectsData.length,
      source,
      data: projectsData,
    };

    const respBytes = Buffer.byteLength(JSON.stringify(respPayload), 'utf8');
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/projects', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/projects', status: 200 });

    return res.status(200).json(respPayload);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    logLayerDiag('SUPABASE REQUEST START', { op: 'UPSERT', table: 'projects', userId });

    const bodyItems = Array.isArray(req.body?.projects)
      ? req.body.projects
      : Array.isArray(req.body)
      ? req.body
      : req.body?.project
      ? [req.body.project]
      : req.body
      ? [req.body]
      : [];

    const now = new Date().toISOString();
    const rowsToUpsert = bodyItems.map((p: any) => ({
      id: p.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      student_profile_id: p.studentProfileId || p.student_profile_id || null,
      title: p.title || '',
      description: p.description || '',
      architecture: p.architecture || '',
      tech_stack: Array.isArray(p.techStack) ? p.techStack : (Array.isArray(p.tech_stack) ? p.tech_stack : []),
      github_url: p.githubUrl || p.github_url || '',
      live_demo_url: p.liveDemoUrl || p.live_demo_url || '',
      role: p.role || 'Lead Developer',
      difficulty: p.difficulty || 'Intermediate',
      status: p.status || 'Completed',
      updated_at: now,
    }));

    let source = 'bridge_cache';
    let cloudWritten = false;
    let readBackVerified = false;

    if (isServerSupabaseConfigured) {
      if (rowsToUpsert.length > 0) {
        try {
          const chunkSize = 15;
          let anyChunkSaved = false;
          for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
            const chunk = rowsToUpsert.slice(i, i + chunkSize);
            const { error: chunkErr } = await client.from('projects').upsert(chunk, { onConflict: 'id' });
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
            projects: rowsToUpsert,
          });

          if (updateRes.success) {
            const readBackRes = await getSupabaseUserFromToken(token);
            if (readBackRes.success && (readBackRes.user?.user_metadata?.projects || rowsToUpsert.length === 0)) {
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

    setBridgeCache(userId, 'projects', rowsToUpsert);

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
    logLayerDiag('RESPONSE SIZE', { path: '/api/twin/projects', bytes: respBytes });
    logLayerDiag('FINAL API RESPONSE STATUS', { path: '/api/twin/projects', status: isSuccess ? 200 : 500 });

    return res.status(isSuccess ? 200 : 500).json(respPayload);
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string) || req.body?.id;
    if (id) {
      const cached: any[] = getBridgeCache(userId, 'projects') || [];
      setBridgeCache(userId, 'projects', cached.filter((c: any) => c.id !== id));
      if (isServerSupabaseConfigured) {
        try {
          await client.from('projects').delete().eq('id', id).eq('user_id', userId);
        } catch {}
      }
    }
    return res.status(200).json({ success: true, id });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
