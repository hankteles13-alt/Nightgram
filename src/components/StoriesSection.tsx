import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Story, UserProfile } from '../types';
import { X, ChevronLeft, ChevronRight, Heart, Send, Music, Volume2, VolumeX } from 'lucide-react';

interface StoriesSectionProps {
  stories: Story[];
  currentUser?: UserProfile | null;
  onOpenCreateStory?: () => void;
}

export default function StoriesSection({ stories, currentUser, onOpenCreateStory }: StoriesSectionProps) {
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLikedStory, setIsLikedStory] = useState<{ [storyId: string]: boolean }>({});
  const [storyReplyText, setStoryReplyText] = useState('');
  const [sentReplyNotice, setSentReplyNotice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance stories with pause support
  useEffect(() => {
    if (activeStoryIdx === null) return;

    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (isPaused) return;
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIdx < stories.length - 1) {
            setActiveStoryIdx(activeStoryIdx + 1);
            return 0;
          } else {
            setActiveStoryIdx(null);
            return 0;
          }
        }
        return prev + 1;
      });
    }, 45);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeStoryIdx, isPaused, stories.length]);

  // Keyboard navigation support (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (activeStoryIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStoryIdx(null);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        if (activeStoryIdx < stories.length - 1) {
          setActiveStoryIdx(activeStoryIdx + 1);
        } else {
          setActiveStoryIdx(null);
        }
      } else if (e.key === 'ArrowLeft') {
        if (activeStoryIdx > 0) {
          setActiveStoryIdx(activeStoryIdx - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIdx, stories.length]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeStoryIdx === null) return;
    if (activeStoryIdx < stories.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
    } else {
      setActiveStoryIdx(null);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeStoryIdx === null) return;
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
    }
  };

  const handleHeartClick = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLikedStory((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyReplyText.trim()) return;
    setSentReplyNotice(true);
    setStoryReplyText('');
    setTimeout(() => setSentReplyNotice(false), 2000);
  };

  return (
    <div className="w-full py-3 px-3 sm:px-4 border border-zinc-800/80 bg-[#07070d]/80 backdrop-blur-md rounded-2xl shadow-xl" id="stories-tray-container">
      {/* Stories horizontal bar */}
      <div className="flex space-x-3.5 sm:space-x-4 overflow-x-auto pb-0.5 scrollbar-none items-center w-full" id="stories-scroll-wrapper">
        {/* Current user's add story option */}
        <div
          className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
          id="user-story-bubble"
          onClick={onOpenCreateStory}
        >
          <div className="relative">
            <div className="w-[66px] h-[66px] rounded-full p-[2.5px] bg-zinc-800 group-hover:bg-zinc-700 transition-all duration-200">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt="Your story"
                className="w-full h-full object-cover rounded-full border-2 border-black"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-cyan-500 border-2 border-black flex items-center justify-center text-xs text-zinc-950 font-bold shadow-md">
              +
            </div>
          </div>
          <span className="text-[11px] text-zinc-300 font-normal tracking-tight max-w-[66px] truncate text-center">
            Your story
          </span>
        </div>

        {/* Other active stories with iconic Instagram gradient story ring */}
        {stories.map((story, index) => {
          const storyAvatar =
            currentUser && (story.userId === currentUser.uid || story.username === currentUser.username)
              ? currentUser.avatar
              : story.userAvatar;

          return (
            <div
              key={`${story.id}-${index}`}
              id={`story-bubble-${story.id}`}
              onClick={() => setActiveStoryIdx(index)}
              className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
            >
              <div className="relative">
                {/* Iconic Instagram Gradient Story Ring (warm pink to purple to orange gradient) */}
                <div className="w-[66px] h-[66px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] transition-all duration-300 group-hover:scale-105 shadow-[0_0_12px_rgba(221,42,123,0.35)]">
                  <div className="w-full h-full rounded-full p-[2px] bg-black">
                    <img
                      src={storyAvatar}
                      alt={story.username}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-zinc-300 font-normal tracking-tight max-w-[66px] truncate text-center group-hover:text-white transition-colors duration-200">
                {story.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full screen active story view matching original Instagram story viewer size and layout */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {activeStoryIdx !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                id="story-modal-overlay"
                className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090b]/95 backdrop-blur-xl overflow-hidden select-none"
                onClick={() => setActiveStoryIdx(null)}
              >
                {/* Top Instagram / Nightgram Brand & Close in Top-Left and Top-Right */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between z-40 pointer-events-none">
                  <div className="pointer-events-auto flex items-center space-x-2 text-white font-bold tracking-wider text-base sm:text-lg drop-shadow">
                    <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      NIGHTGRAM
                    </span>
                  </div>
                  <button
                    id="story-global-close-btn"
                    onClick={() => setActiveStoryIdx(null)}
                    className="pointer-events-auto p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer backdrop-blur-md"
                    title="Close story"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Main Story Container with standard 9:16 aspect ratio card on desktop, full screen on mobile */}
                <div className="relative flex items-center justify-center w-full h-full sm:py-6">
                  {/* Left Side Navigation Button (Desktop) */}
                  <div className="hidden sm:flex absolute left-6 md:left-12 lg:left-24 z-40">
                    <button
                      disabled={activeStoryIdx === 0}
                      onClick={handlePrev}
                      className={`p-3.5 rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-2xl transition cursor-pointer ${
                        activeStoryIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/30 hover:scale-110 active:scale-95'
                      }`}
                      title="Previous Story"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </div>

                  {/* 9:16 Aspect Ratio Story Card */}
                  <div
                    id="story-modal-card"
                    className="relative w-full h-full sm:h-[90vh] sm:max-h-[860px] sm:w-[420px] sm:rounded-2xl bg-[#000000] border-0 sm:border sm:border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                  >
                    {/* Story Media Background filling 9:16 container */}
                    <div className="absolute inset-0 z-0 bg-black">
                      <img
                        src={stories[activeStoryIdx].mediaUrl}
                        alt="Story Content"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Atmospheric gradient overlays */}
                      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />
                    </div>

                    {/* Floating Hearts Reaction Animation */}
                    <div className="absolute inset-0 pointer-events-none z-30 flex items-end justify-center pb-24">
                      {floatingHearts.map((h) => (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 1, y: 0, scale: 1, x: h.x }}
                          animate={{ opacity: 0, y: -200, scale: 1.8 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="absolute"
                        >
                          <Heart className="w-10 h-10 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Top controls and progress bar */}
                    <div className="relative z-10 p-3.5 w-full space-y-2.5" id="story-top-panel">
                      {/* Multi-story progress bars */}
                      <div className="flex space-x-1.5" id="story-progress-indicator">
                        {stories.map((stItem, idx) => (
                          <div key={`story-progress-bar-${stItem.id || 'st'}-${idx}`} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-75 ease-linear rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                              style={{
                                width:
                                  idx < activeStoryIdx
                                    ? '100%'
                                    : idx === activeStoryIdx
                                    ? `${progress}%`
                                    : '0%',
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* User details, music info and actions */}
                      <div className="flex items-center justify-between" id="story-header-details">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={stories[activeStoryIdx].userAvatar}
                            alt={stories[activeStoryIdx].username}
                            className="w-8 h-8 object-cover rounded-full border border-white/50 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs sm:text-sm font-semibold text-white drop-shadow truncate">
                                {stories[activeStoryIdx].username}
                              </h4>
                              <span className="text-[11px] text-white/70 font-mono">13h</span>
                            </div>
                            <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-white/90 truncate">
                              <Music className="w-2.5 h-2.5 flex-shrink-0 animate-pulse" />
                              <span className="truncate">
                                {stories[activeStoryIdx].mood
                                  ? `Walking Trophy • ${stories[activeStoryIdx].mood}`
                                  : 'Tina (Hoodcelebrityy) • Walking Trophy'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition cursor-pointer"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <button
                            id="story-close-btn"
                            onClick={() => setActiveStoryIdx(null)}
                            className="sm:hidden p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tapping split controls for navigation (Left 35% / Right 65%) */}
                    <div className="absolute inset-y-0 inset-x-0 flex z-0" id="story-tap-navigation">
                      <div
                        id="story-nav-left-tap"
                        onClick={handlePrev}
                        className="w-1/3 h-full cursor-pointer"
                      />
                      <div
                        id="story-nav-right-tap"
                        onClick={handleNext}
                        className="w-2/3 h-full cursor-pointer"
                      />
                    </div>

                    {/* Bottom Caption & Interactive Reply Bar */}
                    <div className="relative z-10 p-4 space-y-3 w-full" id="story-bottom-panel">
                      {/* Caption */}
                      {stories[activeStoryIdx].caption && (
                        <motion.p
                          key={`story-active-caption-${activeStoryIdx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs sm:text-sm font-medium text-white/95 drop-shadow text-center"
                        >
                          {stories[activeStoryIdx].caption}
                        </motion.p>
                      )}

                      {/* Reply bar matching original Instagram story reply pill */}
                      <form
                        onSubmit={handleSendReply}
                        className="flex items-center space-x-2 bg-black/50 backdrop-blur-md border border-white/30 rounded-full px-3.5 py-2"
                      >
                        <input
                          type="text"
                          placeholder={`Reply to ${stories[activeStoryIdx].username}...`}
                          value={storyReplyText}
                          onChange={(e) => setStoryReplyText(e.target.value)}
                          className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/60 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleHeartClick(stories[activeStoryIdx].id, e)}
                          className="text-white/80 hover:text-rose-500 p-1 transition cursor-pointer"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              isLikedStory[stories[activeStoryIdx].id] ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="submit"
                          disabled={!storyReplyText.trim()}
                          className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30 transition p-1 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                      {sentReplyNotice && (
                        <div className="text-center text-[11px] font-semibold text-cyan-300 animate-fade-in">
                          Message sent to {stories[activeStoryIdx].username} ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Navigation Button (Desktop) */}
                  <div className="hidden sm:flex absolute right-6 md:right-12 lg:right-24 z-40">
                    <button
                      onClick={handleNext}
                      className="p-3.5 rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/30 hover:scale-110 active:scale-95 transition cursor-pointer"
                      title="Next Story"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
