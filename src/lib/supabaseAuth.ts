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

export const auth = supabase.auth;

export function normalizeUser(user: any): AppUser | null {
  if (!user) return null;
  const uid = user.id || user.uid || '';
  const email = user.email || '';
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.displayName ||
    (email ? email.split('@')[0] : 'A Midnight Dreamer');
  const photoURL =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.photoURL ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const emailVerified = !!(user.email_confirmed_at || user.emailVerified);

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
  _auth: typeof supabase.auth,
  callback: (user: AppUser | null) => void
) => {
  let active = true;

  supabase.auth.getSession().then(({ data }) => {
    if (active) {
      callback(data.session?.user ? normalizeUser(data.session.user) : null);
    }
  });

  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    if (active) {
      callback(session?.user ? normalizeUser(session.user) : null);
    }
  });

  return () => {
    active = false;
    subscription.subscription.unsubscribe();
  };
};

export const signOut = async (_auth?: typeof supabase.auth) => {
  return supabase.auth.signOut();
};

export const createUserWithEmailAndPassword = async (
  _auth: typeof supabase.auth,
  email: string,
  password: string
): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Account creation did not return a user.');
  return { user: normalizeUser(data.user)! };
};

export const signInWithEmailAndPassword = async (
  _auth: typeof supabase.auth,
  email: string,
  password: string
): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Sign-in did not return a user.');
  return { user: normalizeUser(data.user)! };
};

export const getGoogleOAuthUrl = async (): Promise<string> => {
  const redirectUrl = window.location.origin + window.location.pathname;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Google authentication service did not return an authorization URL.');
  return data.url;
};

export const handleOAuthCallbackInPopup = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isPopup = window.opener && window.opener !== window;
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  const hasTokens =
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    search.includes('code=');

  if (isPopup && hasTokens) {
    document.title = 'Nightgram — Connecting Google Account...';
    try {
      document.body.innerHTML = `
        <div style="background:#07070c;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;">
          <div style="width:40px;height:40px;border:3px solid rgba(6,182,212,0.3);border-top-color:#06b6d4;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:16px;"></div>
          <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#22d3ee;letter-spacing:0.02em;">Google Sign-In Connected</h2>
          <p style="margin:0;color:#94a3b8;font-size:13px;">Returning to Nightgram...</p>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>
      `;
    } catch {}

    const notifyOpener = (session: any) => {
      try {
        window.opener.postMessage(
          {
            type: 'NIGHTGRAM_AUTH_SUCCESS',
            session,
          },
          '*'
        );
      } catch (e) {
        console.warn('postMessage to opener notice:', e);
      }
      setTimeout(() => {
        try {
          window.close();
        } catch {}
      }, 400);
    };

    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      notifyOpener({ access_token, refresh_token });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          notifyOpener(data.session);
        } else {
          setTimeout(() => {
            try { window.close(); } catch {}
          }, 1000);
        }
      });
    }

    return true;
  }

  return false;
};

export const signInWithPopup = async (): Promise<{ user: AppUser | null; data?: any }> => {
  // Check if session already exists
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    return { user: normalizeUser(sessionData.session.user), data: sessionData };
  }

  const authUrl = await getGoogleOAuthUrl();

  // Open in centered popup window
  const width = 520;
  const height = 650;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  let popup: Window | null = null;
  try {
    popup = window.open(
      authUrl,
      'nightgram-google-auth',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
  } catch (openErr) {
    console.warn('Popup window.open failed:', openErr);
  }

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    const popupErr: any = new Error('Google Sign-In popup was blocked by browser frame constraints.');
    popupErr.code = 'auth/popup-blocked';
    popupErr.authUrl = authUrl;
    throw popupErr;
  }

  return new Promise((resolve, reject) => {
    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      window.removeEventListener('message', handleMessage);
      try {
        if (popup && !popup.closed) popup.close();
      } catch {}
    };

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'NIGHTGRAM_AUTH_SUCCESS' && event.data?.session) {
        cleanup();
        const session = event.data.session;
        try {
          if (session.access_token && session.refresh_token) {
            const { data: setRes, error } = await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
            if (!error && setRes?.user) {
              resolve({ user: normalizeUser(setRes.user), data: setRes });
              return;
            }
          }
        } catch (e) {
          console.warn('setSession notice:', e);
        }
        resolve({ user: normalizeUser(session.user), data: session });
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setInterval(async () => {
      try {
        const { data: currentSession } = await supabase.auth.getSession();
        if (currentSession?.session?.user) {
          cleanup();
          resolve({ user: normalizeUser(currentSession.session.user), data: currentSession });
          return;
        }

        if (popup?.closed) {
          setTimeout(async () => {
            if (finished) return;
            const { data: finalSession } = await supabase.auth.getSession();
            if (finalSession?.session?.user) {
              cleanup();
              resolve({ user: normalizeUser(finalSession.session.user), data: finalSession });
            } else {
              cleanup();
              const cancelErr: any = new Error('Sign-in popup was closed before completing.');
              cancelErr.code = 'auth/popup-closed-by-user';
              cancelErr.authUrl = authUrl;
              reject(cancelErr);
            }
          }, 700);
        }
      } catch {
        // Cross-origin checks during OAuth redirection
      }
    }, 600);

    setTimeout(() => {
      if (!finished) {
        cleanup();
        const timeoutErr: any = new Error('Sign-in attempt timed out.');
        timeoutErr.code = 'auth/popup-timeout';
        timeoutErr.authUrl = authUrl;
        reject(timeoutErr);
      }
    }, 180000);
  });
};

export const signInWithRedirect = async (): Promise<void> => {
  const redirectUrl = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) throw error;
};

export const signInWithGoogleIdToken = async (idToken: string): Promise<{ user: AppUser }> => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  if (!data?.user) throw new Error('Google token verification failed.');
  return { user: normalizeUser(data.user)! };
};

export const getRedirectResult = async (): Promise<{ user: AppUser } | null> => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ? { user: normalizeUser(data.session.user)! } : null;
};
