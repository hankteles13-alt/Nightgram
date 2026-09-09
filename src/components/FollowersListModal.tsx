import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  UserCheck,
  UserPlus,
  MessageCircle,
  Users,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { db, collection, getDocs } from '../lib/supabaseFirestore';

export interface FollowItem {
  uid?: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isFollowing?: boolean;
  followsYou?: boolean;
  badge?: string;
}

// Default vibrant nocturnal community members for Nightgram
export const DEFAULT_COMMUNITY_FOLLOWERS: FollowItem[] = [
  {
    username: 'synth_fox',
    displayName: 'Elena Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Chasing neon signs and late night synthesizer loops 🌧️🎹',
    isFollowing: false,
    followsYou: true,
    badge: '🌙 Night Owl',
  },
  {
    username: 'nocturnal_rider',
    displayName: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    bio: 'Night rides through neon streets & analog photography 🏍️📸',
    isFollowing: true,
    followsYou: true,
    badge: '⚡ Street Rider',
  },
  {
    username: 'tokyo_drift',
    displayName: 'Kenji Sato',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Shinjuku alleyways at 3 AM. Rain reflections & lofi beats 🎧',
    isFollowing: true,
    followsYou: true,
    badge: '🏙️ Tokyo Resident',
  },
  {
    username: 'beat_maker',
    displayName: 'Julian Cruz',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Drum machines, analog filters, midnight coffee brewing ☕🎵',
    isFollowing: false,
    followsYou: true,
    badge: '🎛️ Beatmaker',
  },
  {
    username: 'luna_vibes',
    displayName: 'Luna Chen',
    avatar: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=150',
    bio: 'Stargazer & ambient visual artist. Finding magic in quiet hours ✨',
    isFollowing: false,
    followsYou: true,
    badge: '✨ Ambient Artist',
  },
  {
    username: 'coffee_at_3am',
    displayName: 'Aiden Brooks',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    bio: 'Espresso shots when the city sleeps. Cyberpunk coding sessions 💻',
    isFollowing: true,
    followsYou: true,
    badge: '☕ Espresso Club',
  },
  {
    username: 'cyber_wanderer',
    displayName: 'Sora Takahashi',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    bio: 'Night walks, vintage synth wave, and neon glow architecture 🌌',
    isFollowing: false,
    followsYou: true,
    badge: '🌌 Midnight Wanderer',
  },
];

interface FollowersListModalProps {
  isOpen: boolean;
  initialTab?: 'followers' | 'following';
  userProfile: UserProfile;
  currentUser: UserProfile | null;
  onClose: () => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
  onSelectUser?: (user: any) => void;
  onToggleFollowUser?: (targetUser: FollowItem, isFollowing: boolean) => void;
  onRemoveFollower?: (username: string) => void;
  followingList?: string[];
  onCountsChange?: (counts: { followers: number; following: number }) => void;
}

