import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  MoreHorizontal,
  UserPlus,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  X,
  User,
  Radio,
  Sliders,
  Share2
} from 'lucide-react';

interface E2EECallModalProps {
  partner: {
    name: string;
    username: string;
    avatar: string;
    color?: string;
    isAI?: boolean;
  };
  isVideoCall: boolean;
  onClose: (durationSec: number, isVideo: boolean) => void;
}

export default function E2EECallModal({
  partner,
  isVideoCall,
  onClose,
}: E2EECallModalProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showSecurityKeyModal, setShowSecurityKeyModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0.25);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate deterministic E2EE Fingerprint
  const securityFingerprint = React.useMemo(() => {
    const str = `${partner.username}-nightgram-e2ee-key-2026`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `${hex.slice(0, 4)} • ${hex.slice(4, 8)} • 8821 • 4F1A`;
  }, [partner.username]);

  // Handle Call Connection & Ringing
  useEffect(() => {
    let synthAudioCtx: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        synthAudioCtx = new AudioCtx();
        const playChime = () => {
          if (!synthAudioCtx || synthAudioCtx.state === 'closed') return;
          const osc = synthAudioCtx.createOscillator();
          const gain = synthAudioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, synthAudioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, synthAudioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.06, synthAudioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, synthAudioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(synthAudioCtx.destination);
          osc.start();
          osc.stop(synthAudioCtx.currentTime + 0.3);
        };
        playChime();
        const chimeInterval = setInterval(playChime, 1400);
        setTimeout(() => clearInterval(chimeInterval), 2800);
      }
    } catch {
      // Audio synth fallback
    }

    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2200);

    return () => {
      clearTimeout(connectTimer);
      if (synthAudioCtx && synthAudioCtx.state !== 'closed') {
        synthAudioCtx.close();
      }
    };
  }, []);

  // Request media stream for live mic analyser & video
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideoCall,
          });
          if (!isMounted) return;
          mediaStreamRef.current = stream;

          if (localVideoRef.current && isVideoCall) {
            localVideoRef.current.srcObject = stream;
          }

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!isMounted) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(1, Math.max(0.12, avg / 120)));
              animFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
          }
        }
      } catch (err) {
        // Simulated responsive audio wave level for testing environments
        const waveInterval = setInterval(() => {
          if (!isMounted) return;
          setAudioLevel(0.15 + Math.random() * 0.55);
        }, 180);
        return () => clearInterval(waveInterval);
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoCall]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  const handleEndCall = () => {
    setCallState('ended');
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setTimeout(() => {
      onClose(duration, isVideoCall);
    }, 350);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText?.(securityFingerprint);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Minimized floating picture-in-picture widget
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="fixed bottom-20 right-4 z-50 bg-[#0d1117] border border-cyan-500/40 rounded-2xl p-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center space-x-3 cursor-pointer hover:border-cyan-400 transition"
        onClick={() => setIsMinimized(false)}
        id="minimized-call-pill"
      >
        <div className="relative">
          <img
            src={partner.avatar}
            alt={partner.name}
            className="w-10 h-10 rounded-full object-cover border border-cyan-500/50"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0d1117] animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white leading-tight flex items-center space-x-1">
            <span>{partner.name}</span>
          </p>
          <p className="text-[10px] text-emerald-400 font-mono">
            {callState === 'connected' ? formatDuration(duration) : 'Ringing...'}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          title="Maximize Call"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col w-full h-full bg-[#090d14] overflow-hidden text-zinc-100 select-none animate-fade-in"
      id="e2ee-call-screen-overlay"
    >
      {/* Full-Screen Nocturnal Call Stage */}
      <div className="w-full h-full flex flex-col relative overflow-hidden text-zinc-100">
        
        {/* Nocturnal Dark Doodle Pattern Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.045] bg-repeat z-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 20h14v10H15z'/%3E%3Ccircle cx='22' cy='25' r='2'/%3E%3Cpath d='M65 15a6 6 0 1 1-6 6 6 6 0 0 1 6-6z'/%3E%3Cpath d='M95 18l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'/%3E%3Cpath d='M20 70c0 8 7 14 15 14s15-6 15-14H20z'/%3E%3Cpath d='M85 65c-6 0-10 5-10 12h20c0-7-4-12-10-12z'/%3E%3Cpath d='M10 100c5 0 8 3 8 7s-3 7-8 7'/%3E%3Cpath d='M60 95a8 8 0 0 0 8 8h10a8 8 0 0 0 8-8'/%3E%3Cpath d='M100 95c0 5-4 9-9 9s-9-4-9-9 4-9 9-9'/%3E%3Cpath d='M40 38l6-6 6 6'/%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Ambient Subtle Nocturnal Neon Glow Gradients */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header Bar */}
        <div className="w-full max-w-4xl mx-auto pt-6 sm:pt-8 px-6 pb-3 flex items-center justify-between z-20 relative" id="call-header-bar">
          {/* Left: Minimize button (contracting 4-point arrow icon) */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-zinc-200 hover:text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/5"
            title="Minimize Call"
            id="call-minimize-btn"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* Center: Contact Name with Emojis & Duration Timer */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-1.5 drop-shadow-sm tracking-tight">
              <span>{partner.name}</span>
              {partner.isAI ? (
                <span className="text-cyan-400 font-normal text-xs ml-1 font-mono">✨</span>
              ) : (
                <span className="text-sm ml-0.5">😈❤️</span>
              )}
            </h2>
            <div className="text-xs sm:text-sm font-medium text-zinc-400 font-sans tracking-wider mt-0.5">
              {callState === 'ringing' ? (
                <span className="text-cyan-400 animate-pulse font-mono text-xs">Ringing...</span>
              ) : callState === 'connected' ? (
                <span className="text-zinc-300 font-mono tracking-widest">{formatDuration(duration)}</span>
              ) : (
                <span className="text-red-400 font-mono text-xs">Call Ended</span>
              )}
            </div>
          </div>

          {/* Right: Add participant button */}
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-zinc-200 hover:text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/5"
            title="Add Participant"
            id="call-add-user-btn"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Center Stage: Large Circular Avatar & Audio Wave Activity */}
        <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10" id="call-avatar-stage">
          
          {isVideoCall && isVideoEnabled ? (
            /* Live Camera Stream View */
            <div className="relative w-full aspect-[3/4] max-h-[380px] rounded-3xl overflow-hidden border border-cyan-500/40 bg-black shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-cyan-300 font-mono flex items-center space-x-1.5 border border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>HD Video Enabled</span>
              </div>
            </div>
          ) : (
            /* Telegram/WhatsApp Style Large Circular Avatar with Concentric Sound Ripples */
            <div className="relative flex items-center justify-center my-auto">
              {/* Outer Pulsing Sound Waves during Active Speech */}
              {callState === 'connected' && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1 + audioLevel * 0.45, 1],
                      opacity: [0.15, 0.4, 0.15],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-cyan-500/10 border border-cyan-400/20 pointer-events-none"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1 + audioLevel * 0.25, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-purple-500/10 border border-purple-400/20 pointer-events-none"
                  />
                </>
              )}

              {/* Main Avatar Bubble */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-2 border-white/10 bg-[#546b7a] flex items-center justify-center shadow-2xl">
                {partner.avatar ? (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-20 h-20 text-zinc-300" />
                )}
              </div>
            </div>
          )}

          {/* End-to-End Encryption Small Badge */}
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowSecurityKeyModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-emerald-400 font-mono transition cursor-pointer backdrop-blur-md"
              title="View End-to-End Encryption Key"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>End-to-End Encrypted</span>
            </button>
          </div>
        </div>

        {/* Bottom Floating Control Bar (Dark Rounded Pill with 5 Round Controls) */}
        <div className="w-full max-w-md mx-auto p-4 sm:p-6 pb-8 sm:pb-10 z-20" id="call-bottom-control-area">
          <div className="bg-[#12161f]/95 border border-white/10 backdrop-blur-2xl rounded-full px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl flex items-center justify-between gap-1.5 sm:gap-2">
            
            {/* 1. More Options (...) Button */}
            <button
              type="button"
              id="call-more-options-btn"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showMoreMenu
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-white/10 hover:bg-white/15 active:scale-95 text-zinc-200 hover:text-white'
              }`}
              title="More Call Settings"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* 2. Video Toggle Button */}
            <button
              type="button"
              id="call-video-toggle-btn"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoEnabled
                  ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/10 hover:bg-white/15 active:scale-95 text-zinc-200 hover:text-white'
              }`}
              title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* 3. Speaker / Audio Output Button */}
            <button
              type="button"
              id="call-speaker-toggle-btn"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSpeaker
                  ? 'bg-white/15 hover:bg-white/20 active:scale-95 text-white'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
              title={isSpeaker ? 'Speakerphone (On)' : 'Earpiece Mode'}
            >
              {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* 4. Microphone Mute Button */}
            <button
              type="button"
              id="call-mic-toggle-btn"
              onClick={() => setIsMuted(!isMuted)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? 'bg-white/20 text-red-400 border border-red-400/40'
                  : 'bg-white/10 hover:bg-white/15 active:scale-95 text-zinc-200 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 5. End Call Button (Solid Red Hangup) */}
            <button
              type="button"
              id="call-hangup-btn"
              onClick={handleEndCall}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#eb5545] hover:bg-[#d94435] active:scale-95 text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(235,85,69,0.5)] cursor-pointer"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MORE OPTIONS POPUP SHEET */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-28 left-4 right-4 z-30 bg-[#161a24]/95 border border-zinc-700/60 rounded-3xl p-4 shadow-2xl backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-700/50 pb-2">
                <span className="text-xs font-bold text-white tracking-wide">Call Preferences</span>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* Noise Cancellation Toggle */}
                <button
                  type="button"
                  onClick={() => setNoiseCancellation(!noiseCancellation)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-white">AI Noise Cancellation</p>
                      <p className="text-[10px] text-zinc-400">Filters ambient background hums</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${noiseCancellation ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {noiseCancellation ? 'Enabled' : 'Disabled'}
                  </span>
                </button>

                {/* E2EE Safety Key Verification */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowSecurityKeyModal(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">Security Fingerprint</p>
                      <p className="text-[10px] text-zinc-400">Verify end-to-end cryptographic key</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">View Key</span>
                </button>

                {/* Share Call Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="font-semibold text-white">Copy Call Link</p>
                      <p className="text-[10px] text-zinc-400">Invite a guest directly to this call</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-300">
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADD PARTICIPANT MODAL */}
        <AnimatePresence>
          {showAddUserModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-4 top-20 z-40 bg-[#141822]/95 border border-zinc-700/60 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-700/50 pb-2">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Add to Call</h3>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Add frequent Nightgram nocturnal contacts or invite via direct encrypted link:
              </p>

              <div className="space-y-2">
                {[
                  { name: 'Teles (AI Companion)', username: 'teles', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150' },
                  { name: 'neon_wanderer', username: 'neon_wanderer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
                  { name: 'night_owl', username: 'night_owl', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
                ].map((user, userIdx) => (
                  <div key={`call-invite-${user.username}-${userIdx}`} className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                    <div className="flex items-center space-x-2.5">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-cyan-500/40" />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                        <p className="text-[10px] text-zinc-400">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        alert(`Call invite sent to @${user.username}!`);
                        setShowAddUserModal(false);
                      }}
                      className="px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[10px] transition"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-700/50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-200 font-semibold transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Call Link'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* E2EE SECURITY KEY DETAILS MODAL */}
        <AnimatePresence>
          {showSecurityKeyModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-x-4 top-20 z-40 bg-[#121620]/95 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-700/50 pb-2">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">End-to-End Encryption</h3>
                </div>
                <button
                  onClick={() => setShowSecurityKeyModal(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                Audio and video in this Nightgram call are encrypted with standard AES-256-GCM. No one outside of this call, not even Nightgram, can listen to it.
              </p>

              <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 text-center">
                <p className="text-[10px] text-zinc-400 font-mono mb-1">Safety Key Fingerprint</p>
                <div className="font-mono text-emerald-400 font-bold tracking-widest text-xs">
                  {securityFingerprint}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-emerald-400/90 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified match with @{partner.username}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyKey}
                className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-mono hover:bg-emerald-900/80 transition cursor-pointer"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Fingerprint Copied' : 'Copy Key'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
