import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Heart,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Lock,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Star,
  FileText,
  Smile,
  Mic,
  Camera,
  Compass,
  CheckSquare,
  Bell,
  Trash2,
  Share2,
  Cpu
} from 'lucide-react';
import { UserProfile } from '../types';

interface ExperienceHubProps {
  currentUser?: UserProfile | null;
}

// Initial Mock States for AI Memory, Experience Journal, Communities, Notes & Security Log
const MOCK_AI_MEMORIES = [
  { id: 'm1', category: 'Goal', text: 'Build an elegant AI-driven social app called Nightgram / Lifetime Experience', date: 'Jul 27' },
  { id: 'm2', category: 'Favorite Topic', text: 'Late-night soundscapes, cyber aesthetic, TypeScript, and UI craft', date: 'Jul 25' },
  { id: 'm3', category: 'Habit', text: 'Lofi music coding sessions at 1:30 AM', date: 'Daily' },
  { id: 'm4', category: 'Important Date', text: 'App milestone launch & global community celebration', date: 'Aug 15' },
];

const MOCK_JOURNAL_ENTRIES = [
  {
    id: 'j1',
    title: 'Midnight Coding & Cyber Solitude',
    category: 'Daily Memory',
    mood: 'Inspired 🌌',
    date: 'Today, 01:30 AM',
    gratitude: 'Grateful for quiet hours, glowing screens, and deep focus.',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    content: 'Pushed major design updates to Nightgram. The dark aesthetic with glowing accents creates an unmatched ambiance.'
  },
  {
    id: 'j2',
    title: 'City Lights & Late Walk',
    category: 'Travel & Walk',
    mood: 'Peaceful 🌙',
    date: 'Yesterday, 11:45 PM',
    gratitude: 'Fresh crisp air and city reflections on wet pavement.',
    photo: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=80',
    content: 'Took a solo walk through the neon-lit downtown avenues. Captured three high-contrast photos.'
  }
];

const MOCK_COMMUNITIES = [
  { id: 'c1', name: 'Midnight Cyber Coders', members: '1.4k members', type: 'Public • AI-Moderated', tag: 'Dev & AI', icon: Cpu },
  { id: 'c2', name: 'Lo-Fi Ambient Lounge', members: '820 members', type: 'Public', tag: 'Music & Vibes', icon: Mic },
  { id: 'c3', name: 'Lifetime Memories Vault', members: '3.2k members', type: 'Private • VIP', tag: 'Journaling', icon: BookOpen },
];

const MOCK_NOTES = [
  { id: 'n1', title: 'AI Feature Roadmap', content: 'Integrate real-time speech-to-text, mood detection, and automatic translation.', completed: false },
  { id: 'n2', title: 'Prepare Weekly AI Reflection', content: 'Summarize key journal memories into a monthly timeline.', completed: true },
];

