import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smile,
  Image as ImageIcon,
  Sparkles,
  Search,
  Plus,
  Star,
  Clock,
  Coffee,
  Heart,
  X,
  Flame,
  Laugh,
  PartyPopper,
} from 'lucide-react';

export interface StickerItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface StickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: StickerItem) => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
  isContainedInChat?: boolean;
}

const MEME_STICKERS: StickerItem[] = [
  {
    id: 'stk-go-and-sleep',
    name: 'Go And Sleep 😴',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-oswade',
    name: 'Oswade 😱',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-hi-friends',
    name: 'Hi friends 👋',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-kyeyo',
    name: 'Kyeyo 💼',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-tolina-nsonyi',
    name: 'Tolina nsonyi 😜',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-laughing',
    name: 'Laughing 😂',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-shocked',
    name: 'Shocked 👀',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
  {
    id: 'stk-party',
    name: 'Night Vibe 🥳',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&auto=format&fit=crop&q=80',
    category: 'night',
  },
  {
    id: 'stk-chill',
    name: 'Neon Glow ✨',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200&auto=format&fit=crop&q=80',
    category: 'night',
  },
  {
    id: 'stk-fire',
    name: 'Pure Fire 🔥',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    category: 'reaction',
  },
];

const EMOJI_CATEGORIES = {
  recent: ['❤️', '🔥', '😂', '😍', '✨', '👏', '🙌', '💯', '🚀', '🥳'],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
    '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
  ],
  hands: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇'],
  vibes: ['🔥', '✨', '💖', '❤️', '💯', '🌟', '🎉', '🚀', '💎', '🌙', '⭐', '⚡', '☕', '🍷', '🥂', '🍾', '🕶️', '🎵'],
};

const POPULAR_GIFS = [
  { id: 'g1', title: 'Celebration', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
  { id: 'g2', title: 'Night Ride', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80' },
  { id: 'g3', title: 'Cyber Glow', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80' },
  { id: 'g4', title: 'Cheers Night', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=80' },
  { id: 'g5', title: 'Arcade Rush', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80' },
  { id: 'g6', title: 'City Lights', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&auto=format&fit=crop&q=80' },
];

export default function StickerDrawer({
  isOpen,
  onClose,
  onSelectSticker,
  onSelectEmoji,
  onSelectGif,
}: StickerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif' | 'stickers'>('stickers');
  const [stickerPack, setStickerPack] = useState<'recent' | 'favorites' | 'cuppy' | 'memes'>('memes');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredStickers = MEME_STICKERS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGifs = POPULAR_GIFS.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.2 }}
      className="bg-[#0b101b] border-t border-cyan-500/30 text-zinc-100 flex flex-col h-80 sm:h-84 shadow-[0_-10px_25px_rgba(0,0,0,0.6)] z-30 relative w-full"
      id="whatsapp-sticker-drawer"
    >
      {/* Top Search & Filter Bar (div:nth-of-type(1)) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/90 bg-[#0e1422]">
        {/* Search input container (div:nth-of-type(1) > div:nth-of-type(1)) */}
        <div className="flex items-center space-x-2.5 flex-1 bg-[#141b2d] border border-cyan-500/30 focus-within:border-cyan-400 rounded-full px-3.5 py-1.5 shadow-inner transition">
          <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={
              activeTab === 'emoji'
                ? 'Search emojis...'
                : activeTab === 'gif'
                ? 'Search GIFs...'
                : 'Search stickers...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none flex-1 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="ml-2.5 p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
          title="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area (div:nth-of-type(2)) */}
      <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin bg-[#090d16]/95">
        {activeTab === 'stickers' && (
          <div className="space-y-3">
            {/* Sticker Pack Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-zinc-400 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setStickerPack('memes')}
                  className={`px-2.5 py-1 rounded-full flex items-center space-x-1.5 cursor-pointer transition ${
                    stickerPack === 'memes'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Memes & Night</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('recent')}
                  className={`p-1.5 rounded-full flex items-center cursor-pointer transition ${
                    stickerPack === 'recent'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title="Recent"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setStickerPack('favorites')}
                  className={`p-1.5 rounded-full flex items-center cursor-pointer transition ${
                    stickerPack === 'favorites'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title="Starred"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Create Sticker button */}
              <button
                type="button"
                onClick={() => {
                  const customStk: StickerItem = {
                    id: `custom-stk-${Date.now()}`,
                    name: 'Night Spark ✨',
                    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                    category: 'custom',
                  };
                  onSelectSticker(customStk);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-900/40 to-purple-900/40 hover:from-cyan-800/60 hover:to-purple-800/60 border border-cyan-500/40 text-[11px] text-cyan-300 font-semibold cursor-pointer transition shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Create</span>
              </button>
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
              {filteredStickers.map((stk) => (
                <div
                  key={stk.id}
                  onClick={() => onSelectSticker(stk)}
                  className="group relative rounded-xl overflow-hidden bg-[#121827] border border-zinc-800 hover:border-cyan-400 cursor-pointer p-1 transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <img
                    src={stk.url}
                    alt={stk.name}
                    className="w-full h-18 object-cover rounded-lg"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[#0b101b]/90 backdrop-blur-xs p-1 text-center border-t border-zinc-800/60">
                    <span className="text-[10px] font-medium text-zinc-200 truncate block">
                      {stk.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'emoji' && (
          <div className="space-y-3.5">
            {/* Quick Favorites / Recent Row */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 mb-1.5 block">
                Top Reactions
              </span>
              <div className="grid grid-cols-10 gap-1.5 text-2xl select-none">
                {EMOJI_CATEGORIES.recent.map((emoji, idx) => (
                  <button
                    key={`rec-${idx}`}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-cyan-950/50 hover:border hover:border-cyan-500/40 flex items-center justify-center transition cursor-pointer transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Smileys */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Smileys & Moods
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 text-2xl select-none">
                {EMOJI_CATEGORIES.smileys.map((emoji, idx) => (
                  <button
                    key={`sml-${idx}`}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-800/80 flex items-center justify-center transition cursor-pointer transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Night & Vibes
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 text-2xl select-none">
                {EMOJI_CATEGORIES.vibes.map((emoji, idx) => (
                  <button
                    key={`vb-${idx}`}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-800/80 flex items-center justify-center transition cursor-pointer transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gif' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredGifs.map((gif) => (
              <div
                key={gif.id}
                onClick={() => onSelectGif(gif.url)}
                className="group relative rounded-xl overflow-hidden h-26 bg-[#121827] border border-zinc-800 hover:border-cyan-400 cursor-pointer transition shadow-md"
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  GIF: {gif.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Switcher: EMOJI | GIF | STICKERS */}
      <div className="flex items-center justify-around py-2.5 bg-[#0e1422] border-t border-zinc-800/90 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('emoji')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full cursor-pointer transition ${
            activeTab === 'emoji'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>EMOJIS</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gif')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full cursor-pointer transition ${
            activeTab === 'gif'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>GIFS</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stickers')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full cursor-pointer transition ${
            activeTab === 'stickers'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>STICKERS</span>
        </button>
      </div>
    </motion.div>
  );
}
