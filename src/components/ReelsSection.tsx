import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Search,
  Heart,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Plus,
  Check,
  Music,
  Play,
  Send,
  X,
  MessageSquare,
  Sparkles,
  Radio
} from 'lucide-react';
import { UserProfile } from '../types';

export interface ShortVideo {
  id: string;
  creator: {
    username: string;
    displayName: string;
    avatar: string;
    isFollowing?: boolean;
    badge?: string;
  };
  videoUrl: string;
  posterUrl: string;
  caption: string;
  tags: string[];
  audioTrack: {
    title: string;
    artist: string;
    codeNumber?: string;
  };
  likes: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  timeAgo: string;
  moodTag: string;
}

const DEFAULT_SHORTS: ShortVideo[] = [
  {
    id: 'short-1',
    creator: {
      username: 'nightwalker_jp',
      displayName: 'Kenji Sato',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
      badge: 'Night Stalker',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-18312-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    caption: 'Midnight neon rain reflections in Shibuya at 3:30 AM 🌧️✨ Cyberpunk reality hits different when the city is quiet.',
    tags: ['shibuya', 'neon', 'rainvibes', 'cyberpunk', 'tokyonight'],
    audioTrack: {
      codeNumber: '0001',
      title: 'Midnight Rain Lofi Chill',
      artist: 'Kavinsky & ChilledCow',
    },
    likes: 124500,
    commentsCount: 1420,
    sharesCount: 8900,
    savesCount: 100200,
    isLiked: false,
    isSaved: false,
    timeAgo: '1h ago',
    moodTag: 'Cyber City',
  },
  {
    id: 'short-2',
    creator: {
      username: 'synthwave_girl',
      displayName: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
      badge: 'Analog Sound',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    caption: 'Late night analog synthesizer modular jam session 🎹 80s tape warmth vibes.',
    tags: ['synthwave', 'modular', 'ambient', 'sounddesign'],
    audioTrack: {
      codeNumber: '0002',
      title: 'Analog Dreams (Tape Saturation)',
      artist: 'Nightrunner',
    },
    likes: 89200,
    commentsCount: 940,
    sharesCount: 4200,
    savesCount: 65400,
    isLiked: true,
    isSaved: true,
    timeAgo: '3h ago',
    moodTag: 'Analog Chill',
  },
  {
    id: 'short-3',
    creator: {
      username: 'deep_astronomy',
      displayName: 'Leo Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isFollowing: true,
      badge: 'Star Gazer',
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    caption: 'Perseid meteor passing right over the obsidian mountain ridge 🌠 Shot on 24mm f/1.4.',
    tags: ['astrophotography', 'space', 'perseids', 'nightsky'],
    audioTrack: {
      codeNumber: '0003',
      title: 'Cosmic Horizon Flow',
      artist: 'Solar Fields',
    },
    likes: 215400,
    commentsCount: 2310,
    sharesCount: 15400,
    savesCount: 142000,
    isLiked: false,
    isSaved: false,
    timeAgo: '5h ago',
    moodTag: 'Deep Cosmos',
  },
  {
    id: 'short-4',
    creator: {
      username: 'nocturnal_dev',
      displayName: 'Alex Rivers',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isFollowing: false,
    },
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-42797-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    caption: 'When you fix that memory leak at 4:12 AM and the build goes green ☕🔥',
    tags: ['nightowl', 'devvibes', 'coding', 'neonhacker'],
    audioTrack: {
      codeNumber: '0004',
      title: 'Hacker Frequency 432Hz',
      artist: 'Nocturnal Beats',
    },
    likes: 45600,
    commentsCount: 512,
    sharesCount: 2300,
    savesCount: 31200,
    isLiked: false,
    isSaved: false,
    timeAgo: '7h ago',
    moodTag: 'Neon Focus',
  },
];

interface ReelsSectionProps {
  currentUser: UserProfile | null;
  onClose?: () => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
}

export function ReelsSection({ currentUser, onClose, onOpenChatWithUser }: ReelsSectionProps) {
  const [shorts, setShorts] = useState<ShortVideo[]>(() => {
    const saved = localStorage.getItem('nightgram_shorts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [doubleTappedHeart, setDoubleTappedHeart] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showNiyteeEndCard, setShowNiyteeEndCard] = useState(false);

  const [commentsList, setCommentsList] = useState<{ [id: string]: { username: string; text: string; time: string; avatar: string }[] }>({
    'short-1': [
      { username: 'synth_fox', text: 'That rain reflection on the pavement is pure poetry 🌧️', time: '1h ago', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
      { username: 'nocturnal_rider', text: 'Which camera settings did you use for this?', time: '45m ago', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
      { username: 'tokyo_drift', text: 'Shibuya at 3am is the best place on earth', time: '20m ago', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100' }
    ],
    'short-2': [
      { username: 'beat_maker', text: 'The Juno synth patch sounds unbelievable 🔥', time: '2h ago', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100' },
    ],
  });

  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const touchStartY = useRef<number>(0);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('nightgram_shorts', JSON.stringify(shorts));
  }, [shorts]);

  // Video playback management
  useEffect(() => {
    setIsVideoLoading(true);
    setShowNiyteeEndCard(false);
    Object.keys(videoRefs.current).forEach((key) => {
      const idx = parseInt(key, 10);
      const vid = videoRefs.current[idx];
      if (vid) {
        if (idx === currentIndex) {
          vid.currentTime = 0;
          if (isPlaying) {
            vid.play().catch(() => {});
          }
        } else {
          vid.pause();
        }
      }
    });
    const timer = setTimeout(() => setIsVideoLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid.duration && vid.duration > 0) {
      const timeLeft = vid.duration - vid.currentTime;
      // Show 'niytee' card at the end of the video (last 2 seconds)
      if (timeLeft <= 2.0 && timeLeft > 0.1) {
        if (!showNiyteeEndCard) setShowNiyteeEndCard(true);
      } else if (timeLeft > 2.0) {
        if (showNiyteeEndCard) setShowNiyteeEndCard(false);
      }
    }
  };

  const handleVideoEnded = () => {
    setShowNiyteeEndCard(true);
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCommentsModal || showSearchModal) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        handleNextVideo();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        handlePrevVideo();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showCommentsModal, showSearchModal]);

  const handleNextVideo = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 50) {
      handleNextVideo();
    } else if (diff < -50) {
      handlePrevVideo();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        handleNextVideo();
      } else {
        handlePrevVideo();
      }
    }
  };

  const handleLike = (id: string) => {
    setShorts((prev) =>
      prev.map((short) => {
        if (short.id === id) {
          const nextLiked = !short.isLiked;
          return {
            ...short,
            isLiked: nextLiked,
            likes: nextLiked ? short.likes + 1 : short.likes - 1,
          };
        }
        return short;
      })
    );
  };

  const handleSave = (id: string) => {
    setShorts((prev) =>
      prev.map((short) => {
        if (short.id === id) {
          const nextSaved = !short.isSaved;
          return {
            ...short,
            isSaved: nextSaved,
            savesCount: nextSaved ? (short.savesCount || 0) + 1 : (short.savesCount || 1) - 1,
          };
        }
        return short;
      })
    );
  };

  const handleFollowToggle = (username: string) => {
    setShorts((prev) =>
      prev.map((short) => {
        if (short.creator.username === username) {
          return {
            ...short,
            creator: {
              ...short.creator,
              isFollowing: !short.creator.isFollowing,
            },
          };
        }
        return short;
      })
    );
  };

  const handleDoubleTap = (id: string) => {
    setDoubleTappedHeart(true);
    setTimeout(() => setDoubleTappedHeart(false), 800);
    const short = shorts.find((s) => s.id === id);
    if (short && !short.isLiked) {
      handleLike(id);
    }
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const currentShort = shorts[currentIndex];
    if (!currentShort) return;

    const commentObj = {
      username: currentUser?.username || 'night_user',
      text: newComment.trim(),
      time: 'Just now',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    setCommentsList((prev) => ({
      ...prev,
      [currentShort.id]: [...(prev[currentShort.id] || []), commentObj],
    }));

    setShorts((prev) =>
      prev.map((s) => (s.id === currentShort.id ? { ...s, commentsCount: s.commentsCount + 1 } : s))
    );

    setNewComment('');
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const currentShort = shorts[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden select-none"
      id="tiktok-fullscreen-shorts-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Top Header: Following | For you + Search Icon & Back button */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 pt-3 pb-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
        {/* Left: Back / Exit Arrow */}
        <div className="flex items-center space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition cursor-pointer border border-white/10"
              title="Back to Feed"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Center: "Following" | "For you" (with white indicator underline) */}
        <div className="flex items-center space-x-6 text-base font-semibold">
          <button
            onClick={() => setActiveTab('following')}
            className={`transition cursor-pointer ${
              activeTab === 'following' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span>Following</span>
            {activeTab === 'following' && (
              <div className="w-6 h-[3px] bg-white rounded-full mx-auto mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('foryou')}
            className={`transition cursor-pointer ${
              activeTab === 'foryou' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
            }`}
          >
            <span>For you</span>
            {activeTab === 'foryou' && (
              <div className="w-8 h-[3px] bg-white rounded-full mx-auto mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            )}
          </button>
        </div>

        {/* Right: Search & Sound Mute Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition cursor-pointer border border-white/10"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-zinc-300" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 text-white/90 hover:text-white hover:scale-110 transition cursor-pointer"
            title="Search"
          >
            <Search className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Video Canvas */}
      {currentShort && (
        <div
          className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
          onDoubleClick={() => handleDoubleTap(currentShort.id)}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {/* HTML5 Full-Cover Video */}
          <video
            ref={(el) => {
              videoRefs.current[currentIndex] = el;
            }}
            src={currentShort.videoUrl}
            poster={currentShort.posterUrl}
            loop
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover sm:object-contain sm:max-w-[480px] bg-black"
          />

          {/* Persistent subtle 'niytee' watermark badge */}
          <div className="absolute top-16 left-4 z-20 pointer-events-none opacity-80 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-[11px] font-black tracking-widest text-white uppercase font-sans">niytee</span>
          </div>

          {/* Vignette Overlay at top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

          {/* Animated 'niytee' Ending Screen Card at every end of video */}
          <AnimatePresence>
            {showNiyteeEndCard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNiyteeEndCard(false);
                  const vid = videoRefs.current[currentIndex];
                  if (vid) {
                    vid.currentTime = 0;
                    vid.play().catch(() => {});
                  }
                }}
              >
                {/* Glowing dual-color neon background aura */}
                <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/25 via-pink-500/20 to-purple-600/25 blur-3xl pointer-events-none animate-pulse"></div>

                {/* TikTok/Nightgram style dual-dot emblem */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center space-x-2 mb-3"
                >
                  <div className="w-4 h-4 rounded-full bg-[#25F4EE] shadow-[0_0_16px_#25F4EE]"></div>
                  <div className="w-4 h-4 rounded-full bg-[#FE2C55] shadow-[0_0_16px_#FE2C55]"></div>
                </motion.div>

                {/* Prominent 'niytee' word display */}
                <motion.h1
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  className="text-4xl sm:text-5xl font-black tracking-[0.25em] lowercase text-white drop-shadow-[0_0_35px_rgba(37,244,238,0.9)] mb-2 font-sans"
                >
                  niytee
                </motion.h1>

                {/* Creator tag */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs sm:text-sm font-semibold text-zinc-300 tracking-wide mb-6"
                >
                  by <span className="text-cyan-400 font-bold">@{currentShort.creator.username}</span>
                </motion.p>

                {/* Action quick buttons on end card */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-3"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNiyteeEndCard(false);
                      const vid = videoRefs.current[currentIndex];
                      if (vid) {
                        vid.currentTime = 0;
                        vid.play().catch(() => {});
                      }
                    }}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs tracking-wider uppercase transition active:scale-95 flex items-center space-x-1.5 shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Replay</span>
                  </button>

                  {currentIndex < shorts.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNiyteeEndCard(false);
                        handleNextVideo();
                      }}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] text-black font-extrabold text-xs tracking-wider uppercase transition hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,244,238,0.5)]"
                    >
                      Next Video ↓
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Double Tap Heart Pop Animation */}
          <AnimatePresence>
            {doubleTappedHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0.5, 1.4, 1.1], opacity: [0, 1, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <Heart className="w-32 h-32 text-[#fe2c55] fill-[#fe2c55] drop-shadow-[0_0_30px_rgba(254,44,85,0.9)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cyan & Pink TikTok-style Loading / Buffering Dots in Center */}
          {isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-25">
              <div className="flex items-center space-x-1.5 animate-pulse">
                <div className="w-3.5 h-3.5 rounded-full bg-[#25F4EE] shadow-[0_0_12px_#25F4EE]"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-[#FE2C55] shadow-[0_0_12px_#FE2C55]"></div>
              </div>
            </div>
          )}

          {/* Center Pause Indicator */}
          {!isPlaying && !isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20">
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
                <Play className="w-10 h-10 fill-white ml-1 text-white" />
              </div>
            </div>
          )}

          {/* Right Action Column matching the exact format of the uploaded TikTok screen */}
          <div
            className="absolute right-3 sm:right-6 bottom-8 z-30 flex flex-col items-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Creator Avatar with Red '+' follow badge */}
            <div className="relative mb-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden p-[1px] bg-black shadow-lg">
                <img
                  src={currentShort.creator.avatar}
                  alt={currentShort.creator.username}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Follow '+' Badge overlapping bottom center of avatar */}
              {!currentShort.creator.isFollowing ? (
                <button
                  onClick={() => handleFollowToggle(currentShort.creator.username)}
                  className="absolute -bottom-2 w-5 h-5 rounded-full bg-[#fe2c55] text-white flex items-center justify-center shadow-[0_0_10px_rgba(254,44,85,0.7)] hover:scale-110 active:scale-95 transition cursor-pointer"
                  title="Follow creator"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              ) : (
                <div className="absolute -bottom-2 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* 2. Heart / Like Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleLike(currentShort.id)}
                className="p-1 active:scale-75 transition-transform cursor-pointer"
                title="Like"
              >
                <Heart
                  className={`w-9 h-9 stroke-[1.5] transition-colors duration-200 drop-shadow-lg ${
                    currentShort.isLiked
                      ? 'text-[#fe2c55] fill-[#fe2c55] drop-shadow-[0_0_14px_rgba(254,44,85,0.8)]'
                      : 'text-white fill-transparent hover:text-zinc-200'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-tight">
                {formatCount(currentShort.likes)}
              </span>
            </div>

            {/* 3. Comment Bubble Button with 3 dots */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowCommentsModal(true)}
                className="p-1 active:scale-75 transition-transform cursor-pointer"
                title="Comments"
              >
                {/* TikTok style comment bubble with 3 dots */}
                <div className="relative">
                  <MessageSquare className="w-9 h-9 text-white stroke-[1.5] drop-shadow-lg" />
                  <div className="absolute inset-0 flex items-center justify-center space-x-0.5 pt-0.5">
                    <span className="w-1 h-1 rounded-full bg-white"></span>
                    <span className="w-1 h-1 rounded-full bg-white"></span>
                    <span className="w-1 h-1 rounded-full bg-white"></span>
                  </div>
                </div>
              </button>
              <span className="text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-tight">
                {currentShort.commentsCount}
              </span>
            </div>

            {/* 4. Bookmark / Save Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleSave(currentShort.id)}
                className="p-1 active:scale-75 transition-transform cursor-pointer"
                title="Save"
              >
                <Bookmark
                  className={`w-9 h-9 stroke-[1.5] transition-colors drop-shadow-lg ${
                    currentShort.isSaved
                      ? 'text-[#face15] fill-[#face15] drop-shadow-[0_0_12px_rgba(250,206,21,0.7)]'
                      : 'text-white fill-transparent hover:text-zinc-200'
                  }`}
                />
              </button>
              <span className="text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-tight">
                {formatCount(currentShort.savesCount || 100000)}
              </span>
            </div>

            {/* 5. Curved Share Arrow */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (onOpenChatWithUser) {
                    onOpenChatWithUser({
                      username: currentShort.creator.username,
                      displayName: currentShort.creator.displayName,
                      avatar: currentShort.creator.avatar,
                    });
                  }
                }}
                className="p-1 active:scale-75 transition-transform cursor-pointer"
                title="Share"
              >
                <Share2 className="w-8 h-8 text-white stroke-[1.8] drop-shadow-lg" />
              </button>
              <span className="text-xs font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-tight">
                Share
              </span>
            </div>

            {/* 6. Rotating Vinyl Record Album Disc */}
            <div className="pt-2 flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-full p-[3px] bg-gradient-to-tr from-[#121212] via-[#282828] to-[#121212] border border-zinc-700 shadow-2xl flex items-center justify-center ${
                  isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
              >
                {/* Vinyl inner grooves */}
                <div className="w-full h-full rounded-full border border-zinc-800 bg-[#0a0a0a] flex items-center justify-center p-[5px]">
                  <div className="w-full h-full rounded-full overflow-hidden border border-white/20">
                    <img
                      src={currentShort.posterUrl}
                      alt="album"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Meta: @username + Caption + ♫ Song name */}
          <div
            className="absolute bottom-6 left-4 right-20 sm:left-6 sm:right-28 z-30 flex flex-col space-y-2 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* @username */}
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] hover:underline cursor-pointer">
                @{currentShort.creator.username}
              </span>
            </div>

            {/* Caption & Hashtags */}
            <p className="text-sm text-white/95 font-normal leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] line-clamp-2">
              {currentShort.caption}
            </p>

            {/* Hashtag tags */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {currentShort.tags.map((tag, tIdx) => (
                <span
                  key={`full-tag-${tag}-${tIdx}`}
                  className="text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:text-cyan-300 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Audio Track marquee ticker: ♫ 0001 - Song name */}
            <div className="flex items-center space-x-2 text-white text-xs pt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-xs sm:max-w-sm">
              <Music className="w-3.5 h-3.5 flex-shrink-0 text-white stroke-[2]" />
              <div className="overflow-hidden whitespace-nowrap w-full">
                <span className="inline-block font-medium tracking-wide">
                  ♫ {currentShort.audioTrack.codeNumber || '0001'} - {currentShort.audioTrack.title}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Up / Down Arrow Helpers */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col space-y-3">
        <button
          onClick={handlePrevVideo}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/80 hover:scale-110 transition shadow-2xl cursor-pointer"
          title="Previous Video (Up Arrow)"
        >
          ▲
        </button>
        <button
          onClick={handleNextVideo}
          disabled={currentIndex === shorts.length - 1}
          className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/80 hover:scale-110 transition shadow-2xl cursor-pointer"
          title="Next Video (Down Arrow)"
        >
          ▼
        </button>
      </div>

      {/* Slide-Up Comments Drawer */}
      <AnimatePresence>
        {showCommentsModal && currentShort && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowCommentsModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#121218] border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-4 flex flex-col max-h-[75vh] shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Comments ({currentShort.commentsCount})</span>
                </h4>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Stream */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
                {(commentsList[currentShort.id] || []).length > 0 ? (
                  commentsList[currentShort.id].map((c, i) => (
                    <div key={`reel-comment-${currentShort.id}-${c.username}-${c.time || i}-${i}`} className="flex items-start space-x-3 text-xs">
                      <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-200">@{c.username}</span>
                          <span className="text-[10px] text-zinc-500">{c.time}</span>
                        </div>
                        <p className="text-zinc-300 mt-1 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-zinc-500 py-8">No comments yet. Start the conversation!</p>
                )}
              </div>

              {/* Comment Input Box */}
              <form onSubmit={handleAddCommentSubmit} className="pt-3 border-t border-zinc-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 rounded-full bg-[#fe2c55] text-white font-bold text-xs disabled:opacity-40 hover:scale-105 active:scale-95 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Drawer Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md p-4 pt-12"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-[#16161e] border border-zinc-700 rounded-2xl p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
                <Search className="w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search short videos, sounds, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
                <button onClick={() => setShowSearchModal(false)} className="text-zinc-400 hover:text-white text-xs">
                  Cancel
                </button>
              </div>

              <div className="pt-4 space-y-2 text-left">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trending Nocturnal Sounds</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['#cyberpunk', '#midnightlofi', '#tokyorain', '#perseids', '#synthwave'].map((tag, tagIndex) => (
                    <button
                      key={`trending-tag-${tag}-${tagIndex}`}
                      onClick={() => {
                        setSearchQuery(tag);
                        setShowSearchModal(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-zinc-800 text-xs text-white hover:bg-zinc-700 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
