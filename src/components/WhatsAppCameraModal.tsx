import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeImageForFirestore } from '../lib/imageOptimizer';
import { getSafeCameraStream, createSimulatedCameraStream } from '../lib/cameraHelper';
import {
  X,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Sparkles,
  RotateCw,
  Send,
  ArrowLeft,
  Video as VideoIcon,
  Smile,
  Type,
  Crop,
  Edit2,
  Undo2,
  Check,
  Camera,
  Play
} from 'lucide-react';

interface WhatsAppCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPhoto: (imageUrl: string, caption?: string) => void;
  recipientName?: string;
}

// Sample thumbnails exactly matching the WhatsApp camera carousel in the reference image
const RECENT_GALLERY_THUMBNAILS = [
  {
    id: 'th-1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: '#1',
  },
  {
    id: 'th-2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: '#2',
  },
  {
    id: 'th-3',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: 'Stage',
  },
  {
    id: 'th-4',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: 'Doc',
  },
  {
    id: 'th-5',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    type: 'video',
    duration: '0:15',
    label: 'Matte Boss',
  },
  {
    id: 'th-6',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: 'Night Neon',
  },
  {
    id: 'th-7',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80',
    type: 'photo',
    label: 'Stellar',
  }
];

const CAMERA_FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'neon', name: 'Cyber Neon', css: 'contrast(1.2) saturate(1.4) hue-rotate(15deg)' },
  { id: 'noir', name: 'Night Noir', css: 'grayscale(1) contrast(1.3)' },
  { id: 'warm', name: 'Golden Glow', css: 'sepia(0.3) saturate(1.3) brightness(1.05)' },
  { id: 'cool', name: 'Midnight Cyan', css: 'hue-rotate(180deg) saturate(1.2)' },
];

