import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sparkles, LogIn, UserPlus, Info, Check, ExternalLink, Camera, Upload } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const PRESET_AVATARS = [
  { name: 'Starry', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Neon', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cosmic', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { name: 'Nocturnal', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Wanderer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Solitary', url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=150&auto=format&fit=crop&q=80' },
];

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Chasing midnight dreams and quiet frequencies. 🌌☕');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatar, setCustomAvatar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [showSignUpSuggest, setShowSignUpSuggest] = useState(false);

  const authFileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedAvatar(dataUrl);
          setCustomAvatar('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const finalAvatar = customAvatar.trim() || selectedAvatar;

  const handleUserDocCheck = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      onAuthSuccess(userSnap.data());
    } else {
      const baseUsername = user.email?.split('@')[0] || 'dreamer';
      const cleanUsername = baseUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000);
      
      const usernameRef = doc(db, 'usernames', cleanUsername);
      await setDoc(usernameRef, { uid: user.uid });

      const profileData = {
        uid: user.uid,
        email: user.email || '',
        username: cleanUsername,
        displayName: user.displayName || 'A Midnight Dreamer',
        avatar: user.photoURL || PRESET_AVATARS[0].url,
        bio: 'Chasing midnight dreams and quiet frequencies. 🌌☕',
        followers: Math.floor(Math.random() * 20) + 5,
        following: 12,
        stars: 1,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, profileData);
      onAuthSuccess(profileData);
    }
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          handleUserDocCheck(result.user);
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err);
      });
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setPopupBlocked(false);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await handleUserDocCheck(userCredential.user);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
        setPopupBlocked(true);
        setError('Google Sign-In popup was blocked by browser security in this preview frame. Please log in using Email & Password below, or open the app in a new tab.');
        if (window.self === window.top) {
          try {
            await signInWithRedirect(auth, provider);
          } catch (redirectErr: any) {
            console.error('Redirect auth error:', redirectErr);
          }
        }
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else {
        setError(message || 'An error occurred during Google sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowSignUpSuggest(false);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (isSignUp && !cleanUsername) {
      setError('Please provide a valid alphanumeric username (underscores allowed)');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        // 1. Check if username is already taken
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          setError(`The username @${cleanUsername} is already tuned to another dreamer.`);
          setLoading(false);
          return;
        }

        // 2. Create the Auth record
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // 3. Save profile metadata to Firestore
        const profileData = {
          uid: user.uid,
          email: cleanEmail,
          username: cleanUsername,
          displayName: displayName.trim() || 'Anonymous Dreamer',
          avatar: finalAvatar,
          bio: bio.trim(),
          followers: Math.floor(Math.random() * 20) + 5, // give some initial followers for life!
          following: 12,
          stars: 1,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', user.uid), profileData);
        // Reserve the username
        await setDoc(usernameRef, { uid: user.uid });

        onAuthSuccess(profileData);
      } else {
        // Sign In Flow
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        // Fetch user profile from firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data());
        } else {
          // If profile doc doesn't exist for some reason, create a standard fallback
          const fallbackProfile = {
            uid: user.uid,
            email: cleanEmail,
            username: user.email?.split('@')[0] || 'dreamer',
            displayName: 'A Midnight Dreamer',
            avatar: PRESET_AVATARS[0].url,
            bio: 'Tuning into Nightgram.',
            followers: 0,
            following: 0,
            stars: 0,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', user.uid), fallbackProfile);
          onAuthSuccess(fallbackProfile);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
        setIsSignUp(false);
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters of deep protection.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid starry email address.');
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || message.includes('invalid-credential')) {
        if (!isSignUp) {
          setError('Incorrect credentials or account does not exist. If you are new, switch to "Create Account".');
          setShowSignUpSuggest(true);
        } else {
          setError('Invalid registration details. Please verify your email and password.');
        }
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in your Firebase project. Please enable it in Firebase Console.');
      } else {
        setError(message || 'An unexpected cosmic disruption occurred. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-zinc-200 flex items-center justify-center p-4 relative overflow-hidden" id="auth-screen-viewport">
      {/* Absolute Neon Ambient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-950/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        id="auth-card"
        className="w-full max-w-md bg-[#07070c]/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative z-10"
      >
        {/* Logo and Brand Header */}
        <div className="text-center space-y-2 mb-5" id="auth-branding-header">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse" id="auth-logo-box">
            <Moon className="w-8 h-8 text-cyan-400 fill-cyan-400" />
          </div>
          <h2 className="text-2xl font-black tracking-[0.1em] uppercase bg-gradient-to-r from-zinc-100 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent font-sans">
            Nightgram
          </h2>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            {isSignUp ? 'Illuminate your frequencies' : 'Tune into the midnight network'}
          </p>
        </div>

        {/* Log In / Create Account Segmented Control Tabs */}
        <div className="flex bg-[#0c0c14] p-1 rounded-xl border border-zinc-800/80 mb-5" id="auth-mode-segmented-tabs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setShowSignUpSuggest(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              !isSignUp
                ? 'bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setShowSignUpSuggest(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              isSignUp
                ? 'bg-purple-950/90 border border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Callout */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="auth-error-alert"
              className="p-3 mb-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex flex-col space-y-2 shadow-lg"
            >
              <div className="flex items-start space-x-2.5">
                <Info className="w-4.5 h-4.5 flex-shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
              {showSignUpSuggest && !isSignUp && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      setShowSignUpSuggest(false);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-950/90 hover:bg-purple-900 border border-purple-700/60 text-purple-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Switch to Create Account</span>
                  </button>
                </div>
              )}
              {popupBlocked && (
                <div className="pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 rounded-lg text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open App in New Tab to Sign In</span>
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-main-form">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Starry Email Address
            </label>
            <input
              id="auth-email-input"
              type="email"
              required
              placeholder="ray@midnight.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Access Password
            </label>
            <input
              id="auth-password-input"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          {/* Conditional Sign Up Fields */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden pt-1"
              id="auth-signup-fields"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    id="auth-display-name-input"
                    type="text"
                    required
                    placeholder="Ray Mitchell"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Unique Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-cyan-500/60 font-semibold">@</span>
                    <input
                      id="auth-username-input"
                      type="text"
                      required
                      placeholder="ray_mid"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl py-2 pl-6 pr-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Midnight Bio
                </label>
                <textarea
                  id="auth-bio-input"
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What is your late-night frequency?"
                  className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Avatar Preset Options */}
              <div id="auth-avatar-selection">
                <input
                  type="file"
                  ref={authFileInputRef}
                  accept="image/*"
                  onChange={handleAuthAvatarFileChange}
                  className="hidden"
                  id="auth-avatar-file-input"
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Select or Upload Avatar
                  </label>
                  <button
                    type="button"
                    onClick={() => authFileInputRef.current?.click()}
                    className="text-[10px] text-cyan-400 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>Upload from Device</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none" id="auth-avatars-row">
                  {/* Upload from Device Tile */}
                  <div
                    onClick={() => authFileInputRef.current?.click()}
                    id="auth-avatar-device-upload-tile"
                    className="relative w-10 h-10 rounded-full cursor-pointer flex-shrink-0 border border-cyan-800/60 bg-cyan-950/40 hover:bg-cyan-900/60 flex items-center justify-center text-cyan-400 transition"
                    title="Upload photo from device"
                  >
                    <Camera className="w-4 h-4" />
                  </div>

                  {PRESET_AVATARS.map((av) => {
                    const isSelected = selectedAvatar === av.url && !customAvatar;
                    return (
                      <div
                        key={av.name}
                        onClick={() => {
                          setSelectedAvatar(av.url);
                          setCustomAvatar('');
                        }}
                        id={`auth-avatar-preset-${av.name.toLowerCase()}`}
                        className={`relative w-10 h-10 rounded-full cursor-pointer flex-shrink-0 border transition-all duration-300 ${
                          isSelected
                            ? 'border-cyan-400 scale-105 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                            : 'border-zinc-800 hover:border-zinc-500'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-full" />
                        {isSelected && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-cyan-400 rounded-full p-0.5">
                            <Check className="w-2 h-2 text-black font-extrabold" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-bold text-xs uppercase tracking-widest transition duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest" id="auth-divider">
            <span className="w-full h-[1px] bg-zinc-850/80"></span>
            <span className="px-3 bg-[#07070c] absolute">or</span>
          </div>

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900/60 text-zinc-350 hover:text-white font-semibold text-xs transition duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Connect with Google Account</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6 pt-4 border-t border-zinc-900/60" id="auth-mode-toggle">
          <button
            id="toggle-auth-mode-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-xs text-zinc-500 hover:text-cyan-400 transition"
          >
            {isSignUp
              ? 'Already a regular late-night wanderer? Connect here'
              : 'New to the midnight frequency? Co-create an account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
