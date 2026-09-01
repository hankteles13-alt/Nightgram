import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { optimizeImageForFirestore } from '../lib/imageOptimizer';
import {
  ArrowLeft,
  Search,
  QrCode,
  KeyRound,
  Lock,
  ListFilter,
  MessageSquare,
  Palette,
  Bell,
  HardDrive,
  Shield,
  Accessibility,
  Globe,
  HelpCircle,
  Camera,
  ChevronRight,
  LogOut,
  X,
  Plus,
  Maximize2,
  Check,
} from 'lucide-react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  CustomList,
  playSoundEffect,
  ACCENT_COLOR_MAP,
} from '../lib/settingsManager';
import FullCoverPhotoViewer from './settings/FullCoverPhotoViewer';
import AppearanceSettings from './settings/AppearanceSettings';
import PrivacySettings from './settings/PrivacySettings';
import ChatsSettings from './settings/ChatsSettings';
import NotificationsSettings from './settings/NotificationsSettings';
import StorageSettings from './settings/StorageSettings';
import AccountSettings from './settings/AccountSettings';
import ParentalSettings from './settings/ParentalSettings';
import ListsSettings from './settings/ListsSettings';
import AccessibilitySettings from './settings/AccessibilitySettings';
import LanguageSettings from './settings/LanguageSettings';
import HelpSettings from './settings/HelpSettings';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onSignOut?: () => void;
  isTrueBlack?: boolean;
  onToggleTheme?: () => void;
  onClearAllChats?: () => void;
}

export type SettingsSubPage =
  | 'main'
  | 'profile'
  | 'account'
  | 'privacy'
  | 'lists'
  | 'chats'
  | 'appearance'
  | 'notifications'
  | 'storage'
  | 'parental'
  | 'accessibility'
  | 'language'
  | 'help';

