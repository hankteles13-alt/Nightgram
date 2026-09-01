import React, { useState } from 'react';
import { Trash2, HardDrive, Download, Check, Sparkles, RefreshCw } from 'lucide-react';
import { playSoundEffect } from '../../lib/settingsManager';

interface ChatsSettingsProps {
  enterIsSend: boolean;
  onToggleEnterIsSend: () => void;
  mediaVisibility: boolean;
  onToggleMediaVisibility: () => void;
  fontSize: 'Small' | 'Medium' | 'Large';
  onChangeFontSize: (size: 'Small' | 'Medium' | 'Large') => void;
  voiceTranscripts: boolean;
  onToggleVoiceTranscripts: () => void;
  stickerSuggestions: boolean;
  onToggleStickerSuggestions: () => void;
  onClearAllChats?: () => void;
}

export default function ChatsSettings({
  enterIsSend,
  onToggleEnterIsSend,
  mediaVisibility,
  onToggleMediaVisibility,
  fontSize,
  onChangeFontSize,
  voiceTranscripts,
  onToggleVoiceTranscripts,
  stickerSuggestions,
  onToggleStickerSuggestions,
  onClearAllChats,
}: ChatsSettingsProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem('nightgram_last_backup') || 'Today at 03:22 AM';
  });

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const nowStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setLastBackupTime(nowStr);
      localStorage.setItem('nightgram_last_backup', nowStr);
      playSoundEffect('sent');
    }, 1200);
  };

  const handleExportChatJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      appName: 'Nightgram',
      exportDate: new Date().toISOString(),
      status: 'End-to-End Encrypted Archive',
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nightgram_chat_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    playSoundEffect('sent');
  };

  return (
    <div className="p-4 space-y-4" id="settings-chats-page">
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {/* Enter is Send */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Enter is send</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enter key will immediately send your message</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleEnterIsSend();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              enterIsSend ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                enterIsSend ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Media Visibility */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Media visibility</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">Show newly received media in your media library</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleMediaVisibility();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              mediaVisibility ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                mediaVisibility ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Font size</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">{fontSize} text sizing in chat bubbles</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = fontSize === 'Small' ? 'Medium' : fontSize === 'Medium' ? 'Large' : 'Small';
              onChangeFontSize(next);
              playSoundEffect('pop');
            }}
            className="text-xs text-cyan-400 font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
          >
            {fontSize}
          </button>
        </div>

        {/* Voice Message Transcripts */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Voice message transcripts</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">AI audio note transcript preview in bubble</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleVoiceTranscripts();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              voiceTranscripts ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                voiceTranscripts ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sticker Suggestions */}
        <div className="p-3.5 flex items-center justify-between">
          <div>
            <h5 className="text-xs font-semibold text-zinc-200">Sticker suggestions</h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">See suggested emoji/stickers as you type</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleStickerSuggestions();
              playSoundEffect('pop');
            }}
            className={`w-12 h-6 rounded-full transition p-0.5 flex-shrink-0 cursor-pointer ${
              stickerSuggestions ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition transform ${
                stickerSuggestions ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Chat Backup Module */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Chat Backup & Sync</h4>
          </div>
          <span className="text-[10px] text-zinc-500">{lastBackupTime}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Back up your chat history and media to encrypted cloud storage so you never lose conversations.
        </p>

        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Backing up...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5" />
                <span>Back Up Now</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportChatJson}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            title="Export JSON Archive"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Clear All Chats */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
              if (onClearAllChats) onClearAllChats();
              playSoundEffect('sent');
            }
          }}
          className="w-full p-3.5 px-4 text-left text-xs font-bold text-amber-400 hover:bg-amber-950/30 transition flex items-center space-x-2.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Clear All Chat History</span>
        </button>
      </div>
    </div>
  );
}
