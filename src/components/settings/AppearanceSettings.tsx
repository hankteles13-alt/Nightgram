import React from 'react';
import { Check, Sparkles, Type } from 'lucide-react';
import { ACCENT_COLOR_MAP, playSoundEffect } from '../../lib/settingsManager';

export const APP_THEME_COLORS = [
  { id: 'cyan', name: 'Nightgram Cyan', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { id: 'emerald', name: 'WhatsApp Green', hex: '#10b981', bg: 'bg-emerald-500' },
  { id: 'purple', name: 'Electric Purple', hex: '#a855f7', bg: 'bg-purple-500' },
  { id: 'fuchsia', name: 'Midnight Fuchsia', hex: '#d946ef', bg: 'bg-fuchsia-500' },
  { id: 'blue', name: 'Neon Blue', hex: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#6366f1', bg: 'bg-indigo-500' },
  { id: 'teal', name: 'Cyber Teal', hex: '#14b8a6', bg: 'bg-teal-500' },
  { id: 'rose', name: 'Sunset Crimson', hex: '#f43f5e', bg: 'bg-rose-500' },
  { id: 'amber', name: 'Solar Amber', hex: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'slate', name: 'Minimal Slate', hex: '#64748b', bg: 'bg-slate-500' },
  { id: 'lime', name: 'Toxic Lime', hex: '#84cc16', bg: 'bg-lime-500' },
  { id: 'crimson', name: 'Vampire Red', hex: '#ef4444', bg: 'bg-red-500' },
];

export const CHAT_WALLPAPERS = [
  { id: 'cyber-dark', name: 'Cyber Dark', preview: 'from-zinc-950 via-zinc-900 to-black' },
  { id: 'neon-grid', name: 'Neon Grid', preview: 'from-cyan-950/40 via-purple-950/40 to-black' },
  { id: 'starry-nebula', name: 'Starry Nebula', preview: 'from-indigo-950 via-slate-900 to-zinc-950' },
  { id: 'matrix-green', name: 'Matrix Cyber', preview: 'from-emerald-950/50 via-black to-zinc-950' },
  { id: 'classic-slate', name: 'Classic Slate', preview: 'from-slate-900 via-zinc-900 to-black' },
];

interface AppearanceSettingsProps {
  isTrueBlack: boolean;
  onToggleTheme?: () => void;
  accentColor: string;
  onSelectAccentColor: (color: string) => void;
  chatWallpaper: string;
  onSelectChatWallpaper: (wallpaper: string) => void;
  fontSize: 'Small' | 'Medium' | 'Large';
  onSelectFontSize: (size: 'Small' | 'Medium' | 'Large') => void;
}

export default function AppearanceSettings({
  isTrueBlack,
  onToggleTheme,
  accentColor,
  onSelectAccentColor,
  chatWallpaper,
  onSelectChatWallpaper,
  fontSize,
  onSelectFontSize,
}: AppearanceSettingsProps) {
  const handleColorChange = (colId: string) => {
    onSelectAccentColor(colId);
    playSoundEffect('pop');
    // Set CSS variable on root for live theme accenting
    const colData = ACCENT_COLOR_MAP[colId] || ACCENT_COLOR_MAP.cyan;
    document.documentElement.style.setProperty('--accent-color', colData.hex);
    document.documentElement.style.setProperty('--accent-glow', colData.glow);
  };

  return (
    <div className="p-4 space-y-5" id="settings-appearance-page">
      {/* Dark Mode Switcher */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Dark Mode & Canvas</h4>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-zinc-100">True Black OLED Mode</span>
            <p className="text-xs text-zinc-400 mt-0.5">High-contrast pure black background</p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-12 h-6 rounded-full transition p-0.5 cursor-pointer ${
              isTrueBlack ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                isTrueBlack ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Color Theme Grid Swatches */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">App Theme Accent Color</h4>
          <span className="text-[11px] font-mono text-cyan-400 capitalize">
            {ACCENT_COLOR_MAP[accentColor]?.name || accentColor}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-1">
          {APP_THEME_COLORS.map((col) => {
            const isSelected = accentColor === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => handleColorChange(col.id)}
                className={`w-12 h-12 rounded-full ${col.bg} flex items-center justify-center transition transform hover:scale-105 relative cursor-pointer ${
                  isSelected ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'ring-1 ring-zinc-700'
                }`}
                title={col.name}
              >
                {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Wallpaper Theme */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Chat Background Theme</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {CHAT_WALLPAPERS.map((wp) => {
            const isSelected = chatWallpaper === wp.id;
            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => {
                  onSelectChatWallpaper(wp.id);
                  playSoundEffect('pop');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-20 bg-gradient-to-br ${wp.preview} cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-[11px] font-bold text-zinc-200">{wp.name}</span>
                {isSelected && (
                  <span className="self-end px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* App Font Size Scale */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Text Font Sizing</h4>
          <span className="text-[11px] font-mono text-zinc-400">{fontSize}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['Small', 'Medium', 'Large'] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                onSelectFontSize(size);
                playSoundEffect('pop');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                fontSize === size
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
