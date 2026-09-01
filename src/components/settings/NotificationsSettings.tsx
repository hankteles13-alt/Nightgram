import React from 'react';
import { Volume2, Bell, Check, Sparkles } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface NotificationsSettingsProps {
  conversationTones: boolean;
  onToggleConversationTones: () => void;
  reminders: boolean;
  onToggleReminders: () => void;
  highPriorityNotifs: boolean;
  onToggleHighPriorityNotifs: () => void;
  reactionNotifs: boolean;
  onToggleReactionNotifs: () => void;
  notificationSound: 'chime' | 'cyber' | 'nebula' | 'bell' | 'silent';
  onSelectNotificationSound: (sound: 'chime' | 'cyber' | 'nebula' | 'bell' | 'silent') => void;
}

export default function NotificationsSettings({
  conversationTones,
  onToggleConversationTones,
  reminders,
  onToggleReminders,
  highPriorityNotifs,
  onToggleHighPriorityNotifs,
  reactionNotifs,
  onToggleReactionNotifs,
  notificationSound,
  onSelectNotificationSound,
}: NotificationsSettingsProps) {
  const tonesList = [
    { id: 'chime', name: 'Ambient Chime (Default)' },
    { id: 'cyber', name: 'Cyber Wave' },
    { id: 'nebula', name: 'Nebula Harmonic' },
    { id: 'bell', name: 'Crystal Bell' },
    { id: 'silent', name: 'Silent' },
  ] as const;

  const handleSelectTone = (toneId: 'chime' | 'cyber' | 'nebula' | 'bell' | 'silent') => {
    onSelectNotificationSound(toneId);
    if (toneId !== 'silent') {
      playSoundEffect(toneId);
    } else {
      playSoundEffect('pop');
    }
  };

  return (
    <div className="p-4 space-y-4" id="settings-notifications-page">
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* Conversation Tones */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="pr-2">
            <h5 className="text-xs font-semibold text-zinc-200">Conversation tones</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Play sounds for incoming and outgoing messages</p>
          </div>
          <div className="flex items-center space-x-2">
            {conversationTones && (
              <button
                type="button"
                onClick={() => playSoundEffect('sent')}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 transition"
                title="Test Send Sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onToggleConversationTones();
                playSoundEffect('pop');
              }}
              className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
                conversationTones ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition transform ${
                  conversationTones ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reminders */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Reminders</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Get reminders about unread messages and missed calls</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleReminders();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              reminders ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                reminders ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* High Priority Notifications */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Use high priority notifications</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Show previews of notifications at the top of the screen</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleHighPriorityNotifs();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              highPriorityNotifs ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                highPriorityNotifs ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reaction Notifications */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Reaction notifications</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Show notifications when someone reacts to your messages</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleReactionNotifs();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              reactionNotifs ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                reactionNotifs ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification Tone Picker */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Notification Alert Sound</h4>
        <div className="space-y-1.5">
          {tonesList.map((tone) => {
            const isSelected = notificationSound === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => handleSelectTone(tone.id)}
                className={`w-full p-2.5 rounded-xl text-xs font-medium flex items-center justify-between border transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>{tone.name}</span>
                <div className="flex items-center space-x-2">
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
