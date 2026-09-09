import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://difccvkjzsrdszywarqb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_tc2FOXTXEZ_h1Q6ilV6tFw_cAhNPbeU';

function resolveSupabaseUrl(): string {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  if (!envUrl) return DEFAULT_SUPABASE_URL;

  // If user accidentally put an API key (e.g. sb_secret_..., sb_publishable_..., or jwt) into VITE_SUPABASE_URL
  if (
    envUrl.startsWith('sb_') ||
    envUrl.startsWith('eyJ') ||
    (!envUrl.includes('.') && envUrl.length > 25)
  ) {
    console.warn(
      'VITE_SUPABASE_URL contains an API key instead of a URL. Using default project URL:',
      DEFAULT_SUPABASE_URL
    );
    return DEFAULT_SUPABASE_URL;
  }

  // If user provided a domain without protocol (e.g. difccvkjzsrdszywarqb.supabase.co)
  if (envUrl.includes('.supabase.co') && !/^https?:\/\//i.test(envUrl)) {
    return `https://${envUrl}`;
  }

  // If user provided just the 20-character project ref (e.g. difccvkjzsrdszywarqb)
  if (/^[a-z0-9]{20}$/i.test(envUrl)) {
    return `https://${envUrl}.supabase.co`;
  }

  // Validate that it is a valid HTTP or HTTPS URL
  try {
    const parsed = new URL(envUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return envUrl;
    }
  } catch {}

  console.warn('Invalid VITE_SUPABASE_URL format:', envUrl, 'Falling back to default project URL.');
  return DEFAULT_SUPABASE_URL;
}

function resolveSupabaseKey(): string {
  const envKey = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // If user accidentally placed a key in VITE_SUPABASE_URL, we can preserve it if no other key is provided
  const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  if (!envKey && (rawUrl.startsWith('sb_') || rawUrl.startsWith('eyJ'))) {
    return rawUrl;
  }

  if (envKey) return envKey;
  return DEFAULT_SUPABASE_KEY;
}

export const SUPABASE_URL = resolveSupabaseUrl();
export const SUPABASE_KEY = resolveSupabaseKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