export function AppSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onSignOut,
  isTrueBlack = false,
  onToggleTheme,
  onClearAllChats,
}: AppSettingsModalProps) {
  const [subPage, setSubPage] = useState<SettingsSubPage>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Settings State initialized from localStorage / defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('nightgram_user_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings on update
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('nightgram_user_settings', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save settings', e);
      }
      return next;
    });

    // Also sync to user profile if logged in
    if (currentUser?.uid && onUpdateProfile) {
      onUpdateProfile({
        settings: {
          ...settings,
          [key]: value,
        },
      });
    }
  };

  // Profile Edit fields
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || 'Hankteles 💀👽');
  const [editAbout, setEditAbout] = useState(currentUser?.bio || 'Scopetela');
  const [editUsername, setEditUsername] = useState(currentUser?.username || 'hankteles');
  const [editPhone, setEditPhone] = useState(currentUser?.phoneNumber || '+256 766 840845');

  // Full-cover photo viewer state & file input
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName) setEditDisplayName(currentUser.displayName);
      if (currentUser.bio) setEditAbout(currentUser.bio);
      if (currentUser.username) setEditUsername(currentUser.username);
      if (currentUser.phoneNumber) setEditPhone(currentUser.phoneNumber);
      if (currentUser.settings) {
        setSettings((prev) => ({ ...prev, ...currentUser.settings }));
      }
    }
  }, [currentUser, isOpen]);

  // Apply accent color on mount or change
  useEffect(() => {
    const colData = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.cyan;
    document.documentElement.style.setProperty('--accent-color', colData.hex);
    document.documentElement.style.setProperty('--accent-glow', colData.glow);
  }, [settings.accentColor]);

  // Search items index
  const searchIndex = useMemo(() => {
    return [
      { id: 'profile', title: 'Profile', desc: 'Display name, about, avatar, reserved username', page: 'profile' as SettingsSubPage },
      { id: 'account', title: 'Account Security', desc: 'Two-factor auth, passkeys, email, data archive', page: 'account' as SettingsSubPage },
      { id: 'privacy', title: 'Privacy & Permissions', desc: 'Last seen, profile photo, read receipts, disappearing timer, blocked', page: 'privacy' as SettingsSubPage },
      { id: 'lists', title: 'Lists & Custom Circles', desc: 'Manage custom chat filter categories and contacts', page: 'lists' as SettingsSubPage },
      { id: 'chats', title: 'Chats & Backup', desc: 'Enter is send, media visibility, font size, voice transcripts, backup', page: 'chats' as SettingsSubPage },
      { id: 'appearance', title: 'Appearance & Theme', desc: 'True Black OLED mode, 12 accent colors, chat wallpapers, fonts', page: 'appearance' as SettingsSubPage },
      { id: 'notifications', title: 'Notifications & Sounds', desc: 'Conversation tones, reminder alerts, priority banners, sound tones', page: 'notifications' as SettingsSubPage },
      { id: 'storage', title: 'Storage & Data', desc: 'Storage breakdown, clear cache, mobile/wifi auto-download, data saver', page: 'storage' as SettingsSubPage },
      { id: 'parental', title: 'Parental Controls', desc: 'Daily screen time limit, bedtime downtime, content filters, PIN', page: 'parental' as SettingsSubPage },
      { id: 'accessibility', title: 'Accessibility', desc: 'High contrast, reduce motion, large touch targets', page: 'accessibility' as SettingsSubPage },
      { id: 'language', title: 'App Language', desc: 'Change application interface language', page: 'language' as SettingsSubPage },
      { id: 'help', title: 'Help & Feedback', desc: 'FAQ answers, report a bug, privacy policy & terms', page: 'help' as SettingsSubPage },
    ];
  }, []);

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
  }, [searchQuery, searchIndex]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedUrl = await optimizeImageForFirestore(file, {
        maxDimension: 800,
        quality: 0.85,
        maxSizeBytes: 400000,
      });

      if (optimizedUrl && onUpdateProfile) {
        onUpdateProfile({ avatar: optimizedUrl });
        playSoundEffect('sent');
      }
    } catch (err) {
      console.warn('Avatar optimization error:', err);
    }
  };

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        displayName: editDisplayName || currentUser?.displayName || currentUser?.username || 'Dreamer',
        bio: editAbout || currentUser?.bio || '',
        username: editUsername || currentUser?.username || 'dreamer',
        phoneNumber: editPhone,
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      playSoundEffect('sent');
    }
    setSubPage('main');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4" id="app-settings-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className={`w-full h-full sm:h-[90vh] sm:max-h-[820px] sm:max-w-md ${
          isTrueBlack ? 'bg-black' : 'bg-[#0c0c14]'
        } border border-zinc-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 relative`}
      >
        {/* TOP APP SETTINGS HEADER */}
        <div className="p-3.5 px-4 bg-[#10101b]/95 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between text-zinc-100 flex-shrink-0 z-10">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (isSearching) {
                  setIsSearching(false);
                  setSearchQuery('');
                } else if (subPage !== 'main') {
                  setSubPage('main');
                } else {
                  onClose();
                }
              }}
              className="p-1.5 hover:bg-zinc-800/80 rounded-full transition text-zinc-300 hover:text-cyan-300 cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {isSearching ? (
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
              />
            ) : (
              <h2 className="text-base font-bold text-zinc-100 capitalize truncate">
                {subPage === 'main'
                  ? 'Settings'
                  : subPage === 'profile'
                  ? 'Profile'
                  : subPage === 'appearance'
                  ? 'Appearance'
                  : subPage === 'privacy'
                  ? 'Privacy'
                  : subPage === 'account'
                  ? 'Account'
                  : subPage === 'chats'
                  ? 'Chats'
                  : subPage === 'notifications'
                  ? 'Notifications'
                  : subPage === 'storage'
                  ? 'Storage and data'
                  : subPage === 'parental'
                  ? 'Parental controls'
                  : subPage === 'lists'
                  ? 'Lists'
                  : subPage === 'accessibility'
                  ? 'Accessibility'
                  : subPage === 'language'
                  ? 'App language'
                  : 'Help & feedback'}
              </h2>
            )}
          </div>

          <div className="flex items-center space-x-2 text-zinc-400 flex-shrink-0">
            {subPage === 'main' && !isSearching && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 hover:bg-zinc-800/80 rounded-full transition text-zinc-400 hover:text-cyan-300 cursor-pointer"
                  title="My QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearching(true)}
                  className="p-1.5 hover:bg-zinc-800/80 rounded-full transition text-zinc-400 hover:text-cyan-300 cursor-pointer"
                  title="Search Settings"
                >
                  <Search className="w-5 h-5" />
                </button>
              </>
            )}

            {isSearching && searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800/80 rounded-full transition text-zinc-400 hover:text-red-400 cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE SETTINGS BODY */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40 scrollbar-thin">
          {/* Search Results Overlay */}
          {isSearching && searchQuery.trim() && (
            <div className="p-3 divide-y divide-zinc-800/50">
              <span className="text-[11px] font-bold text-zinc-400 px-3 uppercase tracking-wider block mb-2">
                Search Results ({filteredSearchResults.length})
              </span>
              {filteredSearchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No settings match "{searchQuery}"
                </div>
              ) : (
                filteredSearchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      setSubPage(res.page);
                      setIsSearching(false);
                      setSearchQuery('');
                      playSoundEffect('pop');
                    }}
                    className="w-full p-3 text-left hover:bg-zinc-900/60 rounded-xl transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300">{res.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{res.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* ===================== MAIN SETTINGS OVERVIEW ===================== */}
          {subPage === 'main' && !isSearching && (
            <div className="divide-y divide-zinc-800/40">
              {/* Profile Card */}
              <div
                onClick={() => setSubPage('profile')}
                className="p-4 hover:bg-zinc-900/50 transition cursor-pointer flex items-center space-x-3.5"
                id="settings-profile-card"
              >
                <div className="relative flex-shrink-0">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPhotoExpanded(true);
                    }}
                    title="Click picture to expand full screen"
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/40 p-0.5 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-400 hover:scale-105 transition-all cursor-pointer group"
                  >
                    <img
                      src={
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt="User avatar"
                      className="w-full h-full rounded-full object-cover group-hover:brightness-95"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQrModal(true);
                    }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-zinc-950 flex items-center justify-center border-2 border-[#0c0c14] shadow-md cursor-pointer hover:scale-110 transition"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-zinc-100 truncate flex items-center space-x-1.5">
                    <span>{currentUser?.displayName || 'Hankteles 💀👽'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    @{currentUser?.username || 'hankteles'}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {currentUser?.bio || 'Chasing midnight dreams.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-zinc-500 flex-shrink-0">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Main Categories Navigation List */}
              <div className="py-2">
                {/* 1. Account */}
                <button
                  type="button"
                  onClick={() => setSubPage('account')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-account"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Account</h4>
                    <p className="text-xs text-zinc-400 truncate">Security notifications, passkeys, email</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 2. Privacy */}
                <button
                  type="button"
                  onClick={() => setSubPage('privacy')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-privacy"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Privacy</h4>
                    <p className="text-xs text-zinc-400 truncate">Blocked accounts, disappearing messages</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 3. Lists */}
                <button
                  type="button"
                  onClick={() => setSubPage('lists')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-lists"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Lists</h4>
                    <p className="text-xs text-zinc-400 truncate">Manage people, favorites and custom filters</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 4. Chats */}
                <button
                  type="button"
                  onClick={() => setSubPage('chats')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-chats"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Chats</h4>
                    <p className="text-xs text-zinc-400 truncate">Chat theme, wallpaper, font size, backup</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 5. Appearance */}
                <button
                  type="button"
                  onClick={() => setSubPage('appearance')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-appearance"
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-950/40 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Appearance</h4>
                    <p className="text-xs text-zinc-400 truncate">App theme, True Black OLED, color swatches</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 6. Notifications */}
                <button
                  type="button"
                  onClick={() => setSubPage('notifications')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-notifications"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Notifications</h4>
                    <p className="text-xs text-zinc-400 truncate">Message tones, group alerts, reminders</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 7. Storage and data */}
                <button
                  type="button"
                  onClick={() => setSubPage('storage')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-storage"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Storage and data</h4>
                    <p className="text-xs text-zinc-400 truncate">Network usage, auto-download media</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 8. Parental controls */}
                <button
                  type="button"
                  onClick={() => setSubPage('parental')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-parental"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-950/40 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Parental controls</h4>
                    <p className="text-xs text-zinc-400 truncate">Settings for your family</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 9. Accessibility */}
                <button
                  type="button"
                  onClick={() => setSubPage('accessibility')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-accessibility"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-950/40 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <Accessibility className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Accessibility</h4>
                    <p className="text-xs text-zinc-400 truncate">Increase contrast, animation speed</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 10. App language */}
                <button
                  type="button"
                  onClick={() => setSubPage('language')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-language"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 flex-shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">App language</h4>
                    <p className="text-xs text-cyan-400 truncate uppercase">{settings.language}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>

                {/* 11. Help and feedback */}
                <button
                  type="button"
                  onClick={() => setSubPage('help')}
                  className="w-full px-4 py-3.5 flex items-center space-x-3.5 text-left hover:bg-zinc-900/50 transition cursor-pointer"
                  id="settings-item-help"
                >
                  <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300 flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-100">Help and feedback</h4>
                    <p className="text-xs text-zinc-400 truncate">Help center, contact us, privacy policy</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </button>
              </div>

              {/* Log Out Row */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => {
                    if (onSignOut) {
                      onSignOut();
                      onClose();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-400 hover:bg-red-900/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out of Nightgram</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== SUBPAGE: PROFILE ===================== */}
          {subPage === 'profile' && (
            <div className="p-5 space-y-5" id="settings-profile-page">
              <input
                type="file"
                ref={avatarFileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
                id="settings-avatar-file-input"
              />

              <div className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setIsPhotoExpanded(true)}
                  title="Click picture to cover whole view"
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-2 border-cyan-500 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-cyan-500/40 group-hover:brightness-95 cursor-pointer"
                  />
                  {/* Subtle Hover Overlay for clicking picture to cover whole view */}
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px] pointer-events-none">
                    <Maximize2 className="w-6 h-6 text-cyan-300 drop-shadow mb-0.5" />
                    <span className="text-[10px] font-bold text-zinc-100 tracking-wide">Full Cover</span>
                  </div>

                  {/* Camera Icon: click to change profile picture */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarFileInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-500 text-zinc-950 flex items-center justify-center border-2 border-[#0c0c14] shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition z-10"
                    title="Change Profile Picture"
                    id="settings-avatar-camera-btn"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-[#141422] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">About / Bio</label>
                  <input
                    type="text"
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    className="w-full bg-[#141422] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Reserved Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#141422] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#141422] border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* ===================== SUBPAGE: APPEARANCE ===================== */}
          {subPage === 'appearance' && (
            <AppearanceSettings
              isTrueBlack={isTrueBlack}
              onToggleTheme={onToggleTheme}
              accentColor={settings.accentColor}
              onSelectAccentColor={(color) => updateSetting('accentColor', color)}
              chatWallpaper={settings.chatWallpaper}
              onSelectChatWallpaper={(wallpaper) => updateSetting('chatWallpaper', wallpaper)}
              fontSize={settings.fontSize}
              onSelectFontSize={(size) => updateSetting('fontSize', size)}
            />
          )}

          {/* ===================== SUBPAGE: PRIVACY ===================== */}
          {subPage === 'privacy' && (
            <PrivacySettings
              lastSeenOnline={settings.lastSeenOnline}
              onChangeLastSeen={(val) => updateSetting('lastSeenOnline', val)}
              profilePhotoPrivacy={settings.profilePhotoPrivacy}
              onChangeProfilePhotoPrivacy={(val) => updateSetting('profilePhotoPrivacy', val)}
              readReceipts={settings.readReceipts}
              onToggleReadReceipts={() => updateSetting('readReceipts', !settings.readReceipts)}
              allowCameraEffects={settings.allowCameraEffects}
              onToggleCameraEffects={() => updateSetting('allowCameraEffects', !settings.allowCameraEffects)}
              protectIpCalls={settings.protectIpCalls}
              onToggleProtectIpCalls={() => updateSetting('protectIpCalls', !settings.protectIpCalls)}
              disappearingTimer={settings.disappearingTimer}
              onChangeDisappearingTimer={(val) => updateSetting('disappearingTimer', val)}
              blockedUsers={settings.blockedUsers}
              onAddBlockedUser={(user) => {
                if (!settings.blockedUsers.includes(user)) {
                  updateSetting('blockedUsers', [...settings.blockedUsers, user]);
                }
              }}
              onRemoveBlockedUser={(user) => {
                updateSetting(
                  'blockedUsers',
                  settings.blockedUsers.filter((u) => u !== user)
                );
              }}
            />
          )}

          {/* ===================== SUBPAGE: CHATS ===================== */}
          {subPage === 'chats' && (
            <ChatsSettings
              enterIsSend={settings.enterIsSend}
              onToggleEnterIsSend={() => updateSetting('enterIsSend', !settings.enterIsSend)}
              mediaVisibility={settings.mediaVisibility}
              onToggleMediaVisibility={() => updateSetting('mediaVisibility', !settings.mediaVisibility)}
              fontSize={settings.fontSize}
              onChangeFontSize={(size) => updateSetting('fontSize', size)}
              voiceTranscripts={settings.voiceTranscripts}
              onToggleVoiceTranscripts={() => updateSetting('voiceTranscripts', !settings.voiceTranscripts)}
              stickerSuggestions={settings.stickerSuggestions}
              onToggleStickerSuggestions={() => updateSetting('stickerSuggestions', !settings.stickerSuggestions)}
              onClearAllChats={onClearAllChats}
            />
          )}

          {/* ===================== SUBPAGE: NOTIFICATIONS ===================== */}
          {subPage === 'notifications' && (
            <NotificationsSettings
              conversationTones={settings.conversationTones}
              onToggleConversationTones={() => updateSetting('conversationTones', !settings.conversationTones)}
              reminders={settings.reminders}
              onToggleReminders={() => updateSetting('reminders', !settings.reminders)}
              highPriorityNotifs={settings.highPriorityNotifs}
              onToggleHighPriorityNotifs={() => updateSetting('highPriorityNotifs', !settings.highPriorityNotifs)}
              reactionNotifs={settings.reactionNotifs}
              onToggleReactionNotifs={() => updateSetting('reactionNotifs', !settings.reactionNotifs)}
              notificationSound={settings.notificationSound}
              onSelectNotificationSound={(sound) => updateSetting('notificationSound', sound)}
            />
          )}

          {/* ===================== SUBPAGE: STORAGE & DATA ===================== */}
          {subPage === 'storage' && (
            <StorageSettings
              mobileAutoDownload={settings.mobileAutoDownload}
              onChangeMobileAutoDownload={(obj) => updateSetting('mobileAutoDownload', obj)}
              wifiAutoDownload={settings.wifiAutoDownload}
              onChangeWifiAutoDownload={(obj) => updateSetting('wifiAutoDownload', obj)}
              roamingAutoDownload={settings.roamingAutoDownload}
              onChangeRoamingAutoDownload={(obj) => updateSetting('roamingAutoDownload', obj)}
              dataSaver={settings.dataSaver}
              onToggleDataSaver={() => updateSetting('dataSaver', !settings.dataSaver)}
            />
          )}

          {/* ===================== SUBPAGE: ACCOUNT ===================== */}
          {subPage === 'account' && (
            <AccountSettings
              email={currentUser?.email || 'user@nightgram.com'}
              onUpdateEmail={(newEmail) => {
                if (onUpdateProfile) {
                  onUpdateProfile({ email: newEmail });
                }
              }}
              twoFactorEnabled={settings.twoFactorEnabled}
              onToggleTwoFactor={() => updateSetting('twoFactorEnabled', !settings.twoFactorEnabled)}
              securityNotifs={settings.securityNotifs}
              onToggleSecurityNotifs={() => updateSetting('securityNotifs', !settings.securityNotifs)}
              passkeysEnabled={settings.passkeysEnabled}
              onTogglePasskeys={() => updateSetting('passkeysEnabled', !settings.passkeysEnabled)}
              onDeleteAccount={() => {
                if (onSignOut) {
                  onSignOut();
                  onClose();
                }
              }}
            />
          )}

          {/* ===================== SUBPAGE: PARENTAL CONTROLS ===================== */}
          {subPage === 'parental' && (
            <ParentalSettings
              parentalControlsEnabled={settings.parentalControlsEnabled}
              onToggleParentalControls={() =>
                updateSetting('parentalControlsEnabled', !settings.parentalControlsEnabled)
              }
              screenTimeLimitMinutes={settings.screenTimeLimitMinutes}
              onChangeScreenTimeLimit={(mins) => updateSetting('screenTimeLimitMinutes', mins)}
              bedtimeLimitEnabled={settings.bedtimeLimitEnabled}
              onToggleBedtimeLimit={() =>
                updateSetting('bedtimeLimitEnabled', !settings.bedtimeLimitEnabled)
              }
              contentFilter={settings.contentFilter}
              onToggleContentFilter={() => updateSetting('contentFilter', !settings.contentFilter)}
              parentalPin={settings.parentalPin}
              onSetParentalPin={(pin) => updateSetting('parentalPin', pin)}
            />
          )}

          {/* ===================== SUBPAGE: LISTS ===================== */}
          {subPage === 'lists' && (
            <ListsSettings
              customLists={settings.customLists}
              onAddList={(newList) => updateSetting('customLists', [...settings.customLists, newList])}
              onRemoveList={(id) =>
                updateSetting(
                  'customLists',
                  settings.customLists.filter((l) => l.id !== id)
                )
              }
            />
          )}

          {/* ===================== SUBPAGE: ACCESSIBILITY ===================== */}
          {subPage === 'accessibility' && (
            <AccessibilitySettings
              highContrast={settings.highContrast}
              onToggleHighContrast={() => updateSetting('highContrast', !settings.highContrast)}
              reduceMotion={settings.reduceMotion}
              onToggleReduceMotion={() => updateSetting('reduceMotion', !settings.reduceMotion)}
              largeTouchTargets={settings.largeTouchTargets}
              onToggleLargeTouchTargets={() => updateSetting('largeTouchTargets', !settings.largeTouchTargets)}
            />
          )}

          {/* ===================== SUBPAGE: LANGUAGE ===================== */}
          {subPage === 'language' && (
            <LanguageSettings
              language={settings.language}
              onChangeLanguage={(lang) => updateSetting('language', lang)}
            />
          )}

          {/* ===================== SUBPAGE: HELP ===================== */}
          {subPage === 'help' && <HelpSettings />}
        </div>

        {/* MODAL: FULL COVER PHOTO VIEWER */}
        <FullCoverPhotoViewer
          isOpen={isPhotoExpanded}
          onClose={() => setIsPhotoExpanded(false)}
          avatarUrl={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000'}
        />

        {/* MODAL: QR CODE */}
        {showQrModal && (
          <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-[#10101b] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 relative text-zinc-100"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 mx-auto shadow-md">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{currentUser?.displayName || 'Hankteles 💀👽'}</h4>
                <p className="text-xs text-zinc-400">@{currentUser?.username || 'hankteles'}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl mx-auto w-44 h-44 flex items-center justify-center shadow-lg">
                <QrCode className="w-36 h-36 text-zinc-950" />
              </div>

              <p className="text-[11px] text-zinc-500">
                Your QR code is private. If you share it with someone, they can scan it to message you.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
export default AppSettingsModal;
