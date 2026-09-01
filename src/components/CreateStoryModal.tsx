import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { PRESET_SCENES, MOODS } from '../data';
import { optimizeImageForFirestore, formatDataUrlSize } from '../lib/imageOptimizer';
import {
  X,
  Sparkles,
  HardDrive,
  Upload,
  ImageIcon,
  Link as LinkIcon,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Layers,
  Flame,
  Camera,
} from 'lucide-react';

export interface StoryFilter {
  id: string;
  name: string;
  cssFilter: string;
  overlayGradient: string;
  colorSwatch: string;
}

export const MOOD_FILTERS: StoryFilter[] = [
  {
    id: 'normal',
    name: 'Normal',
    cssFilter: 'none',
    overlayGradient: 'none',
    colorSwatch: 'from-zinc-700 to-zinc-800',
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    cssFilter: 'contrast(120%) saturate(140%) hue-rotate(10deg)',
    overlayGradient: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(168,85,247,0.3))',
    colorSwatch: 'from-cyan-500 to-purple-600',
  },
  {
    id: 'rainy_slate',
    name: 'Rainy Slate',
    cssFilter: 'contrast(115%) brightness(90%) hue-rotate(180deg)',
    overlayGradient: 'linear-gradient(180deg, rgba(30,58,138,0.3), rgba(15,23,42,0.5))',
    colorSwatch: 'from-blue-600 to-slate-800',
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    cssFilter: 'saturate(160%) hue-rotate(280deg)',
    overlayGradient: 'linear-gradient(135deg, rgba(217,70,239,0.3), rgba(147,51,234,0.35))',
    colorSwatch: 'from-fuchsia-500 to-purple-700',
  },
  {
    id: 'amber_glow',
    name: 'Amber Glow',
    cssFilter: 'sepia(45%) contrast(110%) saturate(130%)',
    overlayGradient: 'linear-gradient(180deg, rgba(245,158,11,0.2), rgba(180,83,9,0.35))',
    colorSwatch: 'from-amber-400 to-orange-600',
  },
  {
    id: 'noir_moon',
    name: 'Noir Moonlight',
    cssFilter: 'grayscale(100%) contrast(135%) brightness(95%)',
    overlayGradient: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))',
    colorSwatch: 'from-zinc-400 to-zinc-950',
  },
  {
    id: 'emerald_aurora',
    name: 'Emerald Aurora',
    cssFilter: 'saturate(130%) hue-rotate(85deg)',
    overlayGradient: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,78,59,0.4))',
    colorSwatch: 'from-emerald-400 to-teal-800',
  },
];

export const TEXT_COLORS = [
  { id: 'cyan', name: 'Cyber Cyan', value: '#22d3ee', bg: 'bg-cyan-400' },
  { id: 'fuchsia', name: 'Neon Pink', value: '#e879f9', bg: 'bg-fuchsia-400' },
  { id: 'purple', name: 'Electric Purple', value: '#c084fc', bg: 'bg-purple-400' },
  { id: 'amber', name: 'Amber Glow', value: '#fbbf24', bg: 'bg-amber-400' },
  { id: 'emerald', name: 'Aurora Mint', value: '#34d399', bg: 'bg-emerald-400' },
  { id: 'white', name: 'Crisp White', value: '#ffffff', bg: 'bg-white' },
];

interface CreateStoryModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubmit: (story: { mediaUrl: string; caption: string; mood: string }) => void;
}

