import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { ShortVideo } from './ReelsSection';
import {
  getSafeCameraStream,
  createSimulatedCameraStream,
  formatCameraErrorMessage,
} from '../lib/cameraHelper';
import {
  X,
  Sparkles,
  Upload,
  HardDrive,
  Film,
  Video,
  Music,
  Tag,
  Check,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RefreshCw,
  Link as LinkIcon,
  Layers,
  Flame,
  Radio,
  CheckCircle2,
  Trash2,
  Disc,
  Camera,
  Loader2,
} from 'lucide-react';

interface CreateShortModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onSubmit: (shortVideo: ShortVideo) => void;
}

export const PRESET_SHORT_VIDEOS = [
  {
    id: 'preset-rain',
    title: 'Midnight Rain Reflections',
    caption: 'Midnight neon rain reflections in Shibuya at 3:30 AM 🌧️✨ Cyberpunk reality hits different.',
    tags: ['shibuya', 'neon', 'rainvibes', 'cyberpunk', 'tokyonight'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-18312-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Midnight Rain Lofi Chill',
    audioArtist: 'Kavinsky & ChilledCow',
    codeNumber: '0001',
    moodTag: 'Cyber City',
  },
  {
    id: 'preset-synth',
    title: 'Analog Modular Jam',
    caption: 'Late night analog synthesizer modular jam session 🎹 80s tape warmth vibes.',
    tags: ['synthwave', 'modular', 'ambient', 'sounddesign'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Analog Dreams (Tape Saturation)',
    audioArtist: 'Nightrunner',
    codeNumber: '0002',
    moodTag: 'Analog Chill',
  },
  {
    id: 'preset-cosmos',
    title: 'Perseid Meteor Horizon',
    caption: 'Perseid meteor passing right over the obsidian mountain ridge 🌠 Shot on 24mm f/1.4.',
    tags: ['astrophotography', 'space', 'perseids', 'nightsky'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Cosmic Horizon Flow',
    audioArtist: 'Solar Fields',
    codeNumber: '0003',
    moodTag: 'Deep Cosmos',
  },
  {
    id: 'preset-coding',
    title: 'Neon Hacker Green Screen',
    caption: 'When you fix that memory leak at 4:12 AM and the build goes green ☕🔥',
    tags: ['nightowl', 'devvibes', 'coding', 'neonhacker'],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-42797-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Hacker Frequency 432Hz',
    audioArtist: 'Nocturnal Beats',
    codeNumber: '0004',
    moodTag: 'Neon Focus',
  },
];

export const AUDIO_TRACK_PRESETS = [
  { title: 'Midnight Rain Lofi Chill', artist: 'Kavinsky & ChilledCow', code: '0001' },
  { title: 'Analog Dreams (Tape Saturation)', artist: 'Nightrunner', code: '0002' },
  { title: 'Cosmic Horizon Flow', artist: 'Solar Fields', code: '0003' },
  { title: 'Hacker Frequency 432Hz', artist: 'Nocturnal Beats', code: '0004' },
  { title: 'Shinjuku Neon Drift', artist: 'Tokyo Night Drive', code: '0005' },
  { title: 'Deep Cyberpunk Pulse', artist: 'Synapse 9', code: '0006' },
];

export const SHORT_MOODS = [
  'Cyber City',
  'Analog Chill',
  'Deep Cosmos',
  'Neon Focus',
  'Midnight Rain',
  'Star Gazer',
  'Atmospheric Lofi',
  'Nocturnal Groove',
];

export default function CreateShortModal({ currentUser, onClose, onSubmit }: CreateShortModalProps) {
  const [sourceTab, setSourceTab] = useState<'upload' | 'camera' | 'presets' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Video metadata & state
  const [caption, setCaption] = useState('');
  const [moodTag, setMoodTag] = useState('Cyber City');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['nightgram', 'shorts', 'reels', 'nocturnal']);

  // Audio track state
  const [audioTitle, setAudioTitle] = useState('Midnight Rain Lofi Chill');
  const [audioArtist, setAudioArtist] = useState('Nightrunner');
  const [codeNumber, setCodeNumber] = useState('0001');
  const [isCustomAudio, setIsCustomAudio] = useState(false);

  // Live Camera recording state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isSimulatedCam, setIsSimulatedCam] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordingLimit, setRecordingLimit] = useState(30); // 15s, 30s, 60s
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Preview player controls
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Speech Recognition dictation state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera & dictation on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setIsSimulatedCam(false);
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
  };

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      const result = await getSafeCameraStream({
        facingMode: facing,
        needAudio: true,
        idealWidth: 720,
        idealHeight: 1280,
      });

      if (result.stream) {
        videoStreamRef.current = result.stream;
        streamCleanupRef.current = result.cleanup || null;
        setIsSimulatedCam(false);
        setIsCameraActive(true);

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = result.stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError(result.error || 'Camera access unavailable.');
      }
    } catch (err: any) {
      console.warn('Camera initialization handled:', err);
      const friendly = formatCameraErrorMessage(err);
      setCameraError(friendly);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Start Simulated Nocturnal Viewfinder
  const startSimulatedCamera = () => {
    stopCamera();
    setCameraError(null);

    const sim = createSimulatedCameraStream();
    videoStreamRef.current = sim.stream;
    streamCleanupRef.current = sim.cleanup;
    setIsSimulatedCam(true);
    setIsCameraActive(true);

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = sim.stream;
      cameraVideoRef.current.play().catch(() => {});
    }
  };

  const startRecording = () => {
    if (!videoStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const supportedMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : '';

      const options = supportedMime ? { mimeType: supportedMime } : undefined;
      const recorder = new MediaRecorder(videoStreamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = supportedMime || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const recordedUrl = URL.createObjectURL(blob);
        setVideoUrl(recordedUrl);
        setSelectedFileName(
          `${isSimulatedCam ? 'Night_Simulation' : 'Recorded_Short'}_${new Date()
            .toISOString()
            .slice(0, 10)}.webm`
        );
        setSelectedFileSize(`${(blob.size / (1024 * 1024)).toFixed(1)} MB`);
        stopCamera();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordedDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordedDuration((prev) => {
          if (prev + 1 >= recordingLimit) {
            stopRecording();
            return recordingLimit;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting media recorder:', err);
      setCameraError('Recording failed. Please try choosing a preset clip or uploading a file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
  };

  const handleFileChange = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a valid video file (.mp4, .webm, .mov)');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file exceeds 100MB limit. Please choose a shorter clip.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setSelectedFileName(file.name);
    setSelectedFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    // Auto extract thumbnail poster from first frame
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.crossOrigin = 'anonymous';
    tempVideo.muted = true;
    tempVideo.currentTime = 0.5;
    tempVideo.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth || 720;
        canvas.height = tempVideo.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          setPosterUrl(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch {
        // ignore poster capture error
      }
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSelectPreset = (preset: typeof PRESET_SHORT_VIDEOS[0]) => {
    setVideoUrl(preset.videoUrl);
    setPosterUrl(preset.posterUrl);
    setCaption(preset.caption);
    setTags(preset.tags);
    setMoodTag(preset.moodTag);
    setAudioTitle(preset.audioTitle);
    setAudioArtist(preset.audioArtist);
    setCodeNumber(preset.codeNumber);
    setSelectedFileName(`${preset.title}.mp4`);
    setSelectedFileSize('HD Preset');
  };

  const toggleDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCaption((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) {
      setUploadError('Please select or record a video first.');
      return;
    }

    const newShort: ShortVideo = {
      id: `short-${Date.now()}`,
      creator: {
        username: currentUser?.username || 'dreamer',
        displayName: currentUser?.displayName || 'Midnight Dreamer',
        avatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        badge: 'Creator',
      },
      videoUrl: videoUrl,
      posterUrl:
        posterUrl ||
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
      caption: caption || 'Nightgram Short #reels #nocturnal',
      tags: tags.length > 0 ? tags : ['nightgram', 'shorts'],
      audioTrack: {
        title: audioTitle || 'Midnight Beat',
        artist: audioArtist || 'Nightgram Beats',
        codeNumber: codeNumber || '0001',
      },
      likes: 1,
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      isLiked: true,
      isSaved: false,
      timeAgo: 'Just now',
      moodTag: moodTag || 'Cyber City',
    };

    onSubmit(newShort);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      id="create-short-modal-overlay"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="w-full max-w-4xl bg-[#090910] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        id="create-short-modal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-[#0b0b16] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                Create Short Video / Reel
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  9:16 Vertical
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Share nocturnal stories, beats, and vertical video clips</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
            id="close-create-short-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 scrollbar-thin">
          
          {/* Left Column: Video Preview & Source Selector */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Media Source Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setSourceTab('upload');
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                  sourceTab === 'upload'
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceTab('camera');
                  startCamera();
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                  sourceTab === 'camera'
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setSourceTab('presets');
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                  sourceTab === 'presets'
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setSourceTab('url');
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                  sourceTab === 'url'
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
            </div>

            {/* Vertical Video Viewport / Player */}
            <div className="relative w-full aspect-[9/16] max-h-[460px] mx-auto bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col items-center justify-center group">
              
              {/* If Camera Tab is Active and Camera is Starting */}
              {sourceTab === 'camera' && isStartingCamera && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070712]">
                  <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/10">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mb-1">Accessing Camera</h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Connecting to your video capture source with safe hardware negotiation...
                  </p>
                </div>
              )}

              {/* If Camera Tab is Active and Camera is running (Physical or Simulated) */}
              {sourceTab === 'camera' && isCameraActive && !isStartingCamera && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera overlay indicators */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-700/60 text-xs text-white">
                      {isRecording ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span className="font-mono font-bold text-red-400">
                            00:{recordedDuration < 10 ? `0${recordedDuration}` : recordedDuration} / {recordingLimit}s
                          </span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isSimulatedCam ? 'Cyber Live Viewfinder' : 'Live Viewfinder'}</span>
                        </>
                      )}
                    </div>

                    {!isSimulatedCam ? (
                      <button
                        type="button"
                        onClick={() => {
                          const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
                          setCameraFacing(nextFacing);
                          startCamera(nextFacing);
                        }}
                        className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700/60 text-white hover:bg-zinc-800 transition cursor-pointer"
                        title="Flip Camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera(cameraFacing)}
                        className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700/60 text-xs text-cyan-300 hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1"
                        title="Try hardware camera"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Try Real Cam</span>
                      </button>
                    )}
                  </div>

                  {/* Camera Recording Control Panel */}
                  <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-10">
                    {/* Timer limit selector */}
                    {!isRecording && (
                      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-full border border-zinc-700/50 text-[10px]">
                        {[15, 30, 60].map((limit) => (
                          <button
                            key={limit}
                            type="button"
                            onClick={() => setRecordingLimit(limit)}
                            className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                              recordingLimit === limit
                                ? 'bg-cyan-500 text-zinc-950 font-bold'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {limit}s
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Shutter / Record Button */}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all cursor-pointer ${
                        isRecording
                          ? 'border-red-500 bg-red-500/20 scale-105'
                          : 'border-white bg-red-600 hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      }`}
                    >
                      {isRecording ? (
                        <div className="w-5 h-5 bg-red-500 rounded-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-red-500 rounded-full" />
                      )}
                    </button>
                    <span className="text-[11px] font-medium text-white/80 drop-shadow">
                      {isRecording ? 'Tap to finish recording' : 'Tap to start recording'}
                    </span>
                  </div>
                </div>
              )}

              {/* If Camera Tab is Active but Camera failed or is unavailable */}
              {sourceTab === 'camera' && !isCameraActive && !isStartingCamera && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0a0a14] space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Camera Unavailable</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                      {cameraError || 'Hardware camera could not be started in this environment.'}
                    </p>
                  </div>

                  <div className="flex flex-col w-full max-w-xs gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(cameraFacing)}
                      className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Physical Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={startSimulatedCamera}
                      className="w-full py-2 px-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use Cyber Viewfinder Simulator</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSourceTab('presets')}
                      className="w-full py-1.5 px-3 text-xs text-zinc-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      Or pick a preset video clip →
                    </button>
                  </div>
                </div>
              )}

              {/* If Video URL is loaded and ready */}
              {videoUrl && (!isCameraActive || sourceTab !== 'camera') && (
                <div className="relative w-full h-full">
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    poster={posterUrl}
                    loop
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                    onClick={() => {
                      if (previewVideoRef.current) {
                        if (isPlaying) {
                          previewVideoRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          previewVideoRef.current.play();
                          setIsPlaying(true);
                        }
                      }
                    }}
                  />

                  {/* Play / Pause overlay badge */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-cyan-500/90 text-zinc-950 flex items-center justify-center shadow-lg">
                        <Play className="w-7 h-7 ml-1 fill-zinc-950" />
                      </div>
                    </div>
                  )}

                  {/* Overlay Video Meta Preview */}
                  <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none space-y-1 drop-shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/90 text-zinc-950">
                        {moodTag}
                      </span>
                      <span className="text-[10px] text-zinc-300 font-mono flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
                        <Disc className="w-3 h-3 text-cyan-400 animate-spin" />
                        #{codeNumber} {audioTitle}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-2">
                      {caption || 'Your short video caption will appear here...'}
                    </p>
                  </div>

                  {/* Top Right Controls: Mute & Reset */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-zinc-700/60 hover:bg-zinc-800 transition cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoUrl('');
                        setSelectedFileName('');
                      }}
                      className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-zinc-700/60 hover:bg-red-500/30 transition cursor-pointer text-zinc-400 hover:text-red-400"
                      title="Remove video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Empty / Initial State (No video loaded) */}
              {!videoUrl && (!isCameraActive || sourceTab !== 'camera') && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition ${
                    isDragging ? 'bg-cyan-950/40 border-2 border-dashed border-cyan-400' : 'bg-[#0b0b14]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-cyan-400 shadow-lg">
                    <Film className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 mb-1">No Video Selected</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mb-4">
                    Upload an MP4 / WebM video clip, record live with your camera, or choose a preset.
                  </p>

                  {sourceTab === 'upload' && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-zinc-950 font-bold text-xs rounded-xl shadow-md hover:scale-105 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <HardDrive className="w-4 h-4" />
                        <span>Browse Video File</span>
                      </button>
                    </>
                  )}

                  {sourceTab === 'url' && (
                    <div className="w-full max-w-xs space-y-2">
                      <input
                        type="url"
                        placeholder="https://example.com/video.mp4"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) setVideoUrl(val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val) setVideoUrl(val);
                        }}
                      />
                      <span className="text-[10px] text-zinc-500 block">Press Enter to load URL</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected File Info Pill */}
            {selectedFileName && (
              <div className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate text-zinc-300">
                  <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{selectedFileName}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">{selectedFileSize}</span>
              </div>
            )}

            {/* Error alerts */}
            {(uploadError || cameraError) && (
              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{uploadError || cameraError}</span>
              </div>
            )}

            {/* Preset Clips Carousel if Preset tab is active */}
            {sourceTab === 'presets' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Nocturnal Presets
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                  {PRESET_SHORT_VIDEOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-xl text-left flex items-center gap-2 transition cursor-pointer group"
                    >
                      <img
                        src={preset.posterUrl}
                        alt={preset.title}
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold text-zinc-200 truncate block group-hover:text-cyan-300">
                          {preset.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">{preset.moodTag}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Video Details, Audio, Captions & Tags */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Caption & Voice Dictation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  Caption & Description
                </label>
                <button
                  type="button"
                  onClick={toggleDictation}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                  title="Dictate with voice"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's happening in this short clip? (e.g. Midnight synth jam session, rain reflections in Tokyo...)"
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Mood / Vibe Tag Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Mood / Atmosphere
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SHORT_MOODS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setMoodTag(mood)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      moodTag === mood
                        ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Track Selector */}
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-purple-400" />
                  Soundtrack & Audio Track
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomAudio(!isCustomAudio)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {isCustomAudio ? 'Choose from Presets' : 'Custom Sound'}
                </button>
              </div>

              {!isCustomAudio ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                  {AUDIO_TRACK_PRESETS.map((track) => (
                    <button
                      key={track.code}
                      type="button"
                      onClick={() => {
                        setAudioTitle(track.title);
                        setAudioArtist(track.artist);
                        setCodeNumber(track.code);
                      }}
                      className={`p-2 rounded-lg text-left flex items-center justify-between text-xs transition cursor-pointer border ${
                        codeNumber === track.code
                          ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 font-semibold'
                          : 'bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="truncate block font-medium">{track.title}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">{track.artist}</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 font-bold">#{track.code}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Audio title..."
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Code (e.g. 0005)"
                      value={codeNumber}
                      onChange={(e) => setCodeNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hashtags & Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                Hashtags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add hashtag (press Enter)..."
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Tag Badges List */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] rounded-lg"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-cyan-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Creator Attribution */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser?.displayName || 'Creator'}
                  className="w-6 h-6 rounded-full object-cover border border-cyan-400/50"
                  referrerPolicy="no-referrer"
                />
                <span>
                  Posting as <strong className="text-zinc-200">@{currentUser?.username || 'dreamer'}</strong>
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">Auto-saved to Reels feed</span>
            </div>

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/80 bg-[#0b0b16] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!videoUrl}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              videoUrl
                ? 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-purple-600 text-zinc-950 hover:scale-105 shadow-cyan-500/25'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
            }`}
            id="publish-short-btn"
          >
            <Film className="w-4 h-4" />
            <span>Publish Short Video</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
