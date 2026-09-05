import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, LogIn, UserPlus, Info, Check, ExternalLink, ShieldCheck, Mail, KeyRound, RefreshCw, ArrowLeft, Clock, Zap, CheckCircle2, Send } from 'lucide-react';
import { auth } from '../lib/supabaseAuth';
import { db, doc, setDoc, getDoc } from '../lib/supabaseFirestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from '../lib/supabaseAuth';
import { sendVerificationCodeToEmail, getWebmailUrl } from '../lib/emailService';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  pendingTwoFactorUser?: any | null;
  onSignOut?: () => void;
}

const PRESET_AVATARS = [
  { name: 'Starry', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Neon', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cosmic', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { name: 'Nocturnal', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { name: 'Wanderer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Solitary', url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=150&auto=format&fit=crop&q=80' },
];

// Allowed reputable email domain patterns & trusted providers
const TRUSTED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'google.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'microsoft.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'ymail.com',
  'zoho.com',
  'zohomail.com',
  'aol.com',
  'fastmail.com',
  'tuta.com',
  'tutanota.com',
  'gmx.com',
  'mail.com',
];

function isEmailDomainAuthorized(emailAddress: string): boolean {
  const clean = emailAddress.trim().toLowerCase();
  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === clean.length - 1) return false;
  const domain = clean.slice(atIndex + 1);

  // Match known trusted domains
  if (TRUSTED_EMAIL_DOMAINS.includes(domain)) return true;

  // Match institutional / educational domains (.edu, .ac.uk, etc.)
  if (domain.endsWith('.edu') || domain.includes('.edu.') || domain.endsWith('.ac.uk')) return true;

  // Block disposable / dummy domains
  const blockedDisposableDomains = [
    'mailinator.com',
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'trashmail.com',
    'yopmail.com',
    'sharklasers.com',
    'fake.com',
    'test.com',
    'example.com',
  ];
  if (blockedDisposableDomains.includes(domain)) return false;

  // Require a valid TLD format with at least one dot
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) && domain.length >= 4;
}

