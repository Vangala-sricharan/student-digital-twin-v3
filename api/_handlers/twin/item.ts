import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseServerClient,
  authenticateRequest,
  logServerSupabaseDiag,
  isServerSupabaseConfigured,
  getSupabaseHostName,
  updateSupabaseUserMetadata,
  getBridgeCache,
  setBridgeCache,
} from '../../_utils/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { authenticated, userId, token, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized',
    });
  }

  const { table, action, id, data } = req.body || {};

  const allowedTables = ['projects', 'skills', 'student_profiles', 'achievements', 'career_goals', 'user_profiles', 'subscriptions'];
  if (!table || !allowedTables.includes(table)) {
    return res.status(400).json({ success: false, error: `Invalid table name. Allowed: ${allowedTables.join(', ')}` });
  }

  if (!isServerSupabaseConfigured) {
    return res.status(200).json({
      success: true,
      configured: false,
      message: 'Supabase is not configured on server.',
    });
  }

  const client = getSupabaseServerClient(token || undefined);

  try {
    if (req.method === 'DELETE' || action === 'delete') {
      const targetId = id || req.body?.id;
      if (!targetId) {
        return res.status(400).json({ success: false, error: 'Entity ID is required for delete' });
      }

      // 1. Delete from database table
      try {
        const { error, status } = await client.from(table).delete().eq('id', targetId).eq('user_id', userId);
        if (error) {
          logServerSupabaseDiag('DELETE', `${table} (id: ${targetId})`, userId, status || 400, error);
        } else {
          logServerSupabaseDiag('DELETE', `${table} (id: ${targetId})`, userId, 200);
        }
      } catch {}

      // 2. Update bridge cache
      const cachedList: any[] = getBridgeCache(userId, table) || [];
      const updatedList = cachedList.filter((item: any) => item.id !== targetId);
      setBridgeCache(userId, table, updatedList);

      // 3. Update auth metadata
      if (token) {
        try {
          await updateSupabaseUserMetadata(token, { [table]: updatedList });
        } catch {}
      }

      return res.status(200).json({ success: true, id: targetId });
    }

    // Upsert or Insert
    const rowPayload = {
      ...(data || {}),
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      rowPayload.id = id;
    }

    let savedResult = rowPayload;
    let dbSuccess = false;

    try {
      const { data: result, error, status } = await client.from(table).upsert(rowPayload, { onConflict: 'id' }).select().maybeSingle();
      if (error) {
        logServerSupabaseDiag('UPSERT', `${table}`, userId, status || 400, error);
      } else {
        logServerSupabaseDiag('UPSERT', `${table}`, userId, 200);
        if (result) savedResult = result;
        dbSuccess = true;
      }
    } catch {}

    // Update bridge cache
    const cachedList: any[] = getBridgeCache(userId, table) || [];
    const index = cachedList.findIndex((item: any) => item.id === rowPayload.id);
    if (index >= 0) {
      cachedList[index] = { ...cachedList[index], ...rowPayload };
    } else {
      cachedList.unshift(rowPayload);
    }
    setBridgeCache(userId, table, cachedList);

    // Sync to user_metadata
    if (token) {
      try {
        await updateSupabaseUserMetadata(token, { [table]: cachedList });
      } catch {}
    }

    return res.status(200).json({ success: true, data: savedResult, host: getSupabaseHostName() });
  } catch (err: any) {
    logServerSupabaseDiag('ITEM_EXCEPTION', `${table}`, userId, 500, err);
    return res.status(500).json({ success: false, error: err?.message || 'Database operation failed' });
  }
}
