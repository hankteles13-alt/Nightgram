import React from 'react';
import { Eye, Zap, MousePointer, Volume2, Check } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface AccessibilitySettingsProps {
  highContrast: boolean;
  onToggleHighContrast: () => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  largeTouchTargets: boolean;
  onToggleLargeTouchTargets: () => void;
}

export default function AccessibilitySettings({
  highContrast,
  onToggleHighContrast,
  reduceMotion,
  onToggleReduceMotion,
  largeTouchTargets,
  onToggleLargeTouchTargets,
}: AccessibilitySettingsProps) {
  return (
    <div className="p-4 space-y-4 text-zinc-200" id="settings-accessibility-page">
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* High Contrast */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="pr-2">
            <h5 className="text-xs font-semibold text-zinc-200">High Contrast Mode</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Increases visual border brightness and text legibility</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleHighContrast();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              highContrast ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduce Motion */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="pr-2">
            <h5 className="text-xs font-semibold text-zinc-200">Reduce Motion</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Minimizes spring animations and sliding transitions</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleReduceMotion();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              reduceMotion ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                reduceMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Large Touch Targets */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="pr-2">
            <h5 className="text-xs font-semibold text-zinc-200">Large Touch Targets</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enlarges buttons and interactive tap areas to 48px+</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleLargeTouchTargets();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              largeTouchTargets ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                largeTouchTargets ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
