import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Sparkles } from 'lucide-react';

interface AnimatedCommentButtonProps {
  postId: string;
  commentsCount: number;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function AnimatedCommentButton({
  postId,
  commentsCount,
  onClick,
  size = 'md',
  showCount = true,
  className = '',
}: AnimatedCommentButtonProps) {
  const [isPopping, setIsPopping] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; scale: number; angle: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger pop spring animation
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 550);

    // Generate burst particles on tap (cyan & purple floating speech bubbles/dots)
    const now = Date.now();
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: `comm-part-${postId}-${now}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      x: (Math.random() - 0.5) * 36,
      y: -12 - Math.random() * 22,
      scale: 0.6 + Math.random() * 0.4,
      angle: i * 60 + (Math.random() * 20 - 10),
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 650);

    // Call user onClick handler (opens comment bottom sheet or input)
    onClick(e);
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const dotSizes = {
    sm: 'w-0.5 h-0.5',
    md: 'w-1 h-1',
    lg: 'w-1.5 h-1.5',
  };

  return (
    <button
      type="button"
      id={`comment-btn-${postId}`}
      onClick={handleClick}
      className={`relative inline-flex items-center space-x-1.5 group cursor-pointer focus:outline-none select-none ${className}`}
      title="Comments"
    >
      <div className="relative flex items-center justify-center">
        {/* Particle Burst Particles on tap */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, scale: p.scale, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: p.scale * 1.3,
                x: Math.cos((p.angle * Math.PI) / 180) * 26,
                y: Math.sin((p.angle * Math.PI) / 180) * 26 - 10,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute pointer-events-none z-10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)] inline-block" />
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Glow halo pulse ring */}
        <AnimatePresence>
          {isPopping && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 2.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute w-6 h-6 rounded-full bg-cyan-500/30 border border-cyan-400/70 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Comment Bubble Icon with 3 Dots & Spring Bounce Animation */}
        <motion.div
          animate={
            isPopping
              ? {
                  scale: [1, 1.36, 0.88, 1.15, 1],
                  rotate: [0, -10, 8, -4, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          whileTap={{ scale: 0.75 }}
          transition={{ duration: 0.45, ease: [0.17, 0.89, 0.32, 1.28] }}
          className="relative flex items-center justify-center"
        >
          {/* Authentic 3-dots comment bubble */}
          <MessageSquare
            className={`${iconSizes[size]} text-zinc-300 group-hover:text-cyan-300 stroke-[1.75] transition-colors`}
          />
          <div className="absolute inset-0 flex items-center justify-center space-x-0.5 pt-0.5 pointer-events-none">
            <span
              className={`${dotSizes[size]} rounded-full bg-zinc-300 group-hover:bg-cyan-300 transition-colors`}
            />
            <span
              className={`${dotSizes[size]} rounded-full bg-zinc-300 group-hover:bg-cyan-300 transition-colors`}
            />
            <span
              className={`${dotSizes[size]} rounded-full bg-zinc-300 group-hover:bg-cyan-300 transition-colors`}
            />
          </div>
        </motion.div>
      </div>

      {/* Live Animated Comments Counter */}
      {showCount && (
        <motion.span
          key={`comm-count-${postId}-${commentsCount}`}
          initial={{ y: -3, opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xs font-semibold font-mono text-zinc-200 group-hover:text-cyan-300 transition-colors"
        >
          {commentsCount}
        </motion.span>
      )}
    </button>
  );
}
