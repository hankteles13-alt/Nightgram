import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface AnimatedLikeButtonProps {
  postId: string;
  isLiked: boolean;
  likesCount: number;
  onLike: (postId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function AnimatedLikeButton({
  postId,
  isLiked,
  likesCount,
  onLike,
  size = 'md',
  showCount = true,
  className = '',
}: AnimatedLikeButtonProps) {
  const [isPopping, setIsPopping] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; scale: number; angle: number }>>([]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(postId);

    // Trigger pop animation
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 600);

    // Generate burst particles if becoming liked
    if (!isLiked) {
      const now = Date.now();
      const newParticles = Array.from({ length: 6 }).map((_, i) => ({
        id: `${postId}-part-${now}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        x: (Math.random() - 0.5) * 40,
        y: -15 - Math.random() * 25,
        scale: 0.5 + Math.random() * 0.5,
        angle: (i * 60) + (Math.random() * 20 - 10),
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 700);
    }
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
  };

  return (
    <button
      type="button"
      id={`like-btn-${postId}`}
      onClick={handleClick}
      className={`relative inline-flex items-center space-x-1.5 group cursor-pointer focus:outline-none select-none ${className}`}
      title={isLiked ? 'Unlike' : 'Like post'}
    >
      <div className="relative flex items-center justify-center">
        {/* Particle Burst Particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, scale: p.scale, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: p.scale * 1.3,
                x: Math.cos((p.angle * Math.PI) / 180) * 24,
                y: Math.sin((p.angle * Math.PI) / 180) * 24 - 12,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute pointer-events-none z-10"
            >
              <Heart className="w-2.5 h-2.5 text-fuchsia-400 fill-fuchsia-400 drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Glow halo ring behind heart when liked */}
        <AnimatePresence>
          {isPopping && !isLiked && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute w-6 h-6 rounded-full bg-fuchsia-500/30 border border-fuchsia-400/80 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Heart Icon with Pop Spring Animation */}
        <motion.div
          animate={
            isPopping
              ? {
                  scale: [1, 1.42, 0.88, 1.18, 1],
                  rotate: [0, -12, 10, -5, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          whileTap={{ scale: 0.8 }}
          transition={{ duration: 0.45, ease: [0.17, 0.89, 0.32, 1.28] }}
        >
          <Heart
            className={`${iconSizes[size]} transition-colors duration-300 ${
              isLiked
                ? 'text-fuchsia-500 fill-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.6)]'
                : 'text-zinc-400 group-hover:text-fuchsia-400'
            }`}
          />
        </motion.div>
      </div>

      {/* Animated Likes Counter */}
      {showCount && (
        <motion.span
          key={`like-count-${postId}-${likesCount}`}
          initial={{ y: -3, opacity: 0.7 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-xs font-semibold tracking-wide transition-colors ${
            isLiked ? 'text-fuchsia-400' : 'text-zinc-500 group-hover:text-zinc-300'
          }`}
        >
          {likesCount}
        </motion.span>
      )}
    </button>
  );
}
