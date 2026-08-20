import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, UserProfile } from '../types';
import { X, ChevronLeft, ChevronRight, Moon } from 'lucide-react';

interface StoriesSectionProps {
  stories: Story[];
  currentUser?: UserProfile | null;
  onOpenCreateStory?: () => void;
}

export default function StoriesSection({ stories, currentUser, onOpenCreateStory }: StoriesSectionProps) {
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Auto-advance stories
  useEffect(() => {
    if (activeStoryIdx === null) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next story or close
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
    }, 40); // 100 * 40ms = 4 seconds per story

    return () => clearInterval(interval);
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

  return (
    <div className="w-full py-3 px-3 border-b border-zinc-800/80 bg-[#000000]/60 backdrop-blur-md" id="stories-tray-container">
      {/* Stories horizontal bar */}
      <div className="flex space-x-4 overflow-x-auto pb-1 scrollbar-none items-center" id="stories-scroll-wrapper">
        {/* Current user's add story option */}
        <div
          className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
          id="user-story-bubble"
          onClick={onOpenCreateStory}
        >
          <div className="relative">
            <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-zinc-800/80 group-hover:bg-zinc-700 transition-all duration-300">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt="Your story"
                className="w-full h-full object-cover rounded-full border-2 border-black"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095f6] border-2 border-black flex items-center justify-center text-xs text-white font-bold shadow-md">
              +
            </div>
          </div>
          <span className="text-[11px] text-zinc-300 font-normal tracking-tight max-w-[70px] truncate text-center">
            your story
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
              <span className="text-[11px] text-zinc-300 font-normal tracking-tight max-w-[68px] truncate text-center group-hover:text-white transition-colors duration-200">
                {story.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Full screen active story view */}
      <AnimatePresence>
        {activeStoryIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="story-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black w-full h-full p-0 overflow-hidden"
            onClick={() => setActiveStoryIdx(null)}
          >
            <div
              id="story-modal-card"
              className="relative w-full h-full max-w-none md:max-w-2xl bg-black flex flex-col justify-between overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Story visual background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={stories[activeStoryIdx].mediaUrl}
                  alt="Story Content"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Dark atmospheric overlays */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              </div>

              {/* Top controls and progress bar */}
              <div className="relative z-10 p-4 w-full" id="story-top-panel">
                {/* Multi-story progress bars */}
                <div className="flex space-x-1 mb-4" id="story-progress-indicator">
                  {stories.map((_, idx) => (
                    <div key={`story-progress-bar-${idx}`} className="h-1 flex-1 bg-zinc-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-75 ease-linear"
                        style={{
                          width:
                            idx < activeStoryIdx
                              ? '100%'
                              : idx === activeStoryIdx
                              ? `${progress}%`
                              : '0%',
                        }}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* User details and actions */}
                <div className="flex items-center justify-between" id="story-header-details">
                  <div className="flex items-center space-x-3">
                    <img
                      src={stories[activeStoryIdx].userAvatar}
                      alt={stories[activeStoryIdx].username}
                      className="w-9 h-9 object-cover rounded-full border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white drop-shadow">
                        {stories[activeStoryIdx].username}
                      </h4>
                      {stories[activeStoryIdx].mood && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {stories[activeStoryIdx].mood}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    id="story-close-btn"
                    onClick={() => setActiveStoryIdx(null)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tapping split controls for navigation */}
              <div className="absolute inset-y-0 inset-x-0 flex z-0" id="story-tap-navigation">
                <div
                  id="story-nav-left-tap"
                  onClick={handlePrev}
                  className="w-1/3 h-full cursor-west-resize"
                ></div>
                <div
                  id="story-nav-right-tap"
                  onClick={handleNext}
                  className="w-2/3 h-full cursor-east-resize"
                ></div>
              </div>

              {/* Keyboard/desktop navigation side arrows */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex z-20" id="story-nav-left-btn-container">
                <button
                  id="story-prev-arrow"
                  disabled={activeStoryIdx === 0}
                  onClick={handlePrev}
                  className={`p-2 rounded-full bg-black/40 text-white border border-zinc-800 transition ${
                    activeStoryIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-900/80 hover:scale-110'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex z-20" id="story-nav-right-btn-container">
                <button
                  id="story-next-arrow"
                  onClick={handleNext}
                  className="p-2 rounded-full bg-black/40 text-white border border-zinc-800 hover:bg-zinc-900/80 hover:scale-110 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom text block */}
              <div className="relative z-10 p-6 md:p-8 text-center" id="story-bottom-text-container">
                <motion.p
                  key={`story-active-caption-${activeStoryIdx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg md:text-xl font-medium text-zinc-100 drop-shadow-lg tracking-wide leading-relaxed font-sans max-w-sm mx-auto"
                >
                  "{stories[activeStoryIdx].caption}"
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
