import { supabase } from './supabase';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  [key: string]: any;
}

export type User = AppUser;

// Compatibility handle for existing callers. Authentication is now handled
// entirely by Supabase Auth; Firebase is no longer used.
export const auth = supabase.auth;

export function normalizeUser(user: any): AppUser | null {
  if (!user) return null;
  const uid = user.id || user.uid || '';
  const email = user.email || '';
  const metadata = user.user_metadata || {};
  const displayName =
    user.displayName ||
    metadata.displayName ||
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'A Midnight Dreamer');
  const photoURL =
    user.photoURL ||
    metadata.avatar_url ||
    metadata.picture ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return {
    ...user,
    id: uid,
    uid,
    email,
    displayName,
    photoURL,
    emailVerified: !!user.email_confirmed_at,
  };
}

export const onAuthStateChanged = (
  _auth: any,
  callback: (user: AppUser | null) => void
) => {
  let active = true;

  supabase.auth.getSession().then(({ data }) => {
    if (active) callback(normalizeUser(data.session?.user));
  }).catch(() => {
    if (active) callback(null);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (active) callback(normalizeUser(session?.user));
  });

  return () => {
    active = false;
    listener.subscription.unsubscribe();
  };
};

export const signOut = async (_auth?: any) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const createUserWithEmailAndPassword = async (
  _auth: any,
  email: string,
  pass: string
): Promise<{ user: AppUser }> => {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass,
    options: {
      data: {
        displayName: cleanEmail.split('@')[0],
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Supabase could not create the account.');
  if (!data.session) {
    throw new Error('Account created. Please confirm your email, then sign in again.');
  }
  return { user: normalizeUser(data.user)! };
};

export const signInWithEmailAndPassword = async (
  _auth: any,
  email: string,
  pass: string
): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: pass,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Could not sign in.');
  return { user: normalizeUser(data.user)! };
};

// Supabase OAuth redirects through the current Nightgram origin.
export const signInWithPopup = async (): Promise<{ user: AppUser | null }> => {
  const redirectTo = window.location.hostname.endsWith('github.io')
    ? `${window.location.origin}/Nightgram/`
    : `${window.location.origin}/`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
  return { user: null };
};

export const signInWithRedirect = async (): Promise<void> => {
  const redirectTo = window.location.hostname.endsWith('github.io')
    ? `${window.location.origin}/Nightgram/`
    : `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
};

export const getRedirectResult = async (): Promise<{ user: AppUser | null } | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ? { user: normalizeUser(data.session.user) } : null;
};

export const handleOAuthCallbackInPopup = (): boolean => false;
