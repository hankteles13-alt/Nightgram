import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import {
  Search,
  X,
  UserPlus,
  MessageSquare,
  Sparkles,
  ArrowRight,
  AtSign,
  Users
} from 'lucide-react';
import { collection, getDocs, db } from '../lib/supabaseFirestore';

interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
}

export default function SearchUsersModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onOpenChatWithUser,
}: SearchUsersModalProps) {
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened and fetch users
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchAllUsers();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.username) {
          list.push({
            uid: docSnap.id,
            username: data.username,
            displayName: data.displayName || data.username,
            avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: data.bio || '',
            followers: data.followers || 0,
            following: data.following || 0,
            stars: data.stars || 0,
          });
        }
      });
      setAllUsers(list);
    } catch (err) {
      console.warn('Could not load users for search:', err);
    } finally {
      setLoading(false);
    }
  };

  const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');

  const filteredUsers = allUsers.filter((u) => {
    if (!cleanQuery) return true;
    const uName = (u.username || '').toLowerCase();
    const dName = (u.displayName || '').toLowerCase();
    const bio = (u.bio || '').toLowerCase();
    return uName.includes(cleanQuery) || dName.includes(cleanQuery) || bio.includes(cleanQuery);
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="search-users-modal-backdrop"
        className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="search-users-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0c0c14] border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
        >
          {/* Top Search Bar Header */}
          <div className="p-3 sm:p-4 border-b border-zinc-850 flex items-center space-x-3 bg-[#0f0f18]/60">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                id="search-users-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search citizen by @username, name, or vibe..."
                className="w-full bg-[#141420] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="close-search-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Header Label */}
          <div className="px-4 py-2 bg-[#090910] border-b border-zinc-900 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            <span>
              {query ? `Found ${filteredUsers.length} matching citizens` : 'Citizens in the Frequency'}
            </span>
            <span className="text-cyan-400 font-bold flex items-center space-x-1">
              <AtSign className="w-3 h-3 inline" />
              <span>Usernames</span>
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                <span>Tuning into citizen directory...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user, userIdx) => {
                const isMe = currentUser?.uid === user.uid || currentUser?.username === user.username;
                return (
                  <div
                    key={`search-user-${user.uid || user.username || 'usr'}-${userIdx}`}
                    id={`search-user-item-${user.username}`}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#11111a]/80 hover:bg-[#161624] border border-zinc-850 hover:border-cyan-500/40 transition group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.displayName || user.username}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:border-cyan-400/80 transition"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#11111a]"></div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-cyan-300 truncate transition font-sans">
                            {user.displayName || user.username}
                          </h4>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-cyan-400 truncate">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-xs">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      {!isMe && onOpenChatWithUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChatWithUser({
                              uid: user.uid,
                              username: user.username,
                              displayName: user.displayName,
                              avatar: user.avatar,
                            });
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/50 hover:border-cyan-400 transition"
                          title={`Chat with @${user.username}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelectUser(user);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold transition flex items-center space-x-1"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500 p-4 space-y-2">
                <Users className="w-8 h-8 text-zinc-700 mx-auto" />
                <p>No citizens found matching "@{cleanQuery}".</p>
                <p className="text-[11px] text-zinc-600">
                  Ensure the username is spelled correctly or try searching by display name.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
