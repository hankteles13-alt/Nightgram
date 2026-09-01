import React, { useState } from 'react';
import { ListFilter, Plus, Trash2, Check, Sparkles, X } from 'lucide-react';
import { CustomList, playSoundEffect } from '../../lib/settingsManager';

interface ListsSettingsProps {
  customLists: CustomList[];
  onAddList: (list: CustomList) => void;
  onRemoveList: (id: string) => void;
}

export default function ListsSettings({
  customLists,
  onAddList,
  onRemoveList,
}: ListsSettingsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💚');

  const emojis = ['💚', '💼', '🌟', '🌙', '🎧', '⚡', '🔥', '🎮', '🛸'];

  const handleCreate = () => {
    if (!newListName.trim()) return;
    const newList: CustomList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      emoji: selectedEmoji,
      count: Math.floor(Math.random() * 5) + 1,
    };
    onAddList(newList);
    setNewListName('');
    setShowCreateModal(false);
    playSoundEffect('sent');
  };

  return (
    <div className="p-4 space-y-4" id="settings-lists-page">
      {/* Header Info */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Custom Circles & Filters</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Create specialized lists to categorize your contacts and filter your chats instantly from the Chats tab.
        </p>
      </div>

      {/* Existing Lists */}
      <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
        {customLists.map((list) => (
          <div key={list.id} className="p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                {list.emoji}
              </span>
              <div>
                <h5 className="text-xs font-semibold text-zinc-200">{list.name}</h5>
                <p className="text-[11px] text-zinc-400">{list.count} contacts included</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onRemoveList(list.id);
                playSoundEffect('pop');
              }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-full p-3.5 text-left text-xs font-bold text-cyan-400 hover:bg-zinc-800/40 transition flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create a new list</span>
        </button>
      </div>

      {/* Modal: Create List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#12121e] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Create Custom List</h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Pick Icon / Emoji</label>
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {emojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setSelectedEmoji(em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${
                      selectedEmoji === em ? 'bg-cyan-500/30 border border-cyan-400 scale-110' : 'bg-zinc-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. VIP Dreamers"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
