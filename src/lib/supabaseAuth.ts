import { supabase } from './supabase';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  [key: string]: any;
}

export type User = AppUser;
export const auth = supabase.auth;

export function normalizeUser(user: any): AppUser | null {
  if (!user) return null;
  const uid = user.id || user.uid || '';
  const email = user.email || '';
  const metadata = user.user_metadata || {};
  const displayName = user.displayName || metadata.displayName || metadata.full_name || metadata.name || (email ? email.split('@')[0] : user.phone ? user.phone : 'A Midnight Dreamer');
  const photoURL = user.photoURL || metadata.avatar_url || metadata.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  return { ...user, id: uid, uid, email, phone: user.phone || metadata.phone || '', displayName, photoURL, emailVerified: !!user.email_confirmed_at };
}

const restoreVerifiedSessionMarker = (user: AppUser | null) => {
  if (!user?.uid || typeof window === 'undefined') return;
  const key = `nightgram_2fa_${user.uid}`;
  if (localStorage.getItem(key) === 'true') sessionStorage.setItem(key, 'true');
};

export const onAuthStateChanged = (_auth: any, callback: (user: AppUser | null) => void) => {
  let active = true;
  supabase.auth.getSession().then(({ data }) => {
    if (active) {
      const user = normalizeUser(data.session?.user);
      restoreVerifiedSessionMarker(user);
      callback(user);
    }
  }).catch(() => { if (active) callback(null); });
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (active) {
      const user = normalizeUser(session?.user);
      restoreVerifiedSessionMarker(user);
      callback(user);
    }
  });
  return () => { active = false; listener.subscription.unsubscribe(); };
};

export const signOut = async (_auth?: any) => {
  const { error } = await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach((key) => { if (key.startsWith('nightgram_2fa_')) localStorage.removeItem(key); });
    Object.keys(sessionStorage).forEach((key) => { if (key.startsWith('nightgram_2fa_')) sessionStorage.removeItem(key); });
  }
  if (error) throw error;
};

export const createUserWithEmailAndPassword = async (_auth: any, email: string, pass: string): Promise<{ user: AppUser }> => {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: pass, options: { data: { displayName: cleanEmail.split('@')[0] } } });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase could not create the account.');
  if (!data.session) throw new Error('Account created. Please confirm your email, then sign in again.');
  return { user: normalizeUser(data.user)! };
};

export const signInWithEmailAndPassword = async (_auth: any, email: string, pass: string): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
  if (error) throw error;
  if (!data.user) throw new Error('Could not sign in.');
  return { user: normalizeUser(data.user)! };
};

export const sendPhoneOtp = async (phone: string) => {
  const cleanPhone = phone.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) throw new Error('Enter the mobile number in international format, for example +2567XXXXXXXX.');
  const { error } = await supabase.auth.signInWithOtp({ phone: cleanPhone, options: { shouldCreateUser: true } });
  if (error) throw error;
};

export const verifyPhoneOtp = async (phone: string, token: string): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: token.trim(), type: 'sms' });
  if (error) throw error;
  if (!data.user) throw new Error('Phone verification succeeded but no account was returned.');
  return { user: normalizeUser(data.user)! };
};

export const updatePhoneNumber = async (phone: string) => {
  const cleanPhone = phone.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) throw new Error('Enter the mobile number in international format.');
  const { data, error } = await supabase.auth.updateUser({ phone: cleanPhone });
  if (error) throw error;
  return normalizeUser(data.user);
};

export const signInWithPopup = async (): Promise<{ user: AppUser | null }> => {
  const redirectTo = window.location.hostname.endsWith('github.io') ? `${window.location.origin}/Nightgram/` : `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
  return { user: null };
};

export const signInWithRedirect = async (): Promise<void> => {
  const redirectTo = window.location.hostname.endsWith('github.io') ? `${window.location.origin}/Nightgram/` : `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) throw error;
  if (data?.url) window.location.assign(data.url);
};

export const getRedirectResult = async (): Promise<{ user: AppUser | null } | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ? { user: normalizeUser(data.session.user) } : null;
};

export const handleOAuthCallbackInPopup = (): boolean => false;
