import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Post, UserProfile } from '../types';
import { PRESET_SCENES, MOODS } from '../data';
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
} from 'lucide-react';

interface CreatePostModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubmit: (post: Post) => void;
}

export default function CreatePostModal({ currentUser, onClose, onSubmit }: CreatePostModalProps) {
  const [mediaSourceTab, setMediaSourceTab] = useState<'device' | 'preset' | 'url'>('device');
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_SCENES[0] | null>(null);
  const [imageURL, setImageURL] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [location, setLocation] = useState('Urban Haven');
  const [mood, setMood] = useState('Urban Neon');
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['nightgram', 'deviceUpload', 'nocturnal']);
  const [isSparking, setIsSparking] = useState(false);

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

  // File processing logic for Device Storage upload
  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setUploadError('Please select a valid image or video file from your device storage.');
      return;
    }

    setUploadError(null);
    setSelectedFileName(file.name);

    // Format file size nicely
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeInKB = Math.round(file.size / 1024);
    setSelectedFileSize(file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImageURL(result);
        setSelectedPreset(null);
        setMediaSourceTab('device');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file from your device storage. Please try another file.');
    };
    reader.readAsDataURL(file);
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

  // Procedural midnight caption generator
  const handleSparkCaption = () => {
    setIsSparking(true);

    const openers = [
      'Quiet alleyways and neon heartbeats.',
      'When the sun sleeps, the city wakes up in indigo and magenta.',
      'Sipping dark roast while watching reflections ripple on wet asphalt.',
      'Chasing stars far beyond the city glow, where thoughts run slow.',
      'An electric dream captured directly from my personal collection.',
      'Sometimes the night sky has more stories to tell than the crowded daylight.',
    ];

    const midsections = [
      `Captured this frame around ${location || 'a secret location'}.`,
      `Feeling totally immersed in this classic ${mood.toLowerCase()} atmosphere.`,
      `There is a certain calm in the late-night hours that nothing else can replicate.`,
      `Watching the lights blink like fading stars as the clock strikes 2 AM.`,
    ];

    const closers = [
      'Who else is awake right now? 🌌☕',
      'Tell me your favorite midnight soundtrack. 🎧🌧️',
      'Keep dreaming, stargazers. ✨',
      'The quiet hours are made for creating. 💻🎨',
    ];

    const opener = openers[Math.floor(Math.random() * openers.length)];
    const mid = midsections[Math.floor(Math.random() * midsections.length)];
    const closer = closers[Math.floor(Math.random() * closers.length)];

    setTimeout(() => {
      setCaption(`${opener} ${mid} ${closer}`);
      setIsSparking(false);
    }, 600);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback image if none chosen
    const finalMedia = imageURL || PRESET_SCENES[0].url;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: currentUser?.uid,
      username: currentUser?.username || 'midnight_dreamer',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      image: finalMedia,
      caption: caption || 'Chasing the midnight aesthetics. 🌌',
      location: location || 'The Night Realm',
      time: 'Just now',
      likes: 1,
      comments: [],
      isLiked: true,
      isSaved: false,
      mood: mood,
      tags: tags,
    };

    onSubmit(newPost);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto" id="create-post-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        id="create-post-modal-card"
        className="relative w-full max-w-2xl bg-[#09090e] border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-900/80 flex items-center justify-between" id="create-modal-header">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <h2 className="text-sm font-semibold text-zinc-100 tracking-wide uppercase">Create New Post</h2>
          </div>
          <button
            id="close-create-modal"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="create-post-form">
          {/* Media Source Tab Bar */}
          <div className="space-y-3" id="media-source-section">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Step 1: Choose Media Source
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {mediaSourceTab === 'device' && selectedFileName ? 'Local File Attached' : 'Select or drop media'}
              </span>
            </div>

            {/* Source selector buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#121218] rounded-xl border border-zinc-800/80" id="media-source-tabs">
              <button
                type="button"
                id="tab-device-storage"
                onClick={() => setMediaSourceTab('device')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                  mediaSourceTab === 'device'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span>Device Storage</span>
              </button>

              <button
                type="button"
                id="tab-presets"
                onClick={() => setMediaSourceTab('preset')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                  mediaSourceTab === 'preset'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Presets</span>
              </button>

              <button
                type="button"
                id="tab-url"
                onClick={() => setMediaSourceTab('url')}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                  mediaSourceTab === 'url'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-fuchsia-400" />
                <span>Web URL</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Device Storage (File Dropzone & Upload) */}
            {mediaSourceTab === 'device' && (
              <div className="space-y-3" id="device-storage-upload-container">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*,video/*"
                  className="hidden"
                  id="device-file-input"
                />

                {imageURL && selectedFileName ? (
                  /* Attached File Card Preview */
                  <div
                    className="relative bg-[#101018] border border-cyan-500/40 rounded-xl p-3 flex items-center justify-between space-x-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    id="attached-file-preview-card"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                        {imageURL.startsWith('data:video/') ? (
                          <video src={imageURL} className="w-full h-full object-cover" />
                        ) : (
                          <img src={imageURL} alt="Device Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{selectedFileName}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Size: {selectedFileSize} • Ready to post
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        id="change-device-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center space-x-1"
                      >
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Change</span>
                      </button>
                      <button
                        type="button"
                        id="remove-device-file-btn"
                        onClick={handleRemoveUploadedFile}
                        className="p-1.5 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 rounded-lg transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Dropzone area */
                  <div
                    id="device-drag-dropzone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3 ${
                      isDragging
                        ? 'border-cyan-400 bg-cyan-950/30 scale-[0.99] shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'border-zinc-800 hover:border-cyan-500/60 bg-[#0e0e14]/60 hover:bg-[#12121b]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      <Upload className="w-6 h-6 animate-pulse" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        {isDragging ? 'Drop your photo or video here' : 'Select or drag photo/video from your device'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Supports PNG, JPG, WEBP, GIF or MP4 from local storage
                      </p>
                    </div>

                    <button
                      type="button"
                      id="browse-files-btn"
                      className="px-4 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)] transition"
                    >
                      Browse Device Files
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center space-x-2 p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Nocturnal Presets */}
            {mediaSourceTab === 'preset' && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5" id="presets-grid">
                {PRESET_SCENES.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      id={`preset-card-${preset.id}`}
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-cyan-400 scale-[0.98] shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-1.5">
                        <span className="text-[9px] font-bold text-zinc-200 truncate">{preset.name}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-cyan-400 rounded-full p-0.5" id={`check-icon-${preset.id}`}>
                          <Check className="w-2.5 h-2.5 text-black font-bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT 3: Custom Web Link URL */}
            {mediaSourceTab === 'url' && (
              <div className="space-y-3" id="url-source-container">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Direct Image URL
                  </label>
                  <input
                    id="image-url-input"
                    type="text"
                    value={imageURL}
                    onChange={(e) => {
                      setImageURL(e.target.value);
                      setSelectedPreset(null);
                      setSelectedFileName('');
                    }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#121218] border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                {imageURL && !selectedFileName && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
                    <img src={imageURL} alt="URL Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Fields Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="form-fields-grid">
            {/* Left side: Location + Mood */}
            <div className="space-y-4" id="form-fields-left">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Location / Landmark
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                  <input
                    id="location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Shinjuku, Tokyo"
                    className="w-full bg-[#121218] border border-zinc-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Ambient Mood Filter
                </label>
                <div className="grid grid-cols-2 gap-2" id="mood-preset-pills">
                  {MOODS.slice(1).map((m) => {
                    const isSelected = mood === m.name;
                    return (
                      <button
                        type="button"
                        key={m.name}
                        id={`mood-pill-${m.name.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => setMood(m.name)}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                            : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700/60 hover:text-zinc-200'
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side: Caption + AI helper + Hashtags */}
            <div className="space-y-4" id="form-fields-right">
              <div>
                <div className="flex items-center justify-between mb-1.5" id="caption-label-container">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Late Night Caption
                  </label>
                  <div className="flex items-center space-x-1.5" id="caption-tools-group">
                    <button
                      type="button"
                      id="dictate-caption-btn"
                      onClick={toggleDictation}
                      title={isListening ? 'Stop Voice Dictation' : 'Dictate Caption with Voice'}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold transition cursor-pointer ${
                        isListening
                          ? 'bg-red-950/60 border-red-500/60 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : 'bg-purple-950/20 border-purple-800/50 hover:bg-purple-900/30 text-purple-300'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3 h-3 text-red-400" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 text-purple-400" />
                          <span>Dictate</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      id="spark-caption-btn"
                      onClick={handleSparkCaption}
                      disabled={isSparking}
                      className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-950/20 border border-cyan-800/50 hover:bg-cyan-900/30 text-cyan-400 text-[10px] font-semibold transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{isSparking ? 'Sparking...' : 'Spark Caption'}</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="caption-textarea"
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Tell your midnight story, dictate with voice, or let our Spark helper craft something beautiful..."
                    className={`w-full bg-[#121218] border rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none leading-relaxed resize-none transition-colors ${
                      isListening ? 'border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-zinc-800/80 focus:border-cyan-500/50'
                    }`}
                  />
                  {isListening && (
                    <div className="absolute bottom-2.5 right-3 flex items-center space-x-1.5 bg-red-950/90 border border-red-800/80 px-2 py-0.5 rounded-md text-[10px] text-red-300 pointer-events-none animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>Recording voice...</span>
                    </div>
                  )}
                </div>
                {speechError && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-red-400 mt-1 px-1" id="speech-error-message">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{speechError}</span>
                  </div>
                )}
              </div>

              {/* Hashtag Multi Input */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Midnight Hashtags
                </label>
                <div className="flex space-x-2" id="hashtag-input-row">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
                    <input
                      id="hashtag-text-input"
                      type="text"
                      placeholder="Add tag and press +"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(e);
                        }
                      }}
                      className="w-full bg-[#121218] border border-zinc-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    id="add-hashtag-btn"
                    onClick={(e) => handleAddTag(e)}
                    className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 flex items-center justify-center cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Displaying tags */}
                <div className="flex flex-wrap gap-1.5 mt-2.5" id="hashtags-display">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#12121c]/80 border border-zinc-800/60 text-cyan-400 text-xs font-medium"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        id={`remove-tag-${tag}`}
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-600 hover:text-red-400 font-bold ml-1 text-[10px]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-zinc-950 flex items-center justify-end space-x-3" id="create-post-actions-row">
            <button
              type="button"
              id="cancel-post-btn"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-post-btn"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-95 text-white rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition duration-300 cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Illuminate Feed</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