export default function CreateStoryModal({ currentUser, onClose, onSubmit }: CreateStoryModalProps) {
  // Source State
  const [mediaSourceTab, setMediaSourceTab] = useState<'device' | 'preset' | 'url'>('device');
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_SCENES[0] | null>(PRESET_SCENES[0]);
  const [mediaUrl, setMediaUrl] = useState<string>(PRESET_SCENES[0].url);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<StoryFilter>(MOOD_FILTERS[1]); // Default Cyber Neon

  // Text Overlay State
  const [overlayText, setOverlayText] = useState<string>('Late Night Thoughts 🌌');
  const [textColor, setTextColor] = useState<string>('#22d3ee');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [textStyle, setTextStyle] = useState<'badge' | 'glow' | 'solid' | 'banner'>('badge');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // Story Metadata
  const [caption, setCaption] = useState<string>('Lost in midnight thoughts...');
  const [mood, setMood] = useState<string>('Urban Neon');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process uploaded device file with automatic Firestore size compression
  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file for your story.');
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);

    const origSizeText = formatDataUrlSize(file.size);
    setSelectedFileSize(`${origSizeText} (Optimizing...)`);

    try {
      const optimizedDataUrl = await optimizeImageForFirestore(file, {
        maxDimension: 1080,
        quality: 0.82,
        maxSizeBytes: 380000,
      });

      if (optimizedDataUrl) {
        setMediaUrl(optimizedDataUrl);
        setSelectedPreset(null);
        setMediaSourceTab('device');
        const optimizedSizeText = formatDataUrlSize(optimizedDataUrl);
        setSelectedFileSize(`${origSizeText} → ${optimizedSizeText} (Ready)`);
      } else {
        throw new Error('Could not optimize image');
      }
    } catch (err) {
      console.error('Error optimizing story image:', err);
      setUploadError('Failed to read file from your device. Please try another image.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SCENES[0]) => {
    setSelectedPreset(preset);
    setMediaUrl(preset.url);
    setSelectedFileName('');
    setSelectedFileSize('');
    setUploadError(null);
  };

  // Render composite image with canvas to bake overlay and filters into final story image
  const renderCompositeStoryMedia = (): Promise<string> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(mediaUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaUrl;

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const targetWidth = 600;
          const targetHeight = 1000;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(mediaUrl);
            return;
          }

          // Draw base image with cover aspect ratio
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const x = (targetWidth - img.width * scale) / 2;
          const y = (targetHeight - img.height * scale) / 2;

          // Apply filter if available
          if (activeFilter.id !== 'normal') {
            ctx.filter = activeFilter.cssFilter;
          }

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          ctx.filter = 'none';

          // Apply Mood Gradient Overlay
          if (activeFilter.id === 'cyber_neon') {
            const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            grad.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (activeFilter.id === 'rainy_slate') {
            const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
            grad.addColorStop(0, 'rgba(30, 58, 138, 0.3)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.5)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (activeFilter.id === 'vaporwave') {
            const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
            grad.addColorStop(0, 'rgba(217, 70, 239, 0.3)');
            grad.addColorStop(1, 'rgba(147, 51, 234, 0.35)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (activeFilter.id === 'amber_glow') {
            const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
            grad.addColorStop(1, 'rgba(180, 83, 9, 0.35)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (activeFilter.id === 'noir_moon') {
            const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else if (activeFilter.id === 'emerald_aurora') {
            const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
            grad.addColorStop(1, 'rgba(6, 78, 59, 0.4)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          // Top and bottom atmospheric dark gradients
          const topGrad = ctx.createLinearGradient(0, 0, 0, 150);
          topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, targetWidth, 150);

          const bottomGrad = ctx.createLinearGradient(0, targetHeight - 200, 0, targetHeight);
          bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(0, targetHeight - 200, targetWidth, 200);

          // Render Text Overlay if defined
          if (overlayText.trim()) {
            ctx.textAlign = textAlign;
            let fontSizePx = 28;
            if (textSize === 'sm') fontSizePx = 20;
            if (textSize === 'lg') fontSizePx = 36;
            if (textSize === 'xl') fontSizePx = 46;

            ctx.font = `600 ${fontSizePx}px system-ui, -apple-system, sans-serif`;

            let posY = targetHeight / 2;
            if (textPosition === 'top') posY = 220;
            if (textPosition === 'bottom') posY = targetHeight - 240;

            let posX = targetWidth / 2;
            if (textAlign === 'left') posX = 60;
            if (textAlign === 'right') posX = targetWidth - 60;

            // Draw background badge if selected
            const metrics = ctx.measureText(overlayText);
            const textWidth = metrics.width;
            const paddingX = 24;
            const paddingY = 16;

            if (textStyle === 'badge') {
              ctx.fillStyle = 'rgba(9, 9, 14, 0.75)';
              let rectX = posX - textWidth / 2 - paddingX;
              if (textAlign === 'left') rectX = posX - paddingX;
              if (textAlign === 'right') rectX = posX - textWidth - paddingX;

              const rectY = posY - fontSizePx + 4 - paddingY;
              const rectW = textWidth + paddingX * 2;
              const rectH = fontSizePx + paddingY * 2;
              const radius = 16;

              ctx.beginPath();
              ctx.roundRect(rectX, rectY, rectW, rectH, radius);
              ctx.fill();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 1;
              ctx.stroke();
            } else if (textStyle === 'solid') {
              ctx.fillStyle = '#09090e';
              let rectX = posX - textWidth / 2 - paddingX;
              if (textAlign === 'left') rectX = posX - paddingX;
              if (textAlign === 'right') rectX = posX - textWidth - paddingX;

              const rectY = posY - fontSizePx + 4 - paddingY;
              const rectW = textWidth + paddingX * 2;
              const rectH = fontSizePx + paddingY * 2;

              ctx.fillRect(rectX, rectY, rectW, rectH);
            } else if (textStyle === 'banner') {
              ctx.fillStyle = 'rgba(9, 9, 14, 0.85)';
              ctx.fillRect(0, posY - fontSizePx - paddingY, targetWidth, fontSizePx + paddingY * 2 + 10);
            }

            // Draw text string
            ctx.fillStyle = textColor;
            if (textStyle === 'glow') {
              ctx.shadowColor = textColor;
              ctx.shadowBlur = 18;
            } else {
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 8;
            }

            ctx.fillText(overlayText, posX, posY);
            ctx.shadowBlur = 0;
          }

          const compositeUrl = canvas.toDataURL('image/jpeg', 0.85);
          const optimizedComposite = await optimizeImageForFirestore(compositeUrl, {
            maxDimension: 1080,
            quality: 0.82,
            maxSizeBytes: 380000,
          });
          resolve(optimizedComposite);
        } catch (err) {
          console.error('Canvas composite error:', err);
          resolve(mediaUrl);
        }
      };

      img.onerror = () => {
        resolve(mediaUrl);
      };
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      const finalCompositeUrl = await renderCompositeStoryMedia();
      onSubmit({
        mediaUrl: finalCompositeUrl,
        caption: caption || overlayText || 'Late night story 🌌',
        mood: mood,
      });
    } catch (err) {
      console.error('Publish story error:', err);
      onSubmit({
        mediaUrl: mediaUrl,
        caption: caption || 'Late night story 🌌',
        mood: mood,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper classes for live preview text overlay
  const getTextSizeClass = () => {
    if (textSize === 'sm') return 'text-xs md:text-sm';
    if (textSize === 'lg') return 'text-lg md:text-xl font-bold';
    if (textSize === 'xl') return 'text-xl md:text-2xl font-black';
    return 'text-sm md:text-base font-semibold';
  };

  const getTextPosClass = () => {
    if (textPosition === 'top') return 'top-20';
    if (textPosition === 'bottom') return 'bottom-24';
    return 'top-1/2 -translate-y-1/2';
  };

  const getTextStyleClass = () => {
    if (textStyle === 'badge') return 'bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-lg';
    if (textStyle === 'solid') return 'bg-[#09090e] px-4 py-2 rounded-xl shadow-2xl';
    if (textStyle === 'banner') return 'w-full bg-black/80 py-2 px-4 shadow-xl';
    return 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#09090f] w-full h-full overflow-hidden text-zinc-100 animate-fade-in"
      id="create-story-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        id="create-story-modal-card"
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header spanning full top width */}
        <div className="w-full border-b border-zinc-900 bg-[#0c0c14]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0" id="create-story-header">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-pulse shadow-[0_0_8px_rgba(217,70,239,0.8)]"></div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-widest font-sans">Create Ephemeral Story</h2>
              <p className="text-[10px] text-zinc-500 font-mono">24h Nocturnal Broadcast</p>
            </div>
          </div>
          <button
            id="close-create-story-modal"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer border border-zinc-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-zinc-900 w-full max-w-6xl mx-auto">
          {/* LEFT COLUMN: Controls & Editing Studio (7 cols on desktop) */}
          <div className="md:col-span-7 p-5 space-y-6 overflow-y-auto" id="story-studio-controls">
            {/* Step 1: Media Selection Source */}
            <div className="space-y-3" id="story-media-source-section">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>1. Story Media</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {selectedFileName ? 'Local File Selected' : 'Choose media source'}
                </span>
              </div>

              {/* Source Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#121218] rounded-xl border border-zinc-800/80">
                <button
                  type="button"
                  id="story-tab-device"
                  onClick={() => setMediaSourceTab('device')}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    mediaSourceTab === 'device'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Device</span>
                </button>

                <button
                  type="button"
                  id="story-tab-preset"
                  onClick={() => setMediaSourceTab('preset')}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    mediaSourceTab === 'preset'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Presets</span>
                </button>

                <button
                  type="button"
                  id="story-tab-url"
                  onClick={() => setMediaSourceTab('url')}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    mediaSourceTab === 'url'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Web Link</span>
                </button>
              </div>

              {/* Device Dropzone */}
              {mediaSourceTab === 'device' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                    id="story-file-input"
                  />

                  {selectedFileName ? (
                    <div className="bg-[#101018] border border-cyan-500/40 rounded-xl p-3 flex items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img src={mediaUrl} alt="Thumbnail" className="w-12 h-12 object-cover rounded-lg border border-zinc-700 shrink-0" />
                        <div className="overflow-hidden">
                          <div className="flex items-center space-x-1 text-xs font-semibold text-cyan-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{selectedFileName}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{selectedFileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="change-story-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg text-xs hover:bg-zinc-800 transition cursor-pointer shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      id="story-dropzone"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                        isDragging
                          ? 'border-cyan-400 bg-cyan-950/30'
                          : 'border-zinc-800 hover:border-cyan-500/50 bg-[#0e0e14]/60 hover:bg-[#12121b]'
                      }`}
                    >
                      <Upload className="w-6 h-6 text-cyan-400 animate-bounce" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">
                          {isDragging ? 'Drop photo for your story' : 'Upload photo from device storage'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">JPG, PNG, WEBP supported</p>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-center space-x-2 p-2 bg-red-950/40 border border-red-800/50 rounded-lg text-red-300 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Nocturnal Presets */}
              {mediaSourceTab === 'preset' && (
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SCENES.map((preset, presetIdx) => {
                    const isSelected = selectedPreset?.id === preset.id;
                    return (
                      <div
                        key={`story-preset-${preset.id}-${presetIdx}`}
                        id={`story-preset-${preset.id}`}
                        onClick={() => handleSelectPreset(preset)}
                        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                          isSelected ? 'border-fuchsia-400 scale-[0.98] shadow-[0_0_12px_rgba(217,70,239,0.4)]' : 'border-transparent hover:border-zinc-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                          <span className="text-[9px] font-bold text-white truncate">{preset.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-fuchsia-400 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 text-black font-bold" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Web URL */}
              {mediaSourceTab === 'url' && (
                <input
                  id="story-url-input"
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setSelectedPreset(null);
                    setSelectedFileName('');
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                />
              )}
            </div>

            {/* Step 2: Mood-Based Color Filters */}
            <div className="space-y-3" id="story-filters-section">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Palette className="w-4 h-4 text-fuchsia-400" />
                <span>2. Mood-Based Color Filter</span>
              </label>

              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none" id="story-filter-swatches">
                {MOOD_FILTERS.map((filter) => {
                  const isSelected = activeFilter.id === filter.id;
                  return (
                    <button
                      type="button"
                      key={filter.id}
                      id={`filter-btn-${filter.id}`}
                      onClick={() => setActiveFilter(filter)}
                      className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                          : 'bg-[#121218] border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${filter.colorSwatch} shadow-sm shrink-0`} />
                      <span>{filter.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Text Overlay Customization */}
            <div className="space-y-3" id="story-text-overlay-section">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Type className="w-4 h-4 text-purple-400" />
                <span>3. Story Text Overlay</span>
              </label>

              <div className="space-y-3 bg-[#121218]/60 border border-zinc-800/80 rounded-xl p-3.5">
                {/* Overlay Text Input */}
                <input
                  id="story-overlay-text-input"
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Type text overlay on your story..."
                  className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                />

                {/* Controls Row: Text Color Swatches & Position & Style */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Color Swatches */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1.5">Text Color</span>
                    <div className="flex space-x-2" id="text-color-swatches">
                      {TEXT_COLORS.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          id={`text-color-${c.id}`}
                          onClick={() => setTextColor(c.value)}
                          className={`w-6 h-6 rounded-full ${c.bg} transition-transform cursor-pointer ${
                            textColor === c.value ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110'
                          }`}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Size */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1.5">Text Size</span>
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-lg border border-zinc-800" id="text-size-toggle">
                      {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                        <button
                          type="button"
                          key={sz}
                          id={`text-size-${sz}`}
                          onClick={() => setTextSize(sz)}
                          className={`py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            textSize === sz ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controls Row: Position & Style */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Position */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1.5">Vertical Position</span>
                    <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-zinc-800" id="text-pos-toggle">
                      {(['top', 'center', 'bottom'] as const).map((pos) => (
                        <button
                          type="button"
                          key={pos}
                          id={`text-pos-${pos}`}
                          onClick={() => setTextPosition(pos)}
                          className={`py-0.5 rounded text-[10px] font-semibold capitalize transition ${
                            textPosition === pos ? 'bg-cyan-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badge Style */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1.5">Badge Style</span>
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-lg border border-zinc-800" id="text-style-toggle">
                      {(['badge', 'glow', 'solid', 'banner'] as const).map((st) => (
                        <button
                          type="button"
                          key={st}
                          id={`text-style-${st}`}
                          onClick={() => setTextStyle(st)}
                          className={`py-0.5 rounded text-[9px] font-semibold capitalize transition ${
                            textStyle === st ? 'bg-fuchsia-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Caption & Mood Metadata */}
            <div className="space-y-3" id="story-metadata-section">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>4. Caption & Atmosphere</span>
              </label>

              <textarea
                id="story-caption-textarea"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Story caption..."
                className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-none"
              />

              {/* Mood Selector Pills */}
              <div className="grid grid-cols-3 gap-2" id="story-mood-pills">
                {MOODS.slice(1).map((m) => {
                  const isSelected = mood === m.name;
                  return (
                    <button
                      type="button"
                      key={m.name}
                      id={`story-mood-pill-${m.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setMood(m.name)}
                      className={`flex items-center space-x-1.5 p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border-fuchsia-400 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                          : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Story Preview Canvas (5 cols on desktop) */}
          <div className="md:col-span-5 p-5 bg-[#050508] flex flex-col items-center justify-between space-y-4" id="story-live-preview-pane">
            <div className="w-full flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Sun className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Broadcast Preview</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-800/50">
                {activeFilter.name} Filter
              </span>
            </div>

            {/* Mobile Story Mockup Frame */}
            <div
              id="story-preview-phone-mockup"
              className="relative w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-zinc-800 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col justify-between"
            >
              {/* Image Layer with CSS Filter & Gradient Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={mediaUrl}
                  alt="Story Preview"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ filter: activeFilter.cssFilter }}
                  referrerPolicy="no-referrer"
                />
                {/* Mood Gradient Layer */}
                {activeFilter.overlayGradient !== 'none' && (
                  <div
                    className="absolute inset-0 transition-all duration-300"
                    style={{ background: activeFilter.overlayGradient }}
                  />
                )}
                {/* Atmospheric dark top & bottom gradients */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
              </div>

              {/* Story Header overlay */}
              <div className="relative z-10 p-3 flex items-center space-x-2">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                  referrerPolicy="no-referrer"
                />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate drop-shadow">{currentUser?.username || 'midnight_dreamer'}</h4>
                  <span className="text-[9px] font-semibold text-cyan-300 block">{mood}</span>
                </div>
              </div>

              {/* Text Overlay live positioning */}
              {overlayText.trim() && (
                <div className={`absolute left-0 right-0 z-20 px-3 flex justify-center text-center ${getTextPosClass()}`}>
                  <span
                    className={`inline-block ${getTextSizeClass()} ${getTextStyleClass()} transition-all duration-200`}
                    style={{
                      color: textColor,
                      textShadow: textStyle === 'glow' ? `0 0 12px ${textColor}` : undefined,
                    }}
                  >
                    {overlayText}
                  </span>
                </div>
              )}

              {/* Story Bottom Caption preview */}
              <div className="relative z-10 p-3 text-center">
                <p className="text-xs font-medium text-zinc-100 drop-shadow-md line-clamp-2 leading-tight">
                  "{caption || 'Nocturnal story'}"
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full pt-2 flex items-center space-x-3" id="story-publish-actions">
              <button
                type="button"
                id="cancel-story-btn"
                onClick={onClose}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="publish-story-btn"
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 py-2.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(217,70,239,0.35)] transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isPublishing ? 'Broadcasting...' : 'Publish Story'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
