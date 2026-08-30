import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side environment variable resolution
const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return String(process.env[key]).trim();
    }
  } catch {}
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseKey.includes('placeholder') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

export const getSupabaseHostName = (): string => {
  try {
    if (supabaseUrl) {
      return new URL(supabaseUrl).host;
    }
  } catch {}
  return 'supabase-host';
};

// In-memory bridge cache for fast fallback caching per user
const _bridgeMemoryCache = new Map<string, Record<string, any>>();

export function getBridgeCache(userId: string, key?: string) {
  const userStore = _bridgeMemoryCache.get(userId) || {};
  return key ? userStore[key] : userStore;
}

export function setBridgeCache(userId: string, key: string, data: any) {
  const userStore = _bridgeMemoryCache.get(userId) || {};
  userStore[key] = data;
  _bridgeMemoryCache.set(userId, userStore);
}

// Singleton server client for verified queries
let _supabaseServerClient: SupabaseClient | null = null;

export async function getSupabaseAuthedClient(userAccessToken?: string, refreshToken?: string): Promise<SupabaseClient> {
  if (!isServerSupabaseConfigured) {
    return createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key');
  }

  if (userAccessToken) {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      },
    });

    try {
      await client.auth.setSession({
        access_token: userAccessToken,
        refresh_token: refreshToken || '',
      });
    } catch {}

    return client;
  }

  if (!_supabaseServerClient) {
    _supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseServerClient;
}

export function getSupabaseServerClient(userAccessToken?: string): SupabaseClient {
  if (!isServerSupabaseConfigured) {
    return createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key');
  }

  // If user token is provided, create client scoped to user authorization
  if (userAccessToken) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      },
    });
  }

  if (!_supabaseServerClient) {
    _supabaseServerClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return _supabaseServerClient;
}

export async function updateSupabaseUserMetadata(
  token: string,
  metadata: Record<string, any>
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!isServerSupabaseConfigured || !token) {
    return { success: false, error: 'Supabase is not configured or token is missing' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: metadata }),
    });

    const data: any = await response.json();
    if (response.ok && data?.id) {
      return { success: true, user: data };
    }
    return { success: false, error: data?.msg || data?.message || `HTTP ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error updating user metadata' };
  }
}

export async function getSupabaseUserFromToken(
  token: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!isServerSupabaseConfigured || !token) {
    return { success: false, error: 'Supabase is not configured or token is missing' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
    });

    const data: any = await response.json();
    if (response.ok && data?.id) {
      return { success: true, user: data };
    }
    return { success: false, error: data?.msg || data?.message || `HTTP ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching user from token' };
  }
}

// Safe network and layer diagnostic logger (never logs secrets/tokens)
export function logLayerDiag(step: string, data: Record<string, any>) {
  const host = getSupabaseHostName();
  const pairs = Object.entries(data)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' | ');
  console.log(`[${step}] Host: ${host} | ${pairs}`);
}

export function logServerSupabaseDiag(
  operation: string,
  target: string,
  userId: string,
  status: number | string,
  error?: any
) {
  const host = getSupabaseHostName();
  const errorMsg = error ? (error.message || error.code || String(error)) : null;
  const isErr = Boolean(error);
  const logLine = `[Supabase Bridge] Host: ${host} | User: ${userId || 'anonymous'} | Op: ${operation} | Target: ${target} | Status: ${status} | Error: ${errorMsg || 'None'} | Via: Server/API`;

  if (isErr) {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }
}

// Authenticate request and extract user context
export async function authenticateRequest(req: VercelRequest): Promise<{
  authenticated: boolean;
  userId: string | null;
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  error: string | null;
}> {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token: string | null = null;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.body && typeof req.body.accessToken === 'string') {
      token = req.body.accessToken.trim();
    }

    const refreshToken =
      (typeof req.headers['x-refresh-token'] === 'string' ? req.headers['x-refresh-token'] : null) ||
      (req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : null);

    if (!token) {
      return {
        authenticated: false,
        userId: null,
        user: null,
        token: null,
        refreshToken: null,
        error: 'Missing authorization token in request header',
      };
    }

    if (!isServerSupabaseConfigured) {
      return {
        authenticated: false,
        userId: null,
        user: null,
        token,
        refreshToken,
        error: 'Supabase server configuration missing',
      };
    }

    // Authoritatively verify token with Supabase Auth
    const client = getSupabaseServerClient();
    const { data: userData, error: userError } = await client.auth.getUser(token);

    if (userError || !userData?.user?.id) {
      return {
        authenticated: false,
        userId: null,
        user: null,
        token: null,
        refreshToken: null,
        error: userError?.message || 'Invalid or expired authorization token',
      };
    }

    return {
      authenticated: true,
      userId: userData.user.id,
      user: userData.user,
      token,
      refreshToken,
      error: null,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      userId: null,
      user: null,
      token: null,
      refreshToken: null,
      error: err?.message || 'Authentication error',
    };
  }
}
