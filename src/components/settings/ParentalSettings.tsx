import React, { useState } from 'react';
import { Shield, Clock, Moon, Lock, Check, Smartphone, QrCode } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface ParentalSettingsProps {
  parentalControlsEnabled: boolean;
  onToggleParentalControls: () => void;
  screenTimeLimitMinutes: number;
  onChangeScreenTimeLimit: (mins: number) => void;
  bedtimeLimitEnabled: boolean;
  onToggleBedtimeLimit: () => void;
  contentFilter: boolean;
  onToggleContentFilter: () => void;
  parentalPin: string;
  onSetParentalPin: (pin: string) => void;
}

export default function ParentalSettings({
  parentalControlsEnabled,
  onToggleParentalControls,
  screenTimeLimitMinutes,
  onChangeScreenTimeLimit,
  bedtimeLimitEnabled,
  onToggleBedtimeLimit,
  contentFilter,
  onToggleContentFilter,
  parentalPin,
  onSetParentalPin,
}: ParentalSettingsProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      onSetParentalPin(pinInput);
      setShowPinModal(false);
      playSoundEffect('sent');
      alert('Parental 4-digit PIN saved.');
    } else {
      alert('PIN must be exactly 4 digits.');
    }
  };

  return (
    <div className="p-4 space-y-4" id="settings-parental-page">
      {/* Header Banner */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Parental Controls & Family Safety</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Manage screen time, schedule bedtime limits, and apply content filters.
          </p>
        </div>
      </div>

      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* Enable Parental Controls */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Parental Safety Controls</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enforce limits and require PIN for sensitive settings</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleParentalControls();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              parentalControlsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                parentalControlsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Daily Screen Time Limit */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Daily Screen Time Limit</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">
              {screenTimeLimitMinutes === 0 ? 'No limit (Off)' : `${screenTimeLimitMinutes} minutes per day`}
            </p>
          </div>
          <select
            value={screenTimeLimitMinutes}
            onChange={(e) => {
              onChangeScreenTimeLimit(Number(e.target.value));
              playSoundEffect('pop');
            }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
          >
            <option value={0}>Off</option>
            <option value={30}>30 mins</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </div>

        {/* Bedtime Lock Limit */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Bedtime Downtime</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Mutes alerts & dims feed between 10:00 PM – 7:00 AM</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleBedtimeLimit();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              bedtimeLimitEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                bedtimeLimitEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Content Filter (Safe Search) */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Safe Search & Content Filter</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Automatically filters mature imagery & links</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleContentFilter();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              contentFilter ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                contentFilter ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4-digit PIN */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Parental PIN Protection</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {parentalPin ? '•••• (PIN Configured)' : 'No PIN set'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="text-xs text-cyan-400 font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
          >
            {parentalPin ? 'Change PIN' : 'Set PIN'}
          </button>
        </div>
      </div>

      {/* Modal: Set PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Enter 4-Digit Parental PIN</h4>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full text-center tracking-widest text-lg font-mono bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
