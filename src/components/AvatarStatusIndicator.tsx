import React from 'react';

interface AvatarStatusIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AvatarStatusIndicator({
  isOnline,
  size = 'md',
  className = '',
}: AvatarStatusIndicatorProps) {
  const sizeClasses =
    size === 'sm'
      ? 'w-2.5 h-2.5 border-[1.5px]'
      : size === 'lg'
      ? 'w-4 h-4 border-2'
      : 'w-3.5 h-3.5 border-2';

  if (isOnline) {
    return (
      <span
        className={`absolute bottom-0 right-0 rounded-full bg-emerald-500 border-[#0a0a10] flex items-center justify-center z-10 shadow-[0_0_8px_rgba(16,185,129,0.8)] ${sizeClasses} ${className}`}
        title="Online"
      >
        <span className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
      </span>
    );
  }

  return (
    <span
      className={`absolute bottom-0 right-0 rounded-full bg-zinc-500 border-[#0a0a10] z-10 ${sizeClasses} ${className}`}
      title="Offline"
    />
  );
}
