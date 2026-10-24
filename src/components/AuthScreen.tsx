import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ExternalLink, LogIn, Mail, Moon, ShieldCheck, Smartphone } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, getRedirectResult, sendPhoneOtp, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, verifyPhoneOtp, sendPasswordResetEmail } from '../lib/supabaseAuth';
import { db, doc, getDoc, setDoc } from '../lib/supabaseFirestore';
import { sendVerificationCodeToEmail, verifyVerificationCode, getWebmailUrl } from '../lib/emailService';

interface AuthScreenProps { onAuthSuccess: (user: any) => void; pendingTwoFactorUser?: any | null; onSignOut?: () => void; }
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
];
const TRUSTED_EMAIL_DOMAINS = ['gmail.com','googlemail.com','google.com','outlook.com','hotmail.com','live.com','msn.com','microsoft.com','proton.me','protonmail.com','pm.me','icloud.com','me.com','mac.com','yahoo.com','ymail.com','zoho.com','zohomail.com','aol.com','fastmail.com','tuta.com','tutanota.com','gmx.com','mail.com'];
function isEmailDomainAuthorized(value: string) {
  const clean = value.trim().toLowerCase();
  const at = clean.lastIndexOf('@');
  if (at < 1 || at === clean.length - 1) return false;
  const domain = clean.slice(at + 1);
  if (TRUSTED_EMAIL_DOMAINS.includes(domain)) return true;
  if (domain.endsWith('.edu') || domain.includes('.edu.') || domain.endsWith('.ac.uk')) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) && domain.length >= 4;
}
function normalizePhone(value: string) { return value.replace(/[\s()-]/g, ''); }

