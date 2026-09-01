import React from 'react';
import { motion } from 'motion/react';
import {
  Image as ImageIcon,
  Camera,
  MapPin,
  User,
  FileText,
  BarChart2,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react';

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'gallery' | 'camera' | 'location' | 'contact' | 'document' | 'poll' | 'event' | 'ai_images') => void;
  onSelectQuickMedia?: (imageUrl: string) => void;
  containedInChat?: boolean;
}

const QUICK_MEDIA_GALLERY = [
  {
    id: 'qm-1',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    title: 'Tokyo Night',
    duration: '1:34',
  },
  {
    id: 'qm-2',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&auto=format&fit=crop&q=80',
    title: 'Neon Walk',
    duration: '0:45',
  },
  {
    id: 'qm-3',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&auto=format&fit=crop&q=80',
    title: 'Galaxies',
    duration: '2:15',
  },
  {
    id: 'qm-4',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
    title: 'Arcade',
    duration: '1:10',
  },
];

export default function AttachmentBottomSheet({
  isOpen,
  onClose,
  onSelectAction,
  onSelectQuickMedia,
  containedInChat = true,
}: AttachmentBottomSheetProps) {
  if (!isOpen) return null;

  const actions = [
    { id: 'document', label: 'Document', icon: FileText, color: 'bg-[#7f66ff]', text: 'text-white' },
    { id: 'camera', label: 'Camera', icon: Camera, color: 'bg-[#ff2e74]', text: 'text-white' },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, color: 'bg-[#bf59cf]', text: 'text-white' },
    { id: 'location', label: 'Location', icon: MapPin, color: 'bg-[#00c982]', text: 'text-white' },
    { id: 'contact', label: 'Contact', icon: User, color: 'bg-[#0088cc]', text: 'text-white' },
    { id: 'poll', label: 'Poll', icon: BarChart2, color: 'bg-[#ffb020]', text: 'text-white' },
    { id: 'event', label: 'Event', icon: Calendar, color: 'bg-[#ff7043]', text: 'text-white' },
    { id: 'ai_images', label: 'AI images', icon: Sparkles, color: 'bg-cyan-500', text: 'text-zinc-950' },
  ];

  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col justify-end bg-black/70 backdrop-blur-xs`}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-[#0e1422] border-t border-cyan-500/30 rounded-t-3xl p-4 pb-6 shadow-2xl space-y-4"
        id="whatsapp-attachment-tray"
      >
        {/* Drag handle pill */}
        <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto" />

        {/* 8-Icon Grid */}
        <div className="grid grid-cols-4 gap-y-4 gap-x-2 pt-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                id={`attachment-action-${act.id}`}
                onClick={() => {
                  onSelectAction(act.id as any);
                  onClose();
                }}
                className="flex flex-col items-center space-y-1.5 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full ${act.color} flex items-center justify-center shadow-lg transform group-hover:scale-108 active:scale-95 transition duration-150`}
                >
                  <Icon className={`w-5 h-5 ${act.text}`} />
                </div>
                <span className="text-[11px] font-medium text-zinc-300 group-hover:text-cyan-300 transition">
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Media Strip */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between pb-2 text-[11px] text-zinc-400 font-medium">
            <span>Recent Nightgram Media</span>
            <button
              type="button"
              onClick={() => {
                onSelectAction('gallery');
                onClose();
              }}
              className="text-cyan-400 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex items-center space-x-2.5 overflow-x-auto scrollbar-none pb-1">
            {QUICK_MEDIA_GALLERY.map((media) => (
              <div
                key={media.id}
                onClick={() => {
                  if (onSelectQuickMedia) onSelectQuickMedia(media.url);
                  onClose();
                }}
                className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-zinc-700 hover:border-cyan-400 cursor-pointer group shadow-md"
              >
                <img
                  src={media.url}
                  alt={media.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition" />
                <span className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[9px] font-mono text-cyan-200">
                  {media.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
