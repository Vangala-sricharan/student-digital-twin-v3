import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('your-anon-key') &&
  !supabaseAnonKey.includes('placeholder') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

// Create real Supabase client if configured, or fallback client
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

