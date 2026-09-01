/**
 * Robust WebRTC Camera & Audio helper with multi-tier constraint negotiation,
 * error categorization, and graceful fallback for sandboxed/iframe environments.
 */

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  needAudio?: boolean;
  idealWidth?: number;
  idealHeight?: number;
}

export interface CameraStreamResult {
  stream: MediaStream | null;
  error: string | null;
  isSimulated?: boolean;
  cleanup?: () => void;
}

/**
 * Attempts to obtain camera/mic stream using multi-tiered constraint negotiation.
 * Prevents "Could not start video source" crashes by falling back gracefully.
 */
export async function getSafeCameraStream(options: CameraOptions = {}): Promise<CameraStreamResult> {
  const facing = options.facingMode || 'user';
  const needAudio = options.needAudio ?? true;
  const idealWidth = options.idealWidth || 720;
  const idealHeight = options.idealHeight || 1280;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      stream: null,
      error: 'Camera API is not supported in this browser environment.',
    };
  }

  // Small delay to allow any lingering previous track hardware lock to release
  await new Promise((resolve) => setTimeout(resolve, 60));

  const constraintTiers: MediaStreamConstraints[] = [
    // Tier 1: Full ideal constraints + audio
    {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: idealWidth },
        height: { ideal: idealHeight },
      },
      audio: needAudio,
    },
    // Tier 2: Facing mode only + audio
    {
      video: { facingMode: { ideal: facing } },
      audio: needAudio,
    },
    // Tier 3: Basic video + audio
    {
      video: true,
      audio: needAudio,
    },
    // Tier 4: Video only without audio (in case microphone is in use or blocked)
    {
      video: { facingMode: { ideal: facing } },
      audio: false,
    },
    // Tier 5: Absolute basic video
    {
      video: true,
      audio: false,
    },
  ];

  let lastError: any = null;

  for (let i = 0; i < constraintTiers.length; i++) {
    const constraints = constraintTiers[i];
    // Skip audio-free tier if audio was never requested
    if (!needAudio && constraints.audio) continue;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream && stream.getVideoTracks().length > 0) {
        return {
          stream,
          error: null,
          isSimulated: false,
          cleanup: () => {
            stream.getTracks().forEach((t) => t.stop());
          },
        };
      }
    } catch (err: any) {
      lastError = err;
      // If error is permission denied, don't keep polling all tiers
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        break;
      }
    }
  }

  const userFriendlyMessage = formatCameraErrorMessage(lastError);
  return {
    stream: null,
    error: userFriendlyMessage,
  };
}

/**
 * Translates raw browser camera exceptions into clear, actionable user messages
 */
export function formatCameraErrorMessage(err: any): string {
  if (!err) return 'Could not access camera.';

  const errName = err.name || '';
  const errMsg = err.message || '';

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    return 'Camera access was blocked. Please grant camera permission in your browser or use a preset/upload.';
  }

  if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('Could not start video source')) {
    return 'Camera is in use by another tab or app. Please close other camera apps, retry, or use the nocturnal viewfinder simulator.';
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return 'No camera or microphone hardware found. You can upload a video file or choose a preset clip.';
  }

  if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
    return 'Camera does not support the requested video format. Retrying with basic settings...';
  }

  if (errName === 'SecurityError') {
    return 'Camera access is restricted in this window. Try uploading a clip or using presets.';
  }

  return 'Camera could not be started. You can upload a video file or pick a nocturnal preset.';
}

/**
 * Creates an interactive synthetic Nocturnal Viewfinder stream via HTML5 Canvas.
 * Allows recording and previewing vertical shorts even when physical camera is unavailable.
 */
export function createSimulatedCameraStream(): { stream: MediaStream; cleanup: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  let animationFrameId: number;
  let t = 0;

  function draw() {
    if (!ctx) return;
    t += 0.025;

    // 1. Deep Midnight Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    grad.addColorStop(0, '#020206');
    grad.addColorStop(0.3, '#070719');
    grad.addColorStop(0.7, '#0b0c22');
    grad.addColorStop(1, '#030308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    // 2. Distant Neon City Skyline silhouette
    ctx.fillStyle = '#05060f';
    const buildings = [
      { x: 40, w: 70, h: 420 },
      { x: 120, w: 90, h: 580 },
      { x: 220, w: 60, h: 360 },
      { x: 290, w: 110, h: 640 },
      { x: 410, w: 80, h: 490 },
      { x: 500, w: 100, h: 560 },
      { x: 610, w: 70, h: 390 },
    ];
    buildings.forEach((b) => {
      ctx.fillRect(b.x, 1280 - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      for (let wy = 1280 - b.h + 30; wy < 1200; wy += 35) {
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 20) {
          if (Math.sin(wx * 2 + wy + t) > 0.1) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.fillStyle = '#05060f';
    });

    // 3. Glowing Cyber Moon / Ambient Aura
    const moonX = 360 + Math.sin(t * 0.5) * 20;
    const moonY = 320;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 160);
    moonGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
    moonGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.4)');
    moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 160, 0, Math.PI * 2);
    ctx.fill();

    // 4. Perspective Neon Grid
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.18 + 0.08 * Math.sin(t * 1.5)})`;
    ctx.lineWidth = 1.5;
    for (let y = 780; y <= 1280; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(720, y);
      ctx.stroke();
    }

    // 5. Ambient Particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let p = 0; p < 25; p++) {
      const px = (p * 73 + t * 40) % 720;
      const py = (p * 97 + Math.sin(t + p) * 50 + 200) % 1100;
      const pSize = (p % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Camera Viewfinder HUD
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 2;
    // Corners
    const cornerSize = 40;
    const pad = 50;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(720 - pad - cornerSize, pad);
    ctx.lineTo(720 - pad, pad);
    ctx.lineTo(720 - pad, pad + cornerSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(pad, 1280 - pad - cornerSize);
    ctx.lineTo(pad, 1280 - pad);
    ctx.lineTo(pad + cornerSize, 1280 - pad);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(720 - pad - cornerSize, 1280 - pad);
    ctx.lineTo(720 - pad, 1280 - pad);
    ctx.lineTo(720 - pad, 1280 - pad - cornerSize);
    ctx.stroke();

    // Center Crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(360 - 20, 640);
    ctx.lineTo(360 + 20, 640);
    ctx.moveTo(360, 640 - 20);
    ctx.lineTo(360, 640 + 20);
    ctx.stroke();

    // Top HUD Text
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NOCTURNAL LIVE CAM • 60 FPS', 360, 110);

    // Bottom HUD Text
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px monospace';
    ctx.fillText(`${timeString} • 4K HDR • ISO 3200`, 360, 1190);

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();

  const stream = canvas.captureStream(30);

  // Add silent audio track for complete MediaRecorder compatibility
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0; // complete silence
      osc.connect(gain);
      const dest = audioCtx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
  } catch {
    // AudioContext might be constrained
  }

  return {
    stream,
    cleanup: () => {
      cancelAnimationFrame(animationFrameId);
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}
