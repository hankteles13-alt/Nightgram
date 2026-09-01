import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowDown, Check, Sparkles } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  children: React.ReactNode;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
  id?: string;
}

export default function PullToRefresh({
  onRefresh,
  isRefreshing = false,
  children,
  threshold = 70,
  maxPullDistance = 110,
  className = '',
  id = 'pull-to-refresh-container',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const wasRefreshingRef = useRef(isRefreshing);

  // When refreshing state finishes, show a brief success feedback before resetting
  useEffect(() => {
    if (wasRefreshingRef.current && !isRefreshing) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setPullDistance(0);
      }, 750);
      return () => clearTimeout(timer);
    }
    wasRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isDraggingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const rawDelta = currentY - startYRef.current;

    if (rawDelta > 0) {
      // Elastic rubber band damping
      const damped = Math.min(maxPullDistance, Math.pow(rawDelta, 0.82) * 1.8);
      setPullDistance(damped);
      setIsPulling(true);
      if (e.cancelable && rawDelta > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setPullDistance(threshold);
      onRefresh();
    } else if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  // Mouse Drag support for Desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop <= 0 && e.button === 0) {
      startYRef.current = e.clientY;
      isDraggingRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isRefreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isDraggingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    const currentY = e.clientY;
    const rawDelta = currentY - startYRef.current;

    if (rawDelta > 5) {
      const damped = Math.min(maxPullDistance, Math.pow(rawDelta, 0.82) * 1.8);
      setPullDistance(damped);
      setIsPulling(true);
    }
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setPullDistance(threshold);
      onRefresh();
    } else if (!isRefreshing) {
      setPullDistance(0);
    }
  };

  const progress = Math.min(1, pullDistance / threshold);
  const isReadyToRelease = pullDistance >= threshold;

  // Determine current active offset
  const activeOffset = isRefreshing ? 54 : showSuccess ? 44 : isPulling ? pullDistance : 0;

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative overflow-y-auto scrollbar-thin ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull down indicator banner / floating pill */}
      <div
        id="pull-refresh-indicator"
        className="absolute top-0 inset-x-0 flex items-center justify-center pointer-events-none z-30 transition-transform duration-100 ease-out"
        style={{
          height: `${threshold}px`,
          transform: `translateY(${Math.max(0, activeOffset - threshold)}px)`,
          opacity: activeOffset > 10 ? Math.min(1, activeOffset / 30) : 0,
        }}
      >
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
          {isRefreshing ? (
            <>
              {/* Spinning gradient ring */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-cyan-400 border-r-purple-500 animate-spin" />
              </div>
              <span className="text-xs font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Fetching latest posts...
              </span>
            </>
          ) : showSuccess ? (
            <>
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                Feed is up to date
              </span>
            </>
          ) : (
            <>
              <div
                className="relative w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center transition-all duration-200"
                style={{
                  transform: `rotate(${pullDistance * 4.5}deg) scale(${isReadyToRelease ? 1.15 : 1})`,
                  borderColor: isReadyToRelease ? '#06b6d4' : '#52525b',
                  boxShadow: isReadyToRelease ? '0 0 10px rgba(6,182,212,0.5)' : 'none',
                }}
              >
                {isReadyToRelease ? (
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                ) : (
                  <ArrowDown
                    className="w-3 h-3 text-zinc-400 transition-colors"
                    style={{ color: isReadyToRelease ? '#06b6d4' : '#a1a1aa' }}
                  />
                )}
              </div>
              <span
                className="text-xs font-medium transition-colors"
                style={{ color: isReadyToRelease ? '#06b6d4' : '#a1a1aa' }}
              >
                {isReadyToRelease ? 'Release to refresh feed' : 'Pull down to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main children content that shifts downwards with smooth spring */}
      <div
        id="pull-to-refresh-content"
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${activeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