export default function AuthScreen({ onAuthSuccess, pendingTwoFactorUser, onSignOut }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(pendingTwoFactorUser?.email || '');
  const [password, setPassword] = useState('');
  const [displayName] = useState('');
  const [username] = useState('');
  const [bio] = useState('Chasing midnight dreams and quiet frequencies. 🌌☕');
  const [selectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [showSignUpSuggest, setShowSignUpSuggest] = useState(false);

  // 2-Factor Authentication (2FA) State
  const [twoFactorStage, setTwoFactorStage] = useState(Boolean(pendingTwoFactorUser));
  const [twoFactorEmail, setTwoFactorEmail] = useState(pendingTwoFactorUser?.email || '');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingProfile, setPendingProfile] = useState<any | null>(pendingTwoFactorUser || null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(30);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentTimestamp, setEmailSentTimestamp] = useState<string>('');
  const [webmailData, setWebmailData] = useState<{ name: string; url: string; searchUrl: string } | null>(null);
  const [showCodePeek, setShowCodePeek] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ show: boolean; code: string; email: string } | null>(null);

  // Input box refs for the 6 digit inputs
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Helper to generate and initiate 2FA verification challenge and dispatch to email
  const initiateTwoFactorVerification = async (profileData: any, userEmail: string) => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanTargetEmail = (userEmail || profileData?.email || email || 'authorized user').trim().toLowerCase();
    
    setPendingProfile(profileData);
    setTwoFactorEmail(cleanTargetEmail);
    setTwoFactorCode(randomCode);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess(false);
    setTimeLeft(600);
    setResendCooldown(30);
    setTwoFactorStage(true);
    setEmailSending(true);
    setWebmailData(getWebmailUrl(cleanTargetEmail));

    try {
      const dispatchResult = await sendVerificationCodeToEmail(cleanTargetEmail, randomCode, profileData);
      setEmailSentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setNotificationToast({ show: true, code: randomCode, email: cleanTargetEmail });
      if (dispatchResult.providerName) {
        setWebmailData({
          name: dispatchResult.providerName,
          url: dispatchResult.webmailUrl,
          searchUrl: dispatchResult.webmailUrl,
        });
      }
    } catch (sendErr) {
      console.warn('Verification email dispatch issue handled:', sendErr);
      setEmailSentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setEmailSending(false);
    }
  };

  // If component loaded with pendingTwoFactorUser (e.g. re-login or fresh session), auto-initiate 2FA challenge
  useEffect(() => {
    if (pendingTwoFactorUser && !twoFactorCode) {
      initiateTwoFactorVerification(pendingTwoFactorUser, pendingTwoFactorUser.email || email || 'your authorized email');
    }
  }, [pendingTwoFactorUser]);

  // Timers for expiration and resend cooldown
  useEffect(() => {
    if (!twoFactorStage) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [twoFactorStage]);

  // Auto-focus first OTP input when entering 2FA stage
  useEffect(() => {
    if (twoFactorStage) {
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 300);
    }
  }, [twoFactorStage]);

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanDigit = val.replace(/\D/g, '').slice(-1);
    const updatedDigits = [...otpDigits];
    updatedDigits[index] = cleanDigit;
    setOtpDigits(updatedDigits);
    setOtpError('');

    // If digit entered, auto advance to next box
    if (cleanDigit && index < 5) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    // Auto verify if all 6 digits are populated
    const fullCode = updatedDigits.join('');
    if (fullCode.length === 6 && !updatedDigits.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  // Handle backspace and keyboard navigation in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updatedDigits = [...otpDigits];
        updatedDigits[index - 1] = '';
        setOtpDigits(updatedDigits);
        otpInputRefs[index - 1]?.current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs[index + 1]?.current?.focus();
    }
  };

  // Handle pasting code (e.g. "482910" or "482 910")
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    setOtpError('');

    if (pasted.length === 6) {
      otpInputRefs[5]?.current?.focus();
      handleVerifyOtp(pasted);
    } else {
      otpInputRefs[pasted.length]?.current?.focus();
    }
  };

  // Handle Quick Fill helper for immediate verification
  const handleQuickFill = () => {
    if (!twoFactorCode) return;
    const digits = twoFactorCode.split('');
    setOtpDigits(digits);
    setOtpError('');
    handleVerifyOtp(twoFactorCode);
  };

  // Verify OTP submission
  const handleVerifyOtp = (codeToCheck?: string) => {
    const code = (codeToCheck || otpDigits.join('')).trim();
    if (code.length < 6) {
      setOtpError('Please enter all 6 digits of the code.');
      return;
    }
    if (timeLeft <= 0) {
      setOtpError('Verification code has expired. Please click Resend Code.');
      return;
    }
    if (code !== twoFactorCode) {
      setOtpError('Invalid 6-digit code. Check the incoming security email and try again.');
      return;
    }

    setOtpSuccess(true);
    setOtpError('');

    // Mark 2FA verified in session storage
    if (pendingProfile?.uid) {
      sessionStorage.setItem(`nightgram_2fa_${pendingProfile.uid}`, 'true');
    }

    setTimeout(() => {
      onAuthSuccess(pendingProfile);
    }, 700);
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setTwoFactorCode(newCode);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setTimeLeft(600);
    setResendCooldown(30);
    setEmailSending(true);

    try {
      const dispatchResult = await sendVerificationCodeToEmail(twoFactorEmail, newCode, pendingProfile);
      setEmailSentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setNotificationToast({ show: true, code: newCode, email: twoFactorEmail });
      if (dispatchResult.providerName) {
        setWebmailData({
          name: dispatchResult.providerName,
          url: dispatchResult.webmailUrl,
          searchUrl: dispatchResult.webmailUrl,
        });
      }
    } catch (err) {
      console.warn('Resend 2FA email notice:', err);
      setEmailSentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setEmailSending(false);
    }
    otpInputRefs[0]?.current?.focus();
  };

  // Cancel 2FA and return to login / signout
  const handleCancelTwoFactor = () => {
    setTwoFactorStage(false);
    setPendingProfile(null);
    setTwoFactorCode('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setOtpSuccess(false);
    setNotificationToast(null);
    if (onSignOut) {
      onSignOut();
    }
  };

  const handleUserDocCheck = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const profileData = userSnap.data();
      await initiateTwoFactorVerification(profileData, user.email || cleanEmailForUser(user));
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
      await initiateTwoFactorVerification(profileData, user.email || cleanEmailForUser(user));
    }
  };

  const cleanEmailForUser = (user: any) => {
    return user.email || `${user.uid.slice(0, 6)}@gmail.com`;
  };

  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult();
        if (isMounted && result?.user) {
          await handleUserDocCheck(result.user);
        }
      } catch (err: any) {
        if (!err?.message?.includes('Pending promise was never set')) {
          console.warn('getRedirectResult notice:', err);
        }
      }
    };
    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setPopupBlocked(false);
    setLoading(true);
    try {
      const userCredential = await signInWithPopup();
      await handleUserDocCheck(userCredential.user);
    } catch (err: any) {
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
        console.warn('Google Sign-In popup was blocked by browser frame constraints:', message);
        setPopupBlocked(true);
        setError('Google Sign-In popup was blocked by browser security in this preview frame. Please log in using Email & Password below, or open the app in a new tab to sign in with Google.');
        if (window.self === window.top) {
          try {
            await signInWithRedirect();
          } catch (redirectErr: any) {
            console.warn('Redirect auth notice:', redirectErr);
          }
        }
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        console.warn('Google Sign-In popup closed by user or cancelled.');
        setError('Sign-in popup was closed before completing.');
      } else {
        console.error('Google Sign In Error:', err);
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

    // Enforce authorized email addresses from reputable providers (Gmail, Outlook, Proton, etc.)
    if (!isEmailDomainAuthorized(cleanEmail)) {
      setError('Please use an authorized email address (such as Gmail, Outlook, Proton, iCloud, Yahoo, etc.).');
      setLoading(false);
      return;
    }

    const emailBase = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
    let cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || emailBase;

    try {
      if (isSignUp) {
        // Sign Up Flow
        let usernameRef = doc(db, 'usernames', cleanUsername);
        let usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
          usernameRef = doc(db, 'usernames', cleanUsername);
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const user = userCredential.user;

          const profileData = {
            uid: user.uid,
            email: cleanEmail,
            username: cleanUsername,
            displayName: displayName.trim() || cleanUsername || 'Anonymous Dreamer',
            avatar: PRESET_AVATARS[0].url,
            bio: bio.trim() || 'Late night dreamer',
            followers: Math.floor(Math.random() * 20) + 5,
            following: 12,
            stars: 1,
            createdAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'users', user.uid), profileData);
          await setDoc(usernameRef, { uid: user.uid });

          // Start 2-Factor Authentication verification step
          await initiateTwoFactorVerification(profileData, cleanEmail);
        } catch (signupErr: any) {
          const errCode = signupErr?.code || '';
          const errMsg = signupErr?.message || '';

          if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
              const user = userCredential.user;
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                await initiateTwoFactorVerification(userDoc.data(), cleanEmail);
                return;
              } else {
                await handleUserDocCheck(user);
                return;
              }
            } catch (signInErr: any) {
              console.warn('Email already registered, switching to log in:', signInErr?.message);
              setIsSignUp(false);
              setError('This email is already registered. Please enter your password to log in.');
              return;
            }
          } else {
            throw signupErr;
          }
        }
      } else {
        // Sign In Flow
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          await initiateTwoFactorVerification(userDoc.data(), cleanEmail);
        } else {
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
          await initiateTwoFactorVerification(fallbackProfile, cleanEmail);
        }
      }
    } catch (err: any) {
      console.warn('Auth handling notice:', err?.message || err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        setError('This email is already registered. Try logging in.');
        setIsSignUp(false);
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
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
        setError(message || 'An unexpected error occurred. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format mm:ss for expiration display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#030305] text-zinc-200 flex items-center justify-center p-4 relative overflow-hidden" id="auth-screen-viewport">
      {/* Absolute Neon Ambient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-950/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Email Dispatched Live Notification Banner */}
      <AnimatePresence>
        {notificationToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 bg-[#0c0c16]/95 border border-cyan-500/50 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(6,182,212,0.25)] backdrop-blur-xl"
            id="two-factor-email-toast"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-white tracking-wide">Nightgram Security Mailer</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">Dispatched</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Verification code sent to <strong className="text-cyan-300 font-mono text-xs">{notificationToast.email}</strong>
                  </p>
                  <p className="text-[9px] text-zinc-400">
                    Check your inbox or spam folder for your 6-digit code.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 font-semibold text-[10px] flex items-center space-x-1 transition cursor-pointer active:scale-95"
                  title="Auto-fill verification code"
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Auto-Fill</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        id="auth-card"
        className="w-full max-w-md bg-[#07070c]/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] relative z-10"
      >
        {/* ======================= 2-FACTOR AUTHENTICATION STAGE ======================= */}
        {twoFactorStage ? (
          <div className="space-y-5" id="two-factor-stage-container">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-cyan-400 mb-1" id="two-factor-icon-box">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Email Verification Code
              </h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                We have dispatched a 6-digit security verification code to your email address:
              </p>
              
              {/* Target Email Box */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium max-w-full truncate shadow-inner">
                <Mail className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate font-semibold">{twoFactorEmail}</span>
              </div>

              {/* Live Email Delivery Status Pill */}
              <div className="pt-1 flex items-center justify-center">
                {emailSending ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[11px] text-cyan-300">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Dispatching security email...</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Dispatched to inbox {emailSentTimestamp ? `at ${emailSentTimestamp}` : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar: Direct Webmail Link */}
            {webmailData && (
              <div className="bg-[#0e0e1a] border border-cyan-900/40 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-zinc-200">
                    Check your {webmailData.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Look for "Nightgram Security Code" in inbox or spam
                  </p>
                </div>
                <a
                  href={webmailData.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
                >
                  <span>Open {webmailData.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Error Callout */}
            <AnimatePresence>
              {otpError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center space-x-2"
                  id="two-factor-error-alert"
                >
                  <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{otpError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State Callout */}
            <AnimatePresence>
              {otpSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center space-x-2 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  id="two-factor-success-alert"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Email Code Verified! Entering Nightgram...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6-Digit Code Input Boxes */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
                Enter 6-Digit Security Code
              </label>
              <div
                className="flex items-center justify-between gap-2 sm:gap-2.5"
                onPaste={handleOtpPaste}
                id="otp-input-group"
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={`otp-digit-box-${idx}`}
                    ref={otpInputRefs[idx]}
                    id={`otp-input-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={otpSuccess}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-[#111118] border transition-all duration-200 outline-none text-white ${
                      digit
                        ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] bg-cyan-950/20'
                        : 'border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40'
                    } ${otpError ? 'border-red-500/60 bg-red-950/10' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Expiration Timer & Resend */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex items-center space-x-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Expires in <strong className="font-mono text-zinc-300 font-semibold">{formatTime(timeLeft)}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || otpSuccess || emailSending}
                className={`font-semibold flex items-center space-x-1 transition cursor-pointer ${
                  resendCooldown > 0 || otpSuccess || emailSending
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-cyan-400 hover:text-cyan-300 hover:underline'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 || emailSending ? 'animate-spin text-zinc-600' : 'text-cyan-400'}`} />
                <span>
                  {resendCooldown > 0 ? `Resend to email (${resendCooldown}s)` : 'Resend Code to Email'}
                </span>
              </button>
            </div>

            {/* Submit Verification Button */}
            <button
              id="verify-2fa-btn"
              type="button"
              disabled={otpSuccess || otpDigits.join('').length < 6}
              onClick={() => handleVerifyOtp()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-bold text-xs uppercase tracking-widest transition duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {otpSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verified</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Email & Enter Nightgram</span>
                </>
              )}
            </button>

            {/* Sandbox Testing Backup Toggle */}
            <div className="text-center pt-1 border-t border-zinc-900/60">
              <button
                type="button"
                onClick={() => setShowCodePeek(!showCodePeek)}
                className="text-[10px] text-zinc-500 hover:text-zinc-400 underline transition cursor-pointer"
              >
                {showCodePeek ? 'Hide test preview code' : "Didn't receive email in dev environment? Click here"}
              </button>
              {showCodePeek && (
                <div className="mt-2 p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Development code: <strong className="font-mono text-cyan-300">{twoFactorCode}</strong></span>
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer font-semibold"
                  >
                    Quick Insert
                  </button>
                </div>
              )}
            </div>

            {/* Back / Switch Account */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleCancelTwoFactor}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Use a different email or log in again</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================= CREDENTIALS LOG IN / SIGN UP STAGE ======================= */
          <div>
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
                  Email
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@gmail.com, outlook.com..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111118]/80 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Password
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
                className="w-full py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-semibold text-xs transition duration-300 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
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
                  ? 'Already have an account? Log in'
                  : 'New to Nightgram? Create account'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