export default function FollowersListModal({
  isOpen,
  initialTab = 'followers',
  userProfile,
  currentUser,
  onClose,
  onOpenChatWithUser,
  onSelectUser,
  onToggleFollowUser,
  onRemoveFollower,
  followingList: externalFollowingList,
  onCountsChange,
}: FollowersListModalProps) {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<FollowItem[]>([]);
  const [following, setFollowing] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Load followers and following from Firestore and default community
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const dbUsers: FollowItem[] = [];

        usersSnap.forEach((d) => {
          const uData = d.data();
          // Exclude the profile owner
          if (uData.username && uData.username !== userProfile.username) {
            dbUsers.push({
              uid: d.id,
              username: uData.username,
              displayName: uData.displayName || uData.username,
              avatar: uData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              bio: uData.bio || 'Nightgram Citizen',
              followsYou: true,
              isFollowing: externalFollowingList?.includes(uData.username.toLowerCase()) ?? false,
              badge: '✨ Citizen',
            });
          }
        });

        if (!isMounted) return;

        // Merge community default followers with any registered database users
        const combinedFollowers = [...dbUsers];
        DEFAULT_COMMUNITY_FOLLOWERS.forEach((defaultUser) => {
          if (!combinedFollowers.some((u) => u.username.toLowerCase() === defaultUser.username.toLowerCase())) {
            const isFollowed = externalFollowingList?.includes(defaultUser.username.toLowerCase()) ?? defaultUser.isFollowing;
            combinedFollowers.push({
              ...defaultUser,
              isFollowing: isFollowed,
            });
          }
        });

        // Following list: people the profile user is following
        const currentFollowing = combinedFollowers.filter((u) => {
          if (externalFollowingList && externalFollowingList.length > 0) {
            return externalFollowingList.includes(u.username.toLowerCase());
          }
          return u.isFollowing;
        });

        setFollowers(combinedFollowers);
        const resolvedFollowing = currentFollowing.length > 0 ? currentFollowing : combinedFollowers.slice(0, 3);
        setFollowing(resolvedFollowing);
        if (onCountsChange) {
          onCountsChange({
            followers: combinedFollowers.length,
            following: resolvedFollowing.length,
          });
        }
      } catch (err) {
        console.warn('Notice loading followers from Firestore, using community roster:', err);
        if (!isMounted) return;

        const updated = DEFAULT_COMMUNITY_FOLLOWERS.map((u) => ({
          ...u,
          isFollowing: externalFollowingList?.includes(u.username.toLowerCase()) ?? u.isFollowing,
        }));
        setFollowers(updated);
        const activeFollowing = updated.filter((u) => u.isFollowing);
        setFollowing(activeFollowing);
        if (onCountsChange) {
          onCountsChange({
            followers: updated.length,
            following: activeFollowing.length,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userProfile.username, externalFollowingList, onCountsChange]);

  // Handle follow / unfollow toggle
  const handleToggleFollow = (targetUser: FollowItem) => {
    const nextState = !targetUser.isFollowing;

    // Update followers state
    setFollowers((prev) =>
      prev.map((u) => (u.username === targetUser.username ? { ...u, isFollowing: nextState } : u))
    );

    // Update following state
    setFollowing((prev) => {
      let nextFollowing: FollowItem[];
      if (nextState) {
        // Add to following
        if (!prev.some((u) => u.username === targetUser.username)) {
          nextFollowing = [{ ...targetUser, isFollowing: true }, ...prev];
        } else {
          nextFollowing = prev.map((u) => (u.username === targetUser.username ? { ...u, isFollowing: true } : u));
        }
      } else {
        // Remove from following
        nextFollowing = prev.filter((u) => u.username !== targetUser.username);
      }
      if (onCountsChange) {
        onCountsChange({ followers: followers.length, following: nextFollowing.length });
      }
      return nextFollowing;
    });

    if (onToggleFollowUser) {
      onToggleFollowUser(targetUser, nextState);
    }

    // Temporary action notice
    setActionNotice(nextState ? `Following @${targetUser.username}` : `Unfollowed @${targetUser.username}`);
    setTimeout(() => setActionNotice(null), 2200);
  };

  // Remove a follower (for account privacy)
  const handleRemoveFollower = (targetUsername: string) => {
    setFollowers((prev) => {
      const nextFollowers = prev.filter((u) => u.username !== targetUsername);
      if (onCountsChange) {
        onCountsChange({ followers: nextFollowers.length, following: following.length });
      }
      return nextFollowers;
    });
    if (onRemoveFollower) {
      onRemoveFollower(targetUsername);
    }
    setActionNotice(`Removed @${targetUsername} from followers`);
    setTimeout(() => setActionNotice(null), 2200);
  };

  // Filtered lists
  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!query) return currentList;
    return currentList.filter(
      (u) => u.username.toLowerCase().includes(query) || u.displayName.toLowerCase().includes(query)
    );
  }, [currentList, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="followers-list-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          id="followers-list-modal-card"
          className="w-full max-w-lg bg-[#0a0a12] border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] relative text-zinc-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-[#0d0d16]/90 relative">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>@{userProfile.username}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-normal">
                    Network
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">Nightgram Nocturnal Connections</p>
              </div>
            </div>

            <button
              id="followers-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher: Followers vs Following */}
          <div className="flex border-b border-zinc-800/80 bg-[#07070d]">
            <button
              id="tab-followers-btn"
              type="button"
              onClick={() => {
                setActiveTab('followers');
                setSearchQuery('');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${
                activeTab === 'followers'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Followers</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === 'followers'
                    ? 'bg-cyan-500/30 text-cyan-200'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {followers.length}
              </span>
            </button>

            <button
              id="tab-following-btn"
              type="button"
              onClick={() => {
                setActiveTab('following');
                setSearchQuery('');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition cursor-pointer ${
                activeTab === 'following'
                  ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Following</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                  activeTab === 'following'
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {following.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 sm:px-4 bg-[#0a0a12] border-b border-zinc-800/50">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                id="followers-modal-search-input"
                type="text"
                placeholder={
                  activeTab === 'followers'
                    ? 'Search followers by @username or name...'
                    : 'Search following by @username or name...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#12121e] border border-zinc-800 focus:border-cyan-500/80 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Feedback Toast */}
          <AnimatePresence>
            {actionNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-cyan-950/90 to-purple-950/90 border-b border-cyan-500/40 text-cyan-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>{actionNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List Area */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-zinc-800/40 scrollbar-thin"
            id="followers-list-scroll-area"
          >
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading nocturnal members...</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mb-1" />
                <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                  {searchQuery ? 'No members found' : `No ${activeTab} yet`}
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs">
                  {searchQuery
                    ? `No matching citizens for "${searchQuery}".`
                    : activeTab === 'followers'
                    ? 'Citizens will appear here as they follow your frequencies.'
                    : 'Follow creators in the Shorts section by tapping the red "+" badge on their video avatars!'}
                </p>
              </div>
            ) : (
              filteredList.map((item, idx) => {
                const isItemFollowed = item.isFollowing;
                return (
                  <div
                    key={`follow-item-${item.username}-${idx}`}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 group hover:bg-zinc-900/30 p-2 rounded-xl transition"
                  >
                    {/* User info */}
                    <div
                      className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (onSelectUser) {
                          onSelectUser(item);
                        } else if (onOpenChatWithUser) {
                          onOpenChatWithUser(item);
                        }
                      }}
                      title="View profile card"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500">
                          <img
                            src={item.avatar}
                            alt={item.displayName}
                            className="w-full h-full rounded-full object-cover bg-black"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition truncate">
                            {item.displayName}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium truncate">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-cyan-400/90 font-mono font-medium truncate">
                          @{item.username}
                        </p>
                        {item.bio && (
                          <p className="text-[10px] text-zinc-400 truncate max-w-xs mt-0.5">
                            {item.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Chat & Follow Toggle */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {onOpenChatWithUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenChatWithUser({
                              uid: item.uid,
                              username: item.username,
                              displayName: item.displayName,
                              avatar: item.avatar,
                            });
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-zinc-800/80 hover:bg-cyan-950/60 border border-zinc-700 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 transition cursor-pointer"
                          title={`Send message to @${item.username}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Follow / Following Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer active:scale-95 ${
                          isItemFollowed
                            ? 'bg-zinc-800/90 hover:bg-red-950/50 border border-zinc-700 hover:border-red-600/50 text-zinc-200 hover:text-red-300'
                            : 'bg-gradient-to-r from-cyan-400 to-purple-600 text-zinc-950 shadow-md shadow-cyan-500/20 hover:opacity-95'
                        }`}
                      >
                        {isItemFollowed ? (
                          <>
                            <Check className="w-3 h-3 text-cyan-400" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 stroke-[2.5]" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>

                      {/* Remove from followers if viewing Followers tab on your profile */}
                      {activeTab === 'followers' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFollower(item.username)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-lg transition text-[10px] hidden sm:inline-block cursor-pointer"
                          title="Remove from followers"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="p-3 bg-[#07070d] border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Tap the <strong className="text-red-400 font-bold">+</strong> button on creators in Shorts to follow them!</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {currentList.length} {activeTab}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
