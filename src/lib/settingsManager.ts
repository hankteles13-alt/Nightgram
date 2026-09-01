import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface CustomList {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

export interface AppSettings {
  // Appearance
  isTrueBlack: boolean;
  accentColor: string; // 'cyan' | 'emerald' | 'purple' | 'fuchsia' | 'blue' | 'indigo' | 'teal' | 'rose' | 'amber' | 'slate' | 'lime' | 'crimson'
  fontSize: 'Small' | 'Medium' | 'Large';
  chatWallpaper: string; // 'cyber-dark' | 'neon-grid' | 'starry-nebula' | 'matrix-green' | 'classic-slate'

  // Privacy
  lastSeenOnline: 'Nobody' | 'Everyone' | 'My contacts';
  profilePhotoPrivacy: 'Everyone' | 'My contacts' | 'Nobody';
  readReceipts: boolean;
  allowCameraEffects: boolean;
  protectIpCalls: boolean;
  disappearingTimer: 'Off' | '24 hours' | '7 days' | '90 days';
  blockedUsers: string[];

  // Chats
  enterIsSend: boolean;
  mediaVisibility: boolean;
  voiceTranscripts: boolean;
  stickerSuggestions: boolean;
  chatBackupFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Manual';

  // Notifications
  conversationTones: boolean;
  reminders: boolean;
  highPriorityNotifs: boolean;
  reactionNotifs: boolean;
  notificationSound: 'chime' | 'cyber' | 'nebula' | 'bell' | 'silent';

  // Storage & Data
  mobileAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  wifiAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  roamingAutoDownload: { photos: boolean; audio: boolean; videos: boolean; documents: boolean };
  dataSaver: boolean;
  mediaQuality: 'Standard' | 'HD' | 'Data Saver';

  // Parental Controls
  parentalControlsEnabled: boolean;
  screenTimeLimitMinutes: number; // 0 = unlimited, 30, 60, 120, etc.
  bedtimeLimitEnabled: boolean;
  contentFilter: boolean;
  parentalPin: string;

  // Account & Security
  twoFactorEnabled: boolean;
  securityNotifs: boolean;
  passkeysEnabled: boolean;

  // Custom Lists / Circles
  customLists: CustomList[];

  // Accessibility
  highContrast: boolean;
  reduceMotion: boolean;
  largeTouchTargets: boolean;

  // Language
  language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'sw' | 'zh' | 'ar';
}

export const DEFAULT_SETTINGS: AppSettings = {
  isTrueBlack: true,
  accentColor: 'cyan',
  fontSize: 'Medium',
  chatWallpaper: 'cyber-dark',

  lastSeenOnline: 'Everyone',
  profilePhotoPrivacy: 'Everyone',
  readReceipts: true,
  allowCameraEffects: true,
  protectIpCalls: false,
  disappearingTimer: 'Off',
  blockedUsers: [],

  enterIsSend: false,
  mediaVisibility: true,
  voiceTranscripts: true,
  stickerSuggestions: true,
  chatBackupFrequency: 'Daily',

  conversationTones: true,
  reminders: true,
  highPriorityNotifs: true,
  reactionNotifs: true,
  notificationSound: 'chime',

  mobileAutoDownload: { photos: true, audio: false, videos: false, documents: false },
  wifiAutoDownload: { photos: true, audio: true, videos: true, documents: true },
  roamingAutoDownload: { photos: false, audio: false, videos: false, documents: false },
  dataSaver: false,
  mediaQuality: 'Standard',

  parentalControlsEnabled: false,
  screenTimeLimitMinutes: 0,
  bedtimeLimitEnabled: false,
  contentFilter: false,
  parentalPin: '',

  twoFactorEnabled: true,
  securityNotifs: true,
  passkeysEnabled: false,

  customLists: [
    { id: 'close-friends', name: 'Close Friends', emoji: '💚', count: 4 },
    { id: 'work-colleagues', name: 'Colleagues', emoji: '💼', count: 8 },
    { id: 'vip-creators', name: 'VIP Creators', emoji: '🌟', count: 2 },
  ],

  highContrast: false,
  reduceMotion: false,
  largeTouchTargets: false,

  language: 'en',
};

// Color hex lookup
export const ACCENT_COLOR_MAP: Record<string, { hex: string; glow: string; name: string }> = {
  cyan: { hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', name: 'Nightgram Cyan' },
  emerald: { hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', name: 'WhatsApp Green' },
  purple: { hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', name: 'Electric Purple' },
  fuchsia: { hex: '#d946ef', glow: 'rgba(217, 70, 239, 0.4)', name: 'Midnight Fuchsia' },
  blue: { hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', name: 'Neon Blue' },
  indigo: { hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', name: 'Deep Indigo' },
  teal: { hex: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', name: 'Cyber Teal' },
  rose: { hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', name: 'Sunset Crimson' },
  amber: { hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', name: 'Solar Amber' },
  slate: { hex: '#64748b', glow: 'rgba(100, 116, 139, 0.4)', name: 'Minimal Slate' },
  lime: { hex: '#84cc16', glow: 'rgba(132, 204, 22, 0.4)', name: 'Toxic Lime' },
  crimson: { hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', name: 'Vampire Red' },
};

// Web Audio API Synth Sound Player
export function playSoundEffect(type: 'sent' | 'received' | 'chime' | 'cyber' | 'nebula' | 'bell' | 'pop' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'sent':
        // Upward pleasant pop-chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'received':
        // Dual gentle chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1050, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case 'chime':
        // Soft bell chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'cyber':
        // Cyber synth blip
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'nebula':
        // Space harmonic
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);
        osc.frequency.exponentialRampToValueAtTime(864, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'bell':
        // High crystal ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;

      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;

      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
    }
  } catch (e) {
    console.debug('Web Audio API playback skipped:', e);
  }
}

// Storage Calculator Helper
export function getStorageBreakdown() {
  try {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key]?.length || 0) * 2;
      }
    }
    const mbUsed = Math.max(0.2, totalBytes / (1024 * 1024));
    return {
      totalMb: mbUsed.toFixed(2),
      messagesMb: (mbUsed * 0.45).toFixed(2),
      mediaMb: (mbUsed * 0.4).toFixed(2),
      systemMb: (mbUsed * 0.15).toFixed(2),
    };
  } catch {
    return { totalMb: '1.80', messagesMb: '0.80', mediaMb: '0.72', systemMb: '0.28' };
  }
}
