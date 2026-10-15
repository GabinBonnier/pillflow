import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Nettoie l'URL au cas où l'utilisateur a copié avec /rest/v1/ ou slash final
const cleanSupabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '')
  .trim();

export const isSupabaseConfigured = () => {
  return (
    typeof cleanSupabaseUrl === 'string' &&
    cleanSupabaseUrl !== '' &&
    !cleanSupabaseUrl.includes('ton-projet') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseAnonKey.includes('ton_cle')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(cleanSupabaseUrl, supabaseAnonKey)
  : null;

export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (isSupabaseConfigured() && serviceKey && !serviceKey.includes('ton_cle')) {
    return createClient(cleanSupabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return null;
};

