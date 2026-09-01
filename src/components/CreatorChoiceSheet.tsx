import React from 'react';
import { motion } from 'motion/react';
import { Film, Image as ImageIcon, Sparkles, X, Plus, Radio, Music } from 'lucide-react';

interface CreatorChoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShort: () => void;
  onSelectPost: () => void;
  onSelectStory: () => void;
}

export default function CreatorChoiceSheet({
  isOpen,
  onClose,
  onSelectShort,
  onSelectPost,
  onSelectStory,
}: CreatorChoiceSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
      id="creator-choice-sheet-overlay"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full max-w-lg bg-[#0c0c14] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col space-y-4"
        onClick={(e) => e.stopPropagation()}
        id="creator-choice-sheet-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-zinc-950 font-black shadow-md">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Create New Content</h3>
              <p className="text-xs text-zinc-400">Choose what you want to share with the Midnight Lounge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            id="close-creator-choice-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Action Cards */}
        <div className="grid grid-cols-1 gap-3 pt-1">
          {/* 1. Short Video / Reel */}
          <button
            type="button"
            id="create-short-choice-btn"
            onClick={() => {
              onClose();
              onSelectShort();
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-zinc-900/80 to-purple-950/40 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-lg group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-zinc-950 shadow-md group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                    Short Video / Reel
                  </h4>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-400 text-zinc-950">
                    9:16 Vertical
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                  Upload clip, record with camera, pick soundtrack & sound code
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:bg-cyan-400 group-hover:text-zinc-950 transition">
              →
            </div>
          </button>

          {/* 2. Photo / Feed Post */}
          <button
            type="button"
            id="create-post-choice-btn"
            onClick={() => {
              onClose();
              onSelectPost();
            }}
            className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-md group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                  Photo / Image Post
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                  Share feed photos with custom mood vibes, voice captions & tags
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:bg-white group-hover:text-zinc-950 transition">
              →
            </div>
          </button>

          {/* 3. 24h Story */}
          <button
            type="button"
            id="create-story-choice-btn"
            onClick={() => {
              onClose();
              onSelectStory();
            }}
            className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-md group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-purple-400 group-hover:border-purple-400 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                  24h Story
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                  Disappearing 24h story with neon filters, stickers & glow text
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:bg-purple-400 group-hover:text-zinc-950 transition">
              →
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