export default function ExperienceHub({ currentUser }: ExperienceHubProps) {
  const [activeTab, setActiveTab] = useState<'journal' | 'aimemory' | 'productivity' | 'communities' | 'security' | 'pro'>('journal');

  // Experience Journal State
  const [journalEntries, setJournalEntries] = useState(MOCK_JOURNAL_ENTRIES);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');
  const [newJournalMood, setNewJournalMood] = useState('Inspired 🌌');
  const [aiReflection, setAiReflection] = useState<string | null>(null);

  // AI Memory State
  const [aiMemories, setAiMemories] = useState(MOCK_AI_MEMORIES);
  const [newMemoryCategory, setNewMemoryCategory] = useState('Goal');
  const [newMemoryText, setNewMemoryText] = useState('');

  // Productivity Notes State
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Security Toggles
  const [e2eEnabled, setE2eEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [screenshotAlert, setScreenshotAlert] = useState(true);

  // Add Journal Entry
  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalTitle.trim()) return;
    const entry = {
      id: Date.now().toString(),
      title: newJournalTitle,
      category: 'Daily Memory',
      mood: newJournalMood,
      date: 'Just Now',
      gratitude: 'Recorded in Lifetime Experience Journal.',
      photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
      content: newJournalContent || 'Captured moment in my personal lifetime timeline.',
    };
    setJournalEntries([entry, ...journalEntries]);
    setNewJournalTitle('');
    setNewJournalContent('');
    setShowAddJournalModal(false);
  };

  // Generate AI Reflection
  const handleGenerateReflection = () => {
    setAiReflection('Analyzing your recent entries... ⚡');
    setTimeout(() => {
      setAiReflection(
        '🌟 AI Reflection: You have maintained high productivity and creative focus over the last week. Your mood tracking shows a 92% affinity for late-night creative flow ("Inspired" & "Peaceful"). Keep balancing deep work with restful strolls!'
      );
    }, 1200);
  };

  // Add AI Memory
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    const mem = {
      id: Date.now().toString(),
      category: newMemoryCategory,
      text: newMemoryText,
      date: 'Just Now',
    };
    setAiMemories([mem, ...aiMemories]);
    setNewMemoryText('');
  };

  // Add Productivity Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    const note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      completed: false,
    };
    setNotes([note, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const toggleNoteComplete = (id: string) => {
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-3 py-4 text-zinc-100 font-sans" id="experience-hub-container">
      {/* HUB TOP BANNER HEADER */}
      <div className="bg-gradient-to-r from-[#0c0c16] via-[#121224] to-[#0d0d18] border border-cyan-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
                Lifetime Experience & AI Suite
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-sans">
              Personal Intelligence & Memory Hub
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Record daily life milestones, leverage persistent AI memory, engage with smart communities, and customize your security & VIP features.
            </p>
          </div>

          {/* Gamification Streak & Level Badge */}
          <div className="flex items-center space-x-3 bg-[#0a0a12]/80 border border-zinc-800 p-3 rounded-2xl flex-shrink-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black font-bold shadow-lg">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1">
                <span>12 Day Streak</span>
                <span className="text-amber-400">🔥</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">Level 8 Dreamer • 1,420 XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* HUB NAVIGATION TABS */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-900">
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Experience Journal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aimemory')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'aimemory'
              ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI Memory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('productivity')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'productivity'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Productivity & Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('communities')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'communities'
              ? 'bg-blue-950 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Smart Communities</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pro')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'pro'
              ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/50 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
              : 'bg-[#0f0f18] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Nightgram VIP</span>
        </button>
      </div>

      {/* TAB CONTENT STAGE */}
      <div className="space-y-6">
        {/* TAB 1: EXPERIENCE JOURNAL */}
        {activeTab === 'journal' && (
          <div className="space-y-5">
            {/* Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d0d16] p-4 rounded-2xl border border-zinc-800/80">
              <div>
                <h3 className="text-sm font-bold text-white font-sans flex items-center space-x-2">
                  <span>Lifetime Experience Journal</span>
                  <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono">
                    {journalEntries.length} Memories
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Record daily milestones, photos, voice notes, travel logs, and mood reflections.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleGenerateReflection}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Weekly Reflection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddJournalModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Record Memory</span>
                </button>
              </div>
            </div>

            {/* AI Reflection Result Box */}
            {aiReflection && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 leading-relaxed space-y-1 shadow-lg"
              >
                <div className="font-bold flex items-center space-x-2 text-purple-300">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>AI Reflection Summary</span>
                </div>
                <p className="pt-1">{aiReflection}</p>
              </motion.div>
            )}

            {/* Journal Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#0f0f18] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700 transition flex flex-col"
                >
                  {entry.photo && (
                    <div className="relative h-44 w-full bg-zinc-900">
                      <img
                        src={entry.photo}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 font-mono">
                        {entry.mood}
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{entry.category}</span>
                        <span>{entry.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white font-sans">{entry.title}</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{entry.content}</p>
                    </div>

                    {entry.gratitude && (
                      <div className="pt-2 border-t border-zinc-900 text-[11px] text-purple-300 italic flex items-center space-x-1.5">
                        <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400 flex-shrink-0" />
                        <span className="truncate">{entry.gratitude}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI MEMORY */}
        {activeTab === 'aimemory' && (
          <div className="space-y-5">
            <div className="bg-[#0d0d16] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Persistent AI Memory Bank</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nightgram AI remembers key aspects of your life to provide hyper-personalized conversation, daily advice, and memory callbacks.
              </p>

              <form onSubmit={handleAddMemory} className="flex flex-col sm:flex-row gap-2 pt-2">
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value)}
                  className="bg-[#141422] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Goal">Goal</option>
                  <option value="Favorite Topic">Favorite Topic</option>
                  <option value="Habit">Daily Habit</option>
                  <option value="Important Date">Important Date</option>
                </select>

                <input
                  type="text"
                  placeholder="e.g. Learning French for summer trip..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="flex-1 bg-[#141422] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Remember</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-2xl bg-[#0f0f18] border border-purple-900/40 hover:border-purple-500/50 transition flex items-start justify-between space-x-3 shadow-md"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 font-mono">
                      {mem.category}
                    </span>
                    <p className="text-xs text-zinc-200 font-sans pt-1 leading-relaxed">{mem.text}</p>
                    <span className="text-[9px] text-zinc-500 block font-mono">{mem.date}</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTIVITY & NOTES */}
        {activeTab === 'productivity' && (
          <div className="space-y-5">
            <div className="bg-[#0d0d16] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Personal Notes & AI To-Do List</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Keep track of ideas, set reminders, and generate AI meeting notes directly in your workspace.
              </p>

              <form onSubmit={handleAddNote} className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full bg-[#141422] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Details or meeting notes..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="flex-1 bg-[#141422] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => toggleNoteComplete(note.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    note.completed
                      ? 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 line-through'
                      : 'bg-[#0f0f18] border-zinc-800 text-zinc-100 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        note.completed ? 'text-emerald-500 fill-emerald-950' : 'text-zinc-600'
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-bold font-sans">{note.title}</h4>
                      {note.content && <p className="text-[11px] text-zinc-400 no-underline">{note.content}</p>}
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-zinc-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SMART COMMUNITIES */}
        {activeTab === 'communities' && (
          <div className="space-y-5">
            <div className="bg-[#0d0d16] p-4 rounded-2xl border border-zinc-800/80 space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Smart AI-Moderated Communities</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Join interest-based channels with active AI moderation, automated announcements, and community leaderboards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_COMMUNITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#0f0f18] border border-zinc-800 hover:border-blue-500/50 transition flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">{c.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono block">{c.members}</span>
                      </div>
                      <span className="inline-block text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded font-mono">
                        {c.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`Joined ${c.name}!`)}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Join Community
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PRIVACY & SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="bg-[#0d0d16] p-4 rounded-2xl border border-zinc-800/80 space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Security & Privacy Control Center</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Manage your E2EE encryption, biometric authentication, and active login sessions.
              </p>
            </div>

            <div className="bg-[#0f0f18] border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">End-to-End Encryption (E2EE)</h4>
                  <p className="text-[10px] text-zinc-400">Encrypt messages on device before sending</p>
                </div>
                <input
                  type="checkbox"
                  checked={e2eEnabled}
                  onChange={(e) => setE2eEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[10px] text-zinc-400">Require secondary confirmation code at login</p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Biometric Face ID / Fingerprint Lock</h4>
                  <p className="text-[10px] text-zinc-400">Lock app when inactive for 5 minutes</p>
                </div>
                <input
                  type="checkbox"
                  checked={biometricsEnabled}
                  onChange={(e) => setBiometricsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Screenshot Detection Alert</h4>
                  <p className="text-[10px] text-zinc-400">Notify when someone takes a screenshot in chat</p>
                </div>
                <input
                  type="checkbox"
                  checked={screenshotAlert}
                  onChange={(e) => setScreenshotAlert(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: NIGHTGRAM VIP PRO */}
        {activeTab === 'pro' && (
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-fuchsia-950 via-[#120a1c] to-[#0d0814] border border-fuchsia-500/40 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-fuchsia-900/60 border border-fuchsia-500 flex items-center justify-center mx-auto text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.4)]">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white tracking-wide">Nightgram Lifetime VIP</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto mt-1 leading-relaxed">
                Unlock unlimited AI Memory storage, custom AI Personas, priority response times, and exclusive dark aesthetic themes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto pt-2">
              <div className="p-3 bg-[#0a0610] rounded-xl border border-fuchsia-900/60">
                <Zap className="w-4 h-4 text-fuchsia-400 mb-1" />
                <h5 className="text-xs font-bold text-white">Unlimited AI</h5>
                <p className="text-[10px] text-zinc-400">Zero rate limits on Gemini model calls</p>
              </div>

              <div className="p-3 bg-[#0a0610] rounded-xl border border-fuchsia-900/60">
                <Brain className="w-4 h-4 text-purple-400 mb-1" />
                <h5 className="text-xs font-bold text-white">Deep AI Memory</h5>
                <p className="text-[10px] text-zinc-400">Long-term life goal tracking & callbacks</p>
              </div>

              <div className="p-3 bg-[#0a0610] rounded-xl border border-fuchsia-900/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <h5 className="text-xs font-bold text-white">VIP Badge</h5>
                <p className="text-[10px] text-zinc-400">Exclusive badge on your Nebula profile</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Nightgram VIP membership activated!')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 text-white text-xs font-bold tracking-wide transition shadow-[0_0_20px_rgba(217,70,239,0.5)] cursor-pointer"
            >
              Upgrade to VIP — $4.99/mo
            </button>
          </div>
        )}
      </div>

      {/* ADD JOURNAL MODAL */}
      <AnimatePresence>
        {showAddJournalModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0a12] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white">Record Memory in Journal</h3>
                <button
                  type="button"
                  onClick={() => setShowAddJournalModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddJournal} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Memory Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solitude under midnight lights..."
                    value={newJournalTitle}
                    onChange={(e) => setNewJournalTitle(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Current Mood
                  </label>
                  <select
                    value={newJournalMood}
                    onChange={(e) => setNewJournalMood(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Inspired 🌌">Inspired 🌌</option>
                    <option value="Peaceful 🌙">Peaceful 🌙</option>
                    <option value="Thoughtful 💭">Thoughtful 💭</option>
                    <option value="Grateful ✨">Grateful ✨</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Memory Story / Reflection
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what made this moment memorable..."
                    value={newJournalContent}
                    onChange={(e) => setNewJournalContent(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddJournalModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