export default function AuthScreen({ onAuthSuccess, pendingTwoFactorUser, onSignOut }: AuthScreenProps) {
  const [method, setMethod] = useState<'email'|'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(pendingTwoFactorUser?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [showSignUpSuggest, setShowSignUpSuggest] = useState(false);
  const [phoneOtpStage, setPhoneOtpStage] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState(['','','','','','']);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [phoneResendIn, setPhoneResendIn] = useState(0);
  const phoneRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const [twoFactorStage, setTwoFactorStage] = useState(Boolean(pendingTwoFactorUser));
  const [twoFactorEmail, setTwoFactorEmail] = useState(pendingTwoFactorUser?.email || '');
  const [pendingProfile, setPendingProfile] = useState<any | null>(pendingTwoFactorUser || null);
  const [otpDigits, setOtpDigits] = useState(['','','','','','']);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [emailSending, setEmailSending] = useState(false);
  const [webmailData, setWebmailData] = useState<{name:string;url:string;searchUrl:string}|null>(null);
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const bio = 'Chasing midnight dreams and quiet frequencies. 🌌☕';

  const initiateTwoFactorVerification = async (profileData: any, userEmail: string) => {
    const clean = (userEmail || profileData?.email || email).trim().toLowerCase();
    if (!clean) { onAuthSuccess(profileData); return; }
    setPendingProfile(profileData); setTwoFactorEmail(clean); setOtpDigits(['','','','','','']); setOtpError(''); setOtpSuccess(false); setTimeLeft(600); setResendCooldown(30); setTwoFactorStage(true); setEmailSending(true); setWebmailData(getWebmailUrl(clean));
    try { const result = await sendVerificationCodeToEmail(clean, undefined, profileData); setWebmailData({ name: result.providerName, url: result.webmailUrl, searchUrl: result.webmailUrl }); }
    catch (e) { setOtpError(e instanceof Error ? e.message : 'Could not send verification email.'); }
    finally { setEmailSending(false); }
  };

  const handleUserDocCheck = async (user: any, skipEmailVerification = false) => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profile = { ...snap.data(), phone: user.phone || snap.data()?.phone || '' };
      if (skipEmailVerification) onAuthSuccess(profile); else await initiateTwoFactorVerification(profile, user.email || '');
      return;
    }
    const base = (user.email?.split('@')[0] || user.phone?.replace(/\D/g, '').slice(-8) || 'dreamer').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const uname = base + Math.floor(Math.random() * 1000);
    const profile = { uid: user.uid, email: user.email || '', phone: user.phone || '', username: uname, displayName: user.user_metadata?.displayName || user.displayName || 'A Midnight Dreamer', avatar: user.photoURL || PRESET_AVATARS[0], bio, followers: 0, following: 0, stars: 0, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'usernames', uname), { uid: user.uid });
    await setDoc(ref, profile);
    if (skipEmailVerification) onAuthSuccess(profile); else await initiateTwoFactorVerification(profile, user.email || '');
  };

  const handleVerifyEmailOtp = async (codeToCheck?: string) => {
    const code = (codeToCheck || otpDigits.join('')).trim();
    if (code.length !== 6) { setOtpError('Please enter all 6 digits of the code.'); return; }
    if (timeLeft <= 0) { setOtpError('Verification code has expired. Please resend it.'); return; }
    try { await verifyVerificationCode(twoFactorEmail, code); setOtpSuccess(true); if (pendingProfile?.uid) { sessionStorage.setItem(`nightgram_2fa_${pendingProfile.uid}`, 'true'); localStorage.setItem(`nightgram_2fa_${pendingProfile.uid}`, 'true'); } setTimeout(() => onAuthSuccess(pendingProfile), 400); }
    catch (e) { setOtpError(e instanceof Error ? e.message : 'Invalid verification code.'); }
  };

  const handlePhoneSend = async () => {
    setError(''); setPhoneOtpError(''); const clean = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(clean)) { setError('Enter your mobile number with country code, for example +2567XXXXXXXX.'); return; }
    setLoading(true);
    try { await sendPhoneOtp(clean); setPhone(clean); setPhoneOtpStage(true); setPhoneOtp(['','','','','','']); setPhoneResendIn(60); setTimeout(() => phoneRefs[0].current?.focus(), 150); }
    catch (e: any) { setError(e?.message || 'Could not send the SMS code.'); }
    finally { setLoading(false); }
  };

  const handlePhoneVerify = async (codeToCheck?: string) => {
    const code = (codeToCheck || phoneOtp.join('')).trim();
    if (code.length !== 6) { setPhoneOtpError('Enter the 6-digit SMS code.'); return; }
    setLoading(true); setPhoneOtpError('');
    try { const result = await verifyPhoneOtp(phone, code); await handleUserDocCheck(result.user, true); }
    catch (e: any) { setPhoneOtpError(e?.message || 'The SMS code is invalid or expired.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (!phoneOtpStage || phoneResendIn <= 0) return; const t = setInterval(() => setPhoneResendIn(v => Math.max(0, v - 1)), 1000); return () => clearInterval(t); }, [phoneOtpStage, phoneResendIn]);
  useEffect(() => { if (!twoFactorStage) return; const t = setInterval(() => { setTimeLeft(v => Math.max(0, v - 1)); setResendCooldown(v => Math.max(0, v - 1)); }, 1000); return () => clearInterval(t); }, [twoFactorStage]);
  useEffect(() => { getRedirectResult().then(r => { if (r?.user) handleUserDocCheck(r.user); }).catch(e => setError(e?.message || 'Google sign-in failed.')); }, []);

  const handleEmailAuth = async () => {
    setError(''); setShowSignUpSuggest(false);
    if (!isEmailDomainAuthorized(email)) { setError('Please use a valid email address from a supported or legitimate domain.'); return; }
    setLoading(true);
    try { const result = isSignUp ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password); await handleUserDocCheck(result.user); }
    catch (e: any) { setError(e?.message || 'Authentication failed.'); if (!isSignUp && /invalid login credentials|user not found/i.test(e?.message || '')) setShowSignUpSuggest(true); }
    finally { setLoading(false); }
  };

  const handlePasswordReset = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your email address first, then choose Forgot password?'); return; }
    setLoading(true);
    try { await sendPasswordResetEmail(email); setError('Password reset email sent. Check your inbox.'); }
    catch (e: any) { setError(e?.message || 'Could not send the password reset email.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setPopupBlocked(false); setLoading(true);
    try { await signInWithPopup(); }
    catch (e: any) { if (e?.message?.toLowerCase().includes('popup')) { setPopupBlocked(true); try { await signInWithRedirect(); } catch (err: any) { setError(err?.message || 'Google sign-in failed.'); } } else setError(e?.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  const setPhoneDigit = (index: number, value: string) => { const digit = value.replace(/\D/g, '').slice(-1); const next = [...phoneOtp]; next[index] = digit; setPhoneOtp(next); if (digit && index < 5) phoneRefs[index + 1].current?.focus(); if (next.every(Boolean)) handlePhoneVerify(next.join('')); };
  const setEmailDigit = (index: number, value: string) => { const digit = value.replace(/\D/g, '').slice(-1); const next = [...otpDigits]; next[index] = digit; setOtpDigits(next); if (digit && index < 5) otpRefs[index + 1].current?.focus(); if (next.every(Boolean)) handleVerifyEmailOtp(next.join('')); };

  if (phoneOtpStage) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4"><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl"><div className="flex items-center gap-3 mb-7"><div className="rounded-2xl bg-white/10 p-3"><Smartphone/></div><div><h1 className="text-2xl font-bold">Verify mobile number</h1><p className="text-sm text-zinc-400">Enter the 6-digit code sent to {phone}</p></div></div><div className="flex gap-2 justify-center mb-5">{phoneOtp.map((d,i)=><input key={i} ref={phoneRefs[i]} value={d} onChange={e=>setPhoneDigit(i,e.target.value)} inputMode="numeric" maxLength={1} className="w-11 h-14 rounded-xl bg-white/5 border border-white/10 text-center text-xl font-bold outline-none focus:border-white/40" aria-label={`SMS digit ${i+1}`}/>)}</div>{phoneOtpError&&<p className="text-sm text-red-400 text-center mb-4">{phoneOtpError}</p>}<button disabled={loading} onClick={()=>handlePhoneVerify()} className="w-full rounded-xl bg-white text-black py-3 font-semibold disabled:opacity-50">{loading?'Verifying…':'Verify mobile number'}</button><button disabled={loading||phoneResendIn>0} onClick={handlePhoneSend} className="w-full mt-3 rounded-xl border border-white/10 py-3 disabled:opacity-40">{phoneResendIn>0?`Resend in ${phoneResendIn}s`:'Resend SMS code'}</button><button onClick={()=>{setPhoneOtpStage(false);setPhoneOtp(['','','','','','']);setPhoneOtpError('')}} className="mt-5 w-full text-sm text-zinc-500 hover:text-white flex items-center justify-center gap-2"><ArrowLeft size={15}/> Use another sign-in method</button></motion.div></div>;

  if (twoFactorStage) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4"><motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl"><div className="flex items-center gap-3 mb-6"><div className="rounded-2xl bg-white/10 p-3"><ShieldCheck/></div><div><h1 className="text-2xl font-bold">Verify your account</h1><p className="text-sm text-zinc-400">We sent a 6-digit code to {twoFactorEmail}</p></div></div>{emailSending&&<p className="text-sm text-zinc-400 mb-4">Sending verification email…</p>}<div className="flex gap-2 justify-center mb-5">{otpDigits.map((d,i)=><input key={i} ref={otpRefs[i]} value={d} onChange={e=>setEmailDigit(i,e.target.value)} inputMode="numeric" maxLength={1} className="w-11 h-14 rounded-xl bg-white/5 border border-white/10 text-center text-xl font-bold outline-none focus:border-white/40" aria-label={`Verification digit ${i+1}`}/>)}</div>{otpError&&<p className="text-sm text-red-400 text-center mb-4">{otpError}</p>}{otpSuccess&&<p className="text-sm text-green-400 text-center mb-4">Verified successfully.</p>}<button disabled={otpSuccess} onClick={()=>handleVerifyEmailOtp()} className="w-full rounded-xl bg-white text-black py-3 font-semibold">{otpSuccess?'Verified':'Verify code'}</button>{webmailData&&<a href={webmailData.searchUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-300"><Mail size={16}/> Open {webmailData.name}<ExternalLink size={14}/></a>}<button onClick={()=>{setTwoFactorStage(false);setPendingProfile(null);if(onSignOut)onSignOut()}} className="mt-5 w-full text-sm text-zinc-500 hover:text-white flex items-center justify-center gap-2"><ArrowLeft size={15}/> Back to sign in</button></motion.div></div>;

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <AnimatePresence mode="wait">
        <motion.main
          key={method + isSignUp}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid min-h-screen w-full lg:grid-cols-[0.92fr_1.08fr]"
        >
          <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#10132f] px-7 py-8 sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-14">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white"><Moon size={27} fill="currentColor" /></div>
              <span className="text-2xl font-bold tracking-tight">Nightgram</span>
            </div>
            <div className="max-w-xl py-10 lg:py-16">
              <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Your people.<br />Your moments.</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Share photos, catch up with friends, and keep the moments that matter.</p>
              <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-6">
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10"><Smartphone size={22}/></span><span className="font-medium">Stay connected</span></div>
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10"><Mail size={22}/></span><span className="font-medium">Share your moments</span></div>
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={22}/></span><span className="font-medium">Your privacy matters</span></div>
              </div>
            </div>
            <p className="hidden text-sm text-slate-500 lg:block">A place for the moments worth keeping.</p>
          </section>

          <section className="flex items-center justify-center bg-[#09090d] px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-[540px]">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{method === 'phone' ? 'Sign in with your phone' : isSignUp ? 'Create your account' : 'Welcome back'}</h1>
              <p className="mt-3 text-base text-slate-400 sm:text-lg">{method === 'phone' ? 'We will send you a verification code.' : isSignUp ? 'Join Nightgram and stay close to your people.' : 'Sign in to continue to Nightgram'}</p>

              <div className="mt-8 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button onClick={() => { setMethod('email'); setError(''); }} className={`rounded-lg py-2.5 text-sm font-semibold transition ${method === 'email' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>Email</button>
                <button onClick={() => { setMethod('phone'); setError(''); }} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${method === 'phone' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}><Smartphone size={16}/> Mobile</button>
              </div>

              {method === 'phone' ? (
                <div className="mt-6 space-y-5">
                  <label className="block text-sm font-medium text-slate-200">Mobile number<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+256 7XX XXX XXX" autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-700 bg-[#111118] px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500" /></label>
                  <p className="text-sm text-slate-500">Enter your number with the country code.</p>
                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                  <button disabled={loading} onClick={handlePhoneSend} className="w-full rounded-xl bg-violet-600 py-4 font-semibold transition hover:bg-violet-500 disabled:opacity-50">{loading ? 'Sending code…' : 'Send SMS code'}</button>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <label className="block text-sm font-medium text-slate-200">Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-700 bg-[#111118] px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500" /></label>
                  <label className="block text-sm font-medium text-slate-200">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isSignUp ? 'new-password' : 'current-password'} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#111118] px-4 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500" /></label>
                  {!isSignUp && <div className="-mt-2 flex justify-end"><button type="button" onClick={handlePasswordReset} className="text-sm font-medium text-violet-400 hover:text-violet-300">Forgot password?</button></div>}
                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                  {showSignUpSuggest && <button onClick={() => setIsSignUp(true)} className="text-sm text-slate-300 underline">Create an account instead</button>}
                  <button disabled={loading} onClick={handleEmailAuth} className="w-full rounded-xl bg-violet-600 py-4 font-semibold transition hover:bg-violet-500 disabled:opacity-50">{loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign In')}</button>
                  <div className="flex items-center gap-4 py-1 text-sm text-slate-500"><span className="h-px flex-1 bg-slate-700"/><span>or</span><span className="h-px flex-1 bg-slate-700"/></div>
                  <button disabled={loading} onClick={handleGoogle} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-transparent py-4 font-semibold transition hover:bg-white/[0.04] disabled:opacity-50"><span className="text-xl font-bold" aria-hidden="true"><span className="text-[#4285F4]">G</span></span>Continue with Google</button>
                  {popupBlocked && <p className="text-center text-xs text-slate-500">If a popup is blocked, Google sign-in will continue in this window.</p>}
                  <p className="pt-2 text-center text-sm text-slate-400">{isSignUp ? 'Already have an account?' : 'New to Nightgram?'} <button onClick={() => { setIsSignUp(v => !v); setError(''); setShowSignUpSuggest(false); }} className="font-semibold text-violet-400 hover:text-violet-300">{isSignUp ? 'Sign in' : 'Create account'}</button></p>
                </div>
              )}
              <p className="mt-8 text-center text-xs leading-5 text-slate-600">By continuing, you agree to use Nightgram respectfully and keep your account secure.</p>
            </div>
          </section>
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