export default function WhatsAppCameraModal({
  isOpen,
  onClose,
  onSendPhoto,
  recipientName = 'Chat',
}: WhatsAppCameraModalProps) {
  // Modes: 'Video' | 'Photo' | 'Video note'
  const [cameraMode, setCameraMode] = useState<'Video' | 'Photo' | 'Video note'>('Photo');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [flashTriggered, setFlashTriggered] = useState(false);

  // Review & Caption State
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isHdQuality, setIsHdQuality] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen || capturedPhotoUrl) return;

    let isMounted = true;
    let cleanupFn: (() => void) | null = null;

    async function startCamera() {
      try {
        const result = await getSafeCameraStream({
          facingMode: facingMode,
          needAudio: false,
          idealWidth: 1280,
          idealHeight: 720,
        });

        if (!isMounted) {
          if (result.cleanup) result.cleanup();
          return;
        }

        if (result.stream) {
          mediaStreamRef.current = result.stream;
          cleanupFn = result.cleanup || null;
          setHasCameraStream(true);

          if (videoRef.current) {
            videoRef.current.srcObject = result.stream;
            videoRef.current.play().catch((e) => console.log('Camera video play caught:', e));
          }
        } else {
          // Hardware camera unavailable/busy; create nocturnal simulated stream
          const sim = createSimulatedCameraStream();
          if (!isMounted) {
            sim.cleanup();
            return;
          }
          mediaStreamRef.current = sim.stream;
          cleanupFn = sim.cleanup;
          setHasCameraStream(true);

          if (videoRef.current) {
            videoRef.current.srcObject = sim.stream;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Camera stream fallback active:', err);
        setHasCameraStream(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (cleanupFn) {
        cleanupFn();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, facingMode, capturedPhotoUrl]);

  if (!isOpen) return null;

  // Toggle front / back camera
  const handleFlipCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle flash
  const handleToggleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  // Filter cycle
  const handleNextFilter = () => {
    setActiveFilterIndex((prev) => (prev + 1) % CAMERA_FILTERS.length);
  };

  // Capture photo
  const handleCapturePhoto = () => {
    if (flashMode === 'on') {
      setFlashTriggered(true);
      setTimeout(() => setFlashTriggered(false), 220);
    }

    if (hasCameraStream && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        const currentFilter = CAMERA_FILTERS[activeFilterIndex];
        if (currentFilter.css !== 'none') {
          ctx.filter = currentFilter.css;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhotoUrl(dataUrl);
        return;
      }
    }

    // Realistic fallback snap representing dark keyboard / room view
    const fallbackImages = [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    ];
    const picked = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    setCapturedPhotoUrl(picked);
  };

  // Upload custom file from local device
  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageForFirestore(file, {
          maxDimension: 1080,
          quality: 0.82,
          maxSizeBytes: 380000,
        });
        if (optimized) {
          setCapturedPhotoUrl(optimized);
        }
      } catch (err) {
        console.error('Error optimizing camera upload:', err);
      }
    }
  };

  // Deliver photo to chat
  const handleConfirmAndSend = async () => {
    if (!capturedPhotoUrl) return;
    let finalPhoto = capturedPhotoUrl;
    if (finalPhoto.startsWith('data:image')) {
      try {
        finalPhoto = await optimizeImageForFirestore(finalPhoto, {
          maxDimension: 1080,
          quality: 0.82,
          maxSizeBytes: 380000,
        });
      } catch (err) {
        console.warn('Final photo optimization fallback:', err);
      }
    }
    onSendPhoto(finalPhoto, captionText.trim());
    handleCloseModal();
  };

  // Close and cleanup
  const handleCloseModal = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCapturedPhotoUrl(null);
    setCaptionText('');
    setIsViewOnce(false);
    onClose();
  };

  const currentFilter = CAMERA_FILTERS[activeFilterIndex];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-between overflow-hidden select-none font-sans text-white"
      id="whatsapp-camera-modal-root"
    >
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleDeviceFileUpload}
      />

      {/* Screen flash white animation */}
      <AnimatePresence>
        {flashTriggered && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-white z-[110] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 1. REVIEW & CAPTION SCREEN (When photo is chosen or captured) */}
      {/* ------------------------------------------------------------- */}
      {capturedPhotoUrl ? (
        <div className="w-full h-full flex flex-col justify-between relative bg-black" id="whatsapp-photo-review-view">
          {/* Top Bar for Review Screen */}
          <div className="pt-5 px-4 pb-3 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
            <button
              type="button"
              onClick={() => setCapturedPhotoUrl(null)}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95 cursor-pointer"
              title="Discard & Retake"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Editing tools: HD, Crop, Text, Pencil, Filter */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={() => setIsHdQuality(!isHdQuality)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono transition border ${
                  isHdQuality
                    ? 'border-white bg-white/20 text-white shadow-sm'
                    : 'border-white/30 text-white/60 hover:text-white'
                }`}
                title="HD Quality"
              >
                HD
              </button>
              <button
                type="button"
                onClick={handleNextFilter}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
                title="Apply Filter"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
                title="Stickers"
              >
                <Smile className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
                title="Text"
              >
                <Type className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
                title="Draw / Doodle"
              >
                <Edit2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Photo Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
            <img
              src={capturedPhotoUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              style={{ filter: currentFilter.css }}
            />
          </div>

          {/* Bottom Bar: Caption input + View Once toggle + WhatsApp Green Send Button */}
          <div className="p-4 pb-8 sm:pb-10 bg-gradient-to-t from-black via-black/90 to-transparent z-20 space-y-3">
            <div className="w-full max-w-lg mx-auto flex items-center space-x-2">
              <div className="flex-1 bg-[#1e1e24]/95 border border-white/15 rounded-full px-4 py-2.5 flex items-center space-x-3 shadow-lg backdrop-blur-md">
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmAndSend();
                    }
                  }}
                  placeholder={`Add a caption for ${recipientName}...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none"
                  autoFocus
                />

                {/* View Once circular badge */}
                <button
                  type="button"
                  onClick={() => setIsViewOnce(!isViewOnce)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    isViewOnce
                      ? 'bg-cyan-400 text-zinc-950 ring-2 ring-cyan-200'
                      : 'border border-white/40 text-zinc-300 hover:text-white'
                  }`}
                  title="View Once"
                >
                  1
                </button>
              </div>

              {/* WhatsApp Green Send Pill */}
              <button
                type="button"
                id="whatsapp-send-photo-btn"
                onClick={handleConfirmAndSend}
                className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#00c298] text-white flex items-center justify-center shadow-[0_0_20px_rgba(0,168,132,0.5)] active:scale-95 transition cursor-pointer flex-shrink-0"
                title="Send Photo"
              >
                <Send className="w-5 h-5 translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* 2. LIVE CAMERA VIEWFINDER: EXACT POSITIONING AS IN REFERENCE IMAGE */
        /* ------------------------------------------------------------------ */
        <div className="w-full h-full flex flex-col justify-between relative bg-black overflow-hidden" id="whatsapp-live-camera-viewfinder">
          
          {/* ========================================================= */}
          {/* TOP STATUS & APP BAR (Time, Status icons, Close X & Flash) */}
          {/* ========================================================= */}
          <div className="z-30 relative bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-3 pb-2 px-4">
            
            {/* Top Phone Status Indicator (23:05, WA Icon, Signal, Battery 45%, Mic dot) */}
            <div className="flex items-center justify-between text-[11px] font-medium text-white/90 px-1 mb-3">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold tracking-tight">23:05</span>
                <span className="text-[10px] opacity-80">💬</span>
                <span className="text-[10px] opacity-80">···</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {/* Signal bars */}
                <div className="flex items-end space-x-0.5 h-2.5">
                  <div className="w-0.5 h-1 bg-white" />
                  <div className="w-0.5 h-1.5 bg-white" />
                  <div className="w-0.5 h-2 bg-white" />
                  <div className="w-0.5 h-2.5 bg-white" />
                </div>
                {/* 2nd Sim signal bars */}
                <div className="flex items-end space-x-0.5 h-2.5">
                  <div className="w-0.5 h-1 bg-white" />
                  <div className="w-0.5 h-1.5 bg-white" />
                  <div className="w-0.5 h-2 bg-white" />
                  <div className="w-0.5 h-2.5 bg-white" />
                </div>
                {/* Wifi / Battery */}
                <div className="flex items-center space-x-1 pl-1">
                  <span className="text-[10px]">45</span>
                  <div className="w-4 h-2.5 border border-white/90 rounded-xs p-0.5 flex items-center">
                    <div className="w-2 h-full bg-white rounded-2xs" />
                  </div>
                  {/* Green privacy active dot */}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] ml-0.5" />
                </div>
              </div>
            </div>

            {/* Top Controls Row: ✕ on top left, Flash on top right */}
            <div className="flex items-center justify-between px-1">
              {/* Top-Left: Close X Icon */}
              <button
                type="button"
                id="camera-modal-close-btn"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition cursor-pointer"
                title="Close"
              >
                <X className="w-7 h-7 stroke-[2.5]" />
              </button>

              {/* Top-Right: Flash Icon inside subtle circle */}
              <button
                type="button"
                id="camera-modal-flash-btn"
                onClick={handleToggleFlash}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition cursor-pointer"
                title={flashMode === 'on' ? 'Flash On' : 'Flash Off'}
              >
                {flashMode === 'on' ? (
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                ) : (
                  <ZapOff className="w-5 h-5 text-white/90" />
                )}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MAIN CAMERA STREAM / BACKGROUND (Dark Keyboard / Room)   */}
          {/* ========================================================= */}
          <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
            {hasCameraStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ filter: currentFilter.css }}
              />
            ) : (
              /* Simulated High-Res Dark Keyboard view exactly like screenshot */
              <div className="relative w-full h-full flex items-center justify-center bg-[#070709] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80"
                  alt="Keyboard Scene"
                  className="w-full h-full object-cover opacity-90 brightness-90 contrast-110"
                  style={{ filter: currentFilter.css }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BOTTOM DOCK (Handle, Filmstrip, 4 Controls, Mode Selector) */}
          {/* ========================================================= */}
          <div className="z-30 flex flex-col space-y-3 pb-3 bg-gradient-to-t from-black via-black/85 to-transparent pt-4">
            
            {/* 1. White Drag Handle Line (—) exactly as in screenshot */}
            <div className="w-9 h-1 bg-white/70 rounded-full mx-auto mb-1" />

            {/* 2. RECENT GALLERY FILMSTRIP THUMBNAILS (Docked horizontally) */}
            <div className="w-full overflow-x-auto no-scrollbar px-3 py-1" id="camera-gallery-filmstrip">
              <div className="flex items-center space-x-2.5 min-w-max">
                
                {/* Upload from Device button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-18 h-18 rounded-lg bg-zinc-900/90 border border-white/20 hover:border-cyan-400 flex flex-col items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer shadow-md flex-shrink-0"
                  title="Choose from device"
                >
                  <ImageIcon className="w-5 h-5 text-cyan-400 mb-0.5" />
                  <span className="text-[10px] font-medium">Gallery</span>
                </button>

                {/* Filmstrip items matching the 5 thumbnails in screenshot */}
                {RECENT_GALLERY_THUMBNAILS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCapturedPhotoUrl(item.url)}
                    className="w-18 h-18 rounded-lg overflow-hidden border border-white/25 hover:border-cyan-400 relative group cursor-pointer active:scale-95 transition shadow-md bg-zinc-900 flex-shrink-0"
                    title={`Send ${item.label}`}
                  >
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />

                    {/* Overlay tag: Video camera icon in bottom left if video, or label */}
                    {item.type === 'video' ? (
                      <div className="absolute bottom-1 left-1 flex items-center space-x-0.5 bg-black/60 backdrop-blur-xs px-1 py-0.5 rounded text-[8px] font-medium text-white">
                        <VideoIcon className="w-2.5 h-2.5 fill-white text-white" />
                        <span>{item.duration}</span>
                      </div>
                    ) : null}

                    {item.label && item.type !== 'video' ? (
                      <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/50 backdrop-blur-xs rounded text-[8px] text-white/90">
                        {item.label}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FOUR HORIZONTAL CONTROLS IN ITS EXACT POSITION */}
            {/* [ Gallery Icon ]    [ Sparkles / Filters ]    [ Big Double-Ring Shutter ]    [ Camera Flip ] */}
            <div className="flex items-center justify-between px-7 sm:px-12 max-w-md mx-auto w-full pt-1" id="camera-shutter-row">
              
              {/* Feature 1: Photo Gallery Icon (Left) */}
              <button
                type="button"
                id="camera-open-gallery-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition cursor-pointer"
                title="Photo Gallery"
              >
                {/* Styled Photo Frame Icon with Landscape Mountain */}
                <div className="w-7 h-7 border-2 border-white rounded-md flex flex-col justify-end p-0.5 overflow-hidden relative">
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-full h-2.5 bg-white clip-triangle" style={{ clipPath: 'polygon(0% 100%, 45% 30%, 75% 70%, 100% 15%, 100% 100%)' }} />
                </div>
              </button>

              {/* Feature 2: Sparkles / Burst Filters Icon (Middle-Left) */}
              <button
                type="button"
                id="camera-filter-toggle-btn"
                onClick={handleNextFilter}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-90 ${
                  activeFilterIndex > 0 ? 'text-cyan-300' : 'text-white hover:bg-white/10'
                }`}
                title={`Filter: ${currentFilter.name}`}
              >
                {/* 8-Ray Radiating Star Burst icon like the screenshot */}
                <div className="relative flex items-center justify-center">
                  <Sparkles className="w-7 h-7" />
                  {activeFilterIndex > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
              </button>

              {/* Feature 3: WhatsApp Circular Shutter Button (Center) */}
              {/* Outer thick white circular ring + empty spacing + solid white filled circle */}
              <button
                type="button"
                id="camera-main-shutter-btn"
                onClick={handleCapturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-transform cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                title="Capture Photo"
              >
                <div
                  className={`w-full h-full rounded-full transition-all duration-200 ${
                    cameraMode === 'Video'
                      ? 'bg-red-500 rounded-xl scale-75'
                      : cameraMode === 'Video note'
                      ? 'bg-cyan-400 scale-90'
                      : 'bg-white'
                  }`}
                />
              </button>

              {/* Feature 4: Camera Flip Icon (Right) */}
              <button
                type="button"
                id="camera-flip-direction-btn"
                onClick={handleFlipCamera}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition cursor-pointer"
                title="Switch Camera (Front/Rear)"
              >
                {/* Two circular arrows forming a circle */}
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center relative">
                  <RotateCw className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            </div>

            {/* 4. MODE SELECTOR ROW: Video | Photo | Video note (Exact format) */}
            <div className="flex items-center justify-center space-x-6 pt-1 text-sm font-semibold tracking-wide" id="camera-mode-selector">
              <button
                type="button"
                onClick={() => setCameraMode('Video')}
                className={`transition-colors cursor-pointer text-sm ${
                  cameraMode === 'Video'
                    ? 'text-white bg-zinc-800/80 px-4 py-1 rounded-full font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Video
              </button>

              <button
                type="button"
                onClick={() => setCameraMode('Photo')}
                className={`transition-all cursor-pointer text-sm ${
                  cameraMode === 'Photo'
                    ? 'text-white bg-zinc-800/90 px-4 py-1 rounded-full font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Photo
              </button>

              <button
                type="button"
                onClick={() => setCameraMode('Video note')}
                className={`transition-colors cursor-pointer text-sm ${
                  cameraMode === 'Video note'
                    ? 'text-white bg-zinc-800/80 px-4 py-1 rounded-full font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Video note
              </button>
            </div>

            {/* 5. Android Navigation Indicator Bar at very bottom (Square | Circle | Triangle) */}
            <div className="flex items-center justify-around max-w-xs mx-auto w-full pt-2 opacity-60">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs" />
              <div className="w-3.5 h-3.5 border-2 border-white rounded-full" />
              <div
                className="w-3.5 h-3.5 border-r-2 border-b-2 border-white rotate-45 translate-x-[-1px]"
                style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
