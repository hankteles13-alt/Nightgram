import React, { useState } from 'react';
import { Shield, Lock, Eye, Ban, Check, ChevronRight, X, UserX, Plus } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface PrivacySettingsProps {
  lastSeenOnline: 'Nobody' | 'Everyone' | 'My contacts';
  onChangeLastSeen: (val: 'Nobody' | 'Everyone' | 'My contacts') => void;
  profilePhotoPrivacy: 'Everyone' | 'My contacts' | 'Nobody';
  onChangeProfilePhotoPrivacy: (val: 'Everyone' | 'My contacts' | 'Nobody') => void;
  readReceipts: boolean;
  onToggleReadReceipts: () => void;
  allowCameraEffects: boolean;
  onToggleCameraEffects: () => void;
  protectIpCalls: boolean;
  onToggleProtectIpCalls: () => void;
  disappearingTimer: 'Off' | '24 hours' | '7 days' | '90 days';
  onChangeDisappearingTimer: (val: 'Off' | '24 hours' | '7 days' | '90 days') => void;
  blockedUsers: string[];
  onAddBlockedUser: (user: string) => void;
  onRemoveBlockedUser: (user: string) => void;
}

export default function PrivacySettings({
  lastSeenOnline,
  onChangeLastSeen,
  profilePhotoPrivacy,
  onChangeProfilePhotoPrivacy,
  readReceipts,
  onToggleReadReceipts,
  allowCameraEffects,
  onToggleCameraEffects,
  protectIpCalls,
  onToggleProtectIpCalls,
  disappearingTimer,
  onChangeDisappearingTimer,
  blockedUsers,
  onAddBlockedUser,
  onRemoveBlockedUser,
}: PrivacySettingsProps) {
  const [showLastSeenModal, setShowLastSeenModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockInput, setBlockInput] = useState('');

  return (
    <div className="p-4 space-y-4" id="settings-privacy-page">
      {/* Privacy Checkup Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-emerald-300">Privacy Checkup & Shield</h4>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
            Your personal messages are end-to-end encrypted. Choose who can see your activity and info.
          </p>
        </div>
      </div>

      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* Last Seen & Online */}
        <button
          type="button"
          onClick={() => setShowLastSeenModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Last seen and online</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">{lastSeenOnline}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Profile Picture */}
        <button
          type="button"
          onClick={() => setShowPhotoModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Profile picture</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">{profilePhotoPrivacy}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Read Receipts Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="pr-4">
            <h5 className="text-xs font-semibold text-zinc-200">Read receipts</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              If turned off, you won't send or receive Read receipts. Blue double-ticks will be disabled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleReadReceipts();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              readReceipts ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                readReceipts ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Allow Camera Effects */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Allow camera effects</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Use augmented effects in stories and video calls</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleCameraEffects();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              allowCameraEffects ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                allowCameraEffects ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Protect IP in Calls */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Protect IP address in calls</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Relay all calls through Nightgram secure servers</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleProtectIpCalls();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              protectIpCalls ? 'bg-cyan-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                protectIpCalls ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Default Disappearing Timer */}
        <button
          type="button"
          onClick={() => setShowTimerModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Default message timer</h5>
            <p className="text-[11px] text-cyan-400 mt-0.5">{disappearingTimer}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>

        {/* Blocked Accounts Manager */}
        <button
          type="button"
          onClick={() => setShowBlockedModal(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-800/40 transition cursor-pointer"
        >
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Blocked accounts</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {blockedUsers.length > 0 ? `${blockedUsers.length} accounts blocked` : 'None'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Modal: Last Seen Selector */}
      {showLastSeenModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Who can see my last seen & online</h4>
            <div className="space-y-2">
              {(['Everyone', 'My contacts', 'Nobody'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChangeLastSeen(opt);
                    setShowLastSeenModal(false);
                    playSoundEffect('pop');
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    lastSeenOnline === opt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{opt}</span>
                  {lastSeenOnline === opt && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowLastSeenModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Profile Photo Privacy */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Who can see my profile photo</h4>
            <div className="space-y-2">
              {(['Everyone', 'My contacts', 'Nobody'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChangeProfilePhotoPrivacy(opt);
                    setShowPhotoModal(false);
                    playSoundEffect('pop');
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    profilePhotoPrivacy === opt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{opt}</span>
                  {profilePhotoPrivacy === opt && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPhotoModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Disappearing Message Timer */}
      {showTimerModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Default Disappearing Messages Timer</h4>
            <div className="space-y-2">
              {(['Off', '24 hours', '7 days', '90 days'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChangeDisappearingTimer(opt);
                    setShowTimerModal(false);
                    playSoundEffect('pop');
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    disappearingTimer === opt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{opt}</span>
                  {disappearingTimer === opt && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTimerModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Blocked Accounts Manager */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Ban className="w-4 h-4 text-red-400" />
                <span>Blocked Accounts</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowBlockedModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                placeholder="@username to block"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (blockInput.trim()) {
                    onAddBlockedUser(blockInput.trim().replace('@', ''));
                    setBlockInput('');
                    playSoundEffect('pop');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold hover:bg-red-500/30 transition cursor-pointer"
              >
                Block
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60">
              {blockedUsers.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No accounts currently blocked</p>
              ) : (
                blockedUsers.map((user) => (
                  <div key={user} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">@{user}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveBlockedUser(user);
                        playSoundEffect('pop');
                      }}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowBlockedModal(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
