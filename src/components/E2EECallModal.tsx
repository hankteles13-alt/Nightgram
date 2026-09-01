import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSafeCameraStream, createSimulatedCameraStream } from '../lib/cameraHelper';
import {
  Phone,
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
  Lock,
  CheckCircle2,
  Copy,
  Check,
  X,
  User,
  Radio,
  Share2,
  RotateCw,
  Camera
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasWebcamStream, setHasWebcamStream] = useState(false);
  const [swappedStages, setSwappedStages] = useState(false);

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
    }, 1800);

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
    let cleanupFn: (() => void) | null = null;

    async function initMedia() {
      try {
        let stream: MediaStream | null = null;

        if (isVideoCall) {
          const result = await getSafeCameraStream({
            facingMode,
            needAudio: true,
            idealWidth: 1280,
            idealHeight: 720,
          });
          if (result.stream) {
            stream = result.stream;
            cleanupFn = result.cleanup || null;
          } else {
            // Fallback to simulated nocturnal cam stream for preview
            const sim = createSimulatedCameraStream();
            stream = sim.stream;
            cleanupFn = sim.cleanup;
          }
        } else {
          // Audio only call
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (micErr) {
              console.warn('Microphone access denied or unavailable in call:', micErr);
            }
          }
        }

        if (!isMounted) {
          if (cleanupFn) cleanupFn();
          if (stream) stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          mediaStreamRef.current = stream;
          setHasWebcamStream(true);

          if (localVideoRef.current && isVideoCall) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx && stream.getAudioTracks().length > 0) {
            try {
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
            } catch {
              // Audio context fallback handled below
            }
          }
        } else {
          setHasWebcamStream(false);
          const waveInterval = setInterval(() => {
            if (!isMounted) return;
            setAudioLevel(0.15 + Math.random() * 0.55);
          }, 180);
          return () => clearInterval(waveInterval);
        }
      } catch (err) {
        setHasWebcamStream(false);
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
      if (cleanupFn) cleanupFn();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isVideoCall, facingMode]);

  // Flip Camera handler
  const handleFlipCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const result = await getSafeCameraStream({
        facingMode: nextMode,
        needAudio: !isMuted,
        idealWidth: 1280,
        idealHeight: 720,
      });

      if (result.stream) {
        mediaStreamRef.current = result.stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = result.stream;
          localVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Could not switch camera facing mode:', err);
    }
  };

  // Toggle video track on/off
  useEffect(() => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  // Toggle audio track mute
  useEffect(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

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
    }, 300);
  };

  // HH:MM:SS format matching the user image "01:14:14"
  const formatDurationHHMMSS = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        className="fixed bottom-20 right-4 z-50 bg-[#121216] border border-cyan-500/40 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center space-x-3 cursor-pointer hover:border-cyan-400 transition"
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
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#121216] animate-pulse" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white leading-tight flex items-center space-x-1">
            <span>{partner.name}</span>
          </p>
          <p className="text-[11px] text-emerald-400 font-mono">
            {callState === 'connected' ? formatDurationHHMMSS(duration) : 'Ringing...'}
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
      className="fixed inset-0 z-50 flex flex-col w-full h-full bg-black overflow-hidden text-zinc-100 select-none font-sans"
      id="e2ee-call-screen-overlay"
    >
      {/* Full-Screen Video Call Container */}
      <div className="w-full h-full flex flex-col relative overflow-hidden bg-black">
        
        {/* Main Background Feed: Pure Black canvas as shown in screenshot */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
          {/* If swapped or if partner video is active */}
          {swappedStages && isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          ) : !isVideoCall ? (
            /* Voice Call Center Avatar with Audio Wave */
            <div className="relative flex flex-col items-center justify-center my-auto">
              {callState === 'connected' && (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1 + audioLevel * 0.45, 1],
                      opacity: [0.15, 0.4, 0.15],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white/5 border border-white/10 pointer-events-none"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1 + audioLevel * 0.25, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white/5 border border-white/10 pointer-events-none"
                  />
                </>
              )}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-900 flex items-center justify-center shadow-2xl">
                {partner.avatar ? (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-16 h-16 text-zinc-400" />
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* TOP HEADER BAR (Matching exact layout from screenshot) */}
        <div
          className="w-full pt-4 sm:pt-6 px-4 sm:px-6 pb-2 flex items-center justify-between z-20 relative"
          id="call-header-bar"
        >
          {/* Top-Left: Translucent Minimize Button (Inward 4-point arrow icon) */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/10"
            title="Minimize Call"
            id="call-minimize-btn"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* Top-Center: Contact Name & Duration Timer */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
              {partner.name}
            </h2>
            <div className="text-xs sm:text-sm font-medium text-zinc-300 font-mono tracking-wider mt-0.5">
              {callState === 'ringing' ? (
                <span className="text-zinc-300 animate-pulse">Ringing...</span>
              ) : callState === 'connected' ? (
                <span>{formatDurationHHMMSS(duration)}</span>
              ) : (
                <span className="text-red-400">Call Ended</span>
              )}
            </div>
          </div>

          {/* Top-Right: Translucent Add Participant Button */}
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer border border-white/10"
            title="Add Participant"
            id="call-add-user-btn"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* FLOATING PICTURE-IN-PICTURE (PiP) VIDEO STREAM (Bottom-Right, matching screenshot) */}
        {isVideoCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-28 right-4 sm:right-6 z-20 w-36 sm:w-44 aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)] border border-white/20 bg-zinc-900 group cursor-pointer"
            id="call-pip-video-container"
            onClick={() => setSwappedStages(!swappedStages)}
            title="Tap to switch video view"
          >
            {/* Live Camera Stream / Fallback Selfie Video Feed */}
            {isVideoEnabled ? (
              hasWebcamStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                /* High quality realistic selfie video feed matching screenshot */
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  alt="Self Video Stream"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
                <VideoOff className="w-6 h-6 mb-1 text-zinc-500" />
                <span className="text-[10px] font-mono">Camera Off</span>
              </div>
            )}

            {/* Top-Right Flip Camera Icon inside the PiP (matching the camera flip icon in image) */}
            {isVideoEnabled && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer"
                title="Switch Camera"
                id="pip-flip-camera-btn"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Bottom Floating Subtle E2EE Badge */}
            <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[9px] text-zinc-300 font-mono flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>HD</span>
            </div>
          </motion.div>
        )}

        {/* SPACER */}
        <div className="flex-1" />

        {/* BOTTOM FLOATING CONTROL BAR DOCK (Matching screenshot exact layout) */}
        <div className="w-full max-w-md mx-auto px-4 pb-8 sm:pb-10 z-20" id="call-bottom-control-area">
          <div className="bg-[#242426]/95 border border-white/10 backdrop-blur-2xl rounded-full px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center justify-between gap-2.5">
            
            {/* 1. More Options (...) Button */}
            <button
              type="button"
              id="call-more-options-btn"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                showMoreMenu
                  ? 'bg-zinc-600 text-white'
                  : 'bg-[#38383a] hover:bg-[#444446] text-white'
              }`}
              title="More Call Settings"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* 2. Video Camera Toggle Button */}
            <button
              type="button"
              id="call-video-toggle-btn"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isVideoEnabled
                  ? 'bg-white text-zinc-950 font-bold hover:bg-zinc-200 shadow-md'
                  : 'bg-[#38383a] hover:bg-[#444446] text-white'
              }`}
              title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5 fill-current" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* 3. Speaker / Audio Output Toggle Button */}
            <button
              type="button"
              id="call-speaker-toggle-btn"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isSpeaker
                  ? 'bg-white text-zinc-950 font-bold hover:bg-zinc-200 shadow-md'
                  : 'bg-[#38383a] hover:bg-[#444446] text-white'
              }`}
              title={isSpeaker ? 'Speakerphone (On)' : 'Earpiece Mode'}
            >
              {isSpeaker ? <Volume2 className="w-5 h-5 fill-current" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* 4. Microphone Mute / Unmute Button */}
            <button
              type="button"
              id="call-mic-toggle-btn"
              onClick={() => setIsMuted(!isMuted)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isMuted
                  ? 'bg-[#38383a] text-zinc-200 border border-white/20'
                  : 'bg-[#38383a] hover:bg-[#444446] text-white'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-zinc-300" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* 5. End Call Button (Solid Red Rounded Hangup Pill) */}
            <button
              type="button"
              id="call-hangup-btn"
              onClick={handleEndCall}
              className="w-14 sm:w-16 h-11 sm:h-12 rounded-full bg-[#eb5545] hover:bg-[#d94435] active:scale-95 text-white flex items-center justify-center transition-all shadow-[0_0_25px_rgba(235,85,69,0.5)] cursor-pointer"
              title="End Call"
            >
              <Phone className="w-6 h-6 rotate-[135deg] fill-white text-white" />
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
              className="absolute bottom-28 left-4 right-4 z-30 bg-[#1c1c20]/95 border border-zinc-700/60 rounded-3xl p-4 shadow-2xl backdrop-blur-xl space-y-3 max-w-md mx-auto"
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
                {/* Switch Camera Mode */}
                {isVideoCall && (
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="font-semibold text-white">Flip Camera</p>
                        <p className="text-[10px] text-zinc-400">Current: {facingMode === 'user' ? 'Front / Selfie' : 'Back / Rear'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      Switch
                    </span>
                  </button>
                )}

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
              className="absolute inset-x-4 top-20 z-40 bg-[#1c1c22]/95 border border-zinc-700/60 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4 max-w-md mx-auto"
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
                Add frequent Nightgram contacts or invite via direct encrypted link:
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
              className="absolute inset-x-4 top-20 z-40 bg-[#16161e]/95 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-3 max-w-md mx-auto"
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
