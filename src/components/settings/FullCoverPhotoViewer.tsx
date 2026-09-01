import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FullCoverPhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
}

export default function FullCoverPhotoViewer({
  isOpen,
  onClose,
  avatarUrl,
}: FullCoverPhotoViewerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-2 sm:p-4 text-white cursor-pointer"
        id="full-cover-photo-viewer"
      >
        {/* Minimal Floating Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2.5 bg-black/60 hover:bg-zinc-800/90 rounded-full border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer active:scale-95 shadow-lg backdrop-blur-md"
          title="Close Photo"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Pure Centered Photo with responsive scaling */}
        <div
          className="w-full h-full flex items-center justify-center p-2 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-full max-h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-cyan-500/20 bg-zinc-950 flex items-center justify-center"
          >
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000'}
              alt="Profile Photo"
              className="w-auto h-auto max-w-[92vw] max-h-[88vh] sm:max-w-[80vw] sm:max-h-[85vh] object-contain rounded-2xl sm:rounded-3xl"
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
