import {
  auth as firebaseAuth,
  createUserWithEmailAndPassword as fbCreateUser,
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  signInWithRedirect as fbSignInWithRedirect,
  getRedirectResult as fbGetRedirectResult,
} from './firebase';
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

export const auth = firebaseAuth;

export function normalizeUser(user: any): AppUser | null {
  if (!user) return null;
  const uid = user.uid || user.id || '';
  const email = user.email || '';
  const displayName =
    user.displayName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (email ? email.split('@')[0] : 'A Midnight Dreamer');
  const photoURL =
    user.photoURL ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const emailVerified = !!(user.emailVerified || user.email_confirmed_at);

  return {
    ...user,
    id: uid,
    uid,
    email,
    displayName,
    photoURL,
    emailVerified,
  };
}

export const onAuthStateChanged = (
  _auth: any,
  callback: (user: AppUser | null) => void
) => {
  return fbOnAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (firebaseUser) {
      callback(normalizeUser(firebaseUser));
    } else {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          callback(data.session?.user ? normalizeUser(data.session.user) : null);
        })
        .catch(() => {
          callback(null);
        });
    }
  });
};

export const signOut = async (_auth?: any) => {
  try {
    await fbSignOut(firebaseAuth);
  } catch {}
  try {
    await supabase.auth.signOut();
  } catch {}
};

export const createUserWithEmailAndPassword = async (
  _auth: any,
  email: string,
  pass: string
): Promise<{ user: AppUser }> => {
  try {
    const res = await fbCreateUser(firebaseAuth, email, pass);
    return { user: normalizeUser(res.user)! };
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      const signInRes = await fbSignIn(firebaseAuth, email, pass);
      return { user: normalizeUser(signInRes.user)! };
    }
    throw err;
  }
};

export const signInWithEmailAndPassword = async (
  _auth: any,
  email: string,
  pass: string
): Promise<{ user: AppUser }> => {
  try {
    const res = await fbSignIn(firebaseAuth, email, pass);
    return { user: normalizeUser(res.user)! };
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const createRes = await fbCreateUser(firebaseAuth, email, pass);
        return { user: normalizeUser(createRes.user)! };
      } catch {}
    }
    throw err;
  }
};

export const signInWithPopup = async (): Promise<{ user: AppUser | null; data?: any }> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await fbSignInWithPopup(firebaseAuth, provider);
    return { user: normalizeUser(res.user), data: res };
  } catch (err: any) {
    console.warn('Firebase popup signin notice, falling back:', err);
    throw err;
  }
};

export const signInWithRedirect = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await fbSignInWithRedirect(firebaseAuth, provider);
};

export const getRedirectResult = async (): Promise<{ user: AppUser | null } | null> => {
  const res = await fbGetRedirectResult(firebaseAuth);
  return res && res.user ? { user: normalizeUser(res.user) } : null;
};

export const handleOAuthCallbackInPopup = (): boolean => {
  return false;
};
