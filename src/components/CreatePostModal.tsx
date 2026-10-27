import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Post, UserProfile } from '../types';
import { PRESET_SCENES, MOODS } from '../data';
import { optimizeImageForFirestore, formatDataUrlSize } from '../lib/imageOptimizer';
import {
  X,
  Sparkles,
  MapPin,
  Tag,
  Plus,
  Check,
  Upload,
  HardDrive,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  Film,
  Loader2,
} from 'lucide-react';

interface CreatePostModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubmit: (post: Post) => void;
  onSwitchToShorts?: () => void;
}

export default function CreatePostModal({ currentUser, onClose, onSubmit, onSwitchToShorts }: CreatePostModalProps) {
  const [mediaSourceTab, setMediaSourceTab] = useState<'device' | 'preset' | 'url'>('device');
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_SCENES[0] | null>(null);
  const [imageURL, setImageURL] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [location, setLocation] = useState('Urban Haven');
  const [mood, setMood] = useState('Urban Neon');
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['nightgram', 'deviceUpload', 'nocturnal']);

  // Speech Recognition dictation state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseCaptionRef = useRef<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop speech recognition if component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const toggleDictation = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      baseCaptionRef.current = caption ? (caption.endsWith(' ') ? caption : caption + ' ') : '';
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setCaption(baseCaptionRef.current + currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permission.');
        } else if (event.error === 'no-speech') {
          // silence timeout, reset listening
        } else {
          setSpeechError(`Dictation notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Could not launch speech dictation.');
      setIsListening(false);
    }
  };

  // File processing logic for Device Storage upload with automatic Firestore size optimization
  const processFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Posts support photos only. Use Create Short to share a video.');
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);
    setIsOptimizing(true);

    const origSizeText = formatDataUrlSize(file.size);
    setSelectedFileSize(`${origSizeText} (Optimizing...)`);

    try {
      // Compress and optimize image specifically for Firestore document storage (< 400KB)
      const optimizedDataUrl = await optimizeImageForFirestore(file, {
        maxDimension: 1200,
        quality: 0.82,
        maxSizeBytes: 420000,
      });

      if (optimizedDataUrl) {
        setImageURL(optimizedDataUrl);
        setSelectedPreset(null);
        setMediaSourceTab('device');
        const optimizedSizeText = formatDataUrlSize(optimizedDataUrl);
        setSelectedFileSize(`${origSizeText} → ${optimizedSizeText} (Ready)`);
      } else {
        throw new Error('Image could not be converted.');
      }
    } catch (err: any) {
      console.error('Error optimizing image:', err);
      setUploadError('Failed to process image. Please try a different photo or preset.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveUploadedFile = () => {
    setImageURL('');
    setSelectedFileName('');
    setSelectedFileSize('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SCENES[0]) => {
    setSelectedPreset(preset);
    setImageURL(preset.url);
    setSelectedFileName('');
    setSelectedFileSize('');
    setUploadError(null);

    // Auto-fill related fields based on the preset chosen
    if (preset.id === 'tokyo_cyber') {
      setLocation('Shinjuku, Tokyo');
      setMood('Urban Neon');
      setTags(['tokyo', 'cyberpunk', 'neonnights']);
    } else if (preset.id === 'rainy_lights') {
      setLocation('Wet Asphalt Boulevard');
      setMood('Rainy Roads');
      setTags(['rainy', 'citylights', 'bokeh']);
    } else if (preset.id === 'neon_cafe') {
      setLocation('The Corner Roastery');
      setMood('Quiet Cozy');
      setTags(['cafenight', 'latethoughts', 'matchalove']);
    } else if (preset.id === 'starry_sky') {
      setLocation('Pine Ridge Wilderness');
      setMood('Starry Sky');
      setTags(['astrophotography', 'milkyway', 'camping']);
    } else if (preset.id === 'highway_dusk') {
      setLocation('Overpass Expressway');
      setMood('Rainy Roads');
      setTags(['longexposure', 'lighttrails', 'nightdrive']);
    } else if (preset.id === 'arcade_glow') {
      setLocation('Neon Grid Arcade');
      setMood('Retro Arcade');
      setTags(['retro', 'arcadegames', 'vaporwave']);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOptimizing || isSubmitting) return;

    const finalMedia = imageURL.trim();
    if (!finalMedia) {
      setUploadError('Choose a photo before publishing your post.');
      return;
    }
    if (finalMedia.startsWith('data:video/')) {
      setUploadError('Posts support photos only. Use Create Short to share a video.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: currentUser?.uid,
      username: currentUser?.username || 'midnight_dreamer',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      image: finalMedia,
      caption: caption.trim(),
      location: location.trim(),
      time: 'Just now',
      likes: 0,
      comments: [],
      isLiked: false,
      isSaved: false,
      mood: mood || 'Urban Neon',
      tags: tags,
    };

    try {
      await onSubmit(newPost);
    } catch (err) {
      console.error('Failed to submit post:', err);
      setUploadError('Your post could not be published. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090f] w-full h-full overflow-hidden text-zinc-100 animate-fade-in" id="create-post-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        id="create-post-modal-card"
        className="w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header spanning full top screen */}
        <div className="w-full border-b border-zinc-900/90 bg-[#0c0c14]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0" id="create-modal-header">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-wide uppercase font-sans">Create New Post</h2>
              <p className="text-[10px] text-zinc-500 font-mono">Publish to Midnight Lounge</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onSwitchToShorts && (
              <button
                type="button"
                onClick={onSwitchToShorts}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition cursor-pointer flex items-center gap-1.5"
                id="switch-to-shorts-from-post-btn"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Create Short Video instead</span>
              </button>
            )}
            <button
              id="close-create-modal"
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer border border-zinc-800/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body spanning full height with centered max-width content area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-8 w-full max-w-2xl mx-auto" id="create-post-form">
          <div className="space-y-5">
            <div>
              <label htmlFor="device-file-input" className="block text-sm font-semibold text-zinc-200 mb-2">Photo</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="sr-only"
                id="device-file-input"
              />
              {imageURL ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src={imageURL} alt="Post preview" className="w-full max-h-[48vh] object-contain" />
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white hover:bg-black/90">
                      Change photo
                    </button>
                    <button type="button" onClick={handleRemoveUploadedFile} aria-label="Remove photo" className="rounded-full bg-black/70 p-2 text-white hover:bg-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedFileName && <p className="px-3 py-2 text-xs text-zinc-400">{selectedFileName}{selectedFileSize ? ` · ${selectedFileSize}` : ''}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${isDragging ? 'border-cyan-400 bg-cyan-950/30' : 'border-white/15 bg-white/[0.03] hover:border-cyan-400/60 hover:bg-white/[0.06]'}`}
                >
                  {isOptimizing ? <Loader2 className="h-8 w-8 animate-spin text-cyan-300" /> : <ImageIcon className="h-8 w-8 text-cyan-300" />}
                  <span className="text-sm font-semibold text-zinc-200">{isOptimizing ? 'Preparing photo…' : 'Choose a photo'}</span>
                  <span className="text-xs text-zinc-500">Tap to select or drag a photo here</span>
                </button>
              )}
              <p className="mt-2 text-xs text-zinc-500">Photos only. To share videos, use Create Short.</p>
            </div>

            <div>
              <label htmlFor="caption-textarea" className="mb-2 block text-sm font-semibold text-zinc-200">Caption <span className="font-normal text-zinc-500">· optional</span></label>
              <textarea
                id="caption-textarea"
                rows={4}
                maxLength={2200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write something about your photo…"
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/60 focus:outline-none"
              />
              <div className="mt-1 text-right text-xs text-zinc-500">{caption.length}/2200</div>
            </div>

            <details className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-300">Add location (optional)</summary>
              <input
                id="location-input"
                type="text"
                maxLength={120}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add a place"
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/60 focus:outline-none"
              />
            </details>

            {uploadError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex gap-3 border-t border-white/10 pt-4">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={!imageURL || isOptimizing || isSubmitting} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSubmitting ? 'Publishing…' : 'Publish post'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
