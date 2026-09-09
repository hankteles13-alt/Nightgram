import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Post } from '../types';
import {
  X,
  MessageSquare,
  UserPlus,
  UserCheck,
  Heart,
  Grid,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { doc, updateDoc, db } from '../lib/supabaseFirestore';

interface UserProfileModalProps {
  user: UserProfile | { uid?: string; username: string; displayName?: string; avatar?: string; bio?: string; followers?: number; following?: number; stars?: number } | null;
  currentUser?: UserProfile | null;
  posts?: Post[];
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
}

export default function UserProfileModal({
  user,
  currentUser,
  posts = [],
  isOpen,
  onClose,
  onOpenChatWithUser,
}: UserProfileModalProps) {
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState<number>(user?.followers || 0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Sync followers when user changes
  React.useEffect(() => {
    if (user) {
      setLocalFollowersCount(user.followers || 0);
      setIsFollowing(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isMe = currentUser?.uid && user.uid ? currentUser.uid === user.uid : currentUser?.username === user.username;
  const userPosts = posts.filter(
    (p) => (user.uid && p.userId === user.uid) || (user.username && p.username.toLowerCase() === user.username.toLowerCase())
  );

  const handleCopyUsername = () => {
    if (navigator.clipboard && user.username) {
      navigator.clipboard.writeText(`@${user.username}`);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  const handleToggleFollow = async () => {
    if (isMe) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    const updatedCount = nextFollowing ? localFollowersCount + 1 : Math.max(0, localFollowersCount - 1);
    setLocalFollowersCount(updatedCount);

    if (user.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          followers: updatedCount,
        });
      } catch (err) {
        console.warn('Failed to update followers in Firestore:', err);
      }
    }
  };

  const handleStartChat = () => {
    if (onOpenChatWithUser && user.username) {
      onOpenChatWithUser({
        uid: user.uid,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        id="user-profile-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          id="user-profile-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0c0c14] border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Cover Banner with Ambient Glow */}
          <div className="relative h-28 sm:h-32 bg-gradient-to-r from-cyan-950/60 via-purple-950/50 to-zinc-900 border-b border-zinc-850 overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.2),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_70%)]"></div>

            {/* Top Bar with Close Button */}
            <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
              <button
                id="close-user-profile-modal-btn"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-700/60 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Close profile"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Header & Stats */}
          <div className="px-5 sm:px-6 relative pb-4 flex-shrink-0">
            {/* Avatar Row */}
            <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-3">
              <div className="relative">
                <div className="p-1 rounded-full bg-[#0c0c14] border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user.displayName || user.username}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c0c14]" title="Active in the midnight frequency"></div>
              </div>

              {/* Action Buttons: Chat & Follow */}
              <div className="flex items-center space-x-2">
                {!isMe && (
                  <>
                    <button
                      id="profile-chat-btn"
                      type="button"
                      onClick={handleStartChat}
                      className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
                      title="Direct Message"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      id="profile-follow-btn"
                      type="button"
                      onClick={handleToggleFollow}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        isFollowing
                          ? 'bg-zinc-900 border border-zinc-700 text-zinc-300'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </>
                )}
                {isMe && (
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-medium">
                    Your Profile
                  </span>
                )}
              </div>
            </div>

            {/* User Identity Info */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide font-sans">
                  {user.displayName || user.username}
                </h2>
                <span className="p-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60" title="Verified Nightgram Citizen">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>

              {/* Username with Quick Copy Badge */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="group inline-flex items-center space-x-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                  title="Click to copy @username"
                >
                  <span>@{user.username}</span>
                  {copiedUsername ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-zinc-500 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition" />
                  )}
                </button>
                {copiedUsername && (
                  <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs text-zinc-300 pt-1 leading-relaxed whitespace-pre-wrap">
                {user.bio || 'Navigating midnight frequencies and quiet thoughts. 🌌☕'}
              </p>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-900/80">
              <div className="p-2 rounded-xl bg-[#11111a] border border-zinc-850 text-center">
                <div className="text-sm font-black text-white font-mono">{userPosts.length}</div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Posts</div>
              </div>
              <div className="p-2 rounded-xl bg-[#11111a] border border-zinc-850 text-center">
                <div className="text-sm font-black text-cyan-300 font-mono">{localFollowersCount}</div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Followers</div>
              </div>
              <div className="p-2 rounded-xl bg-[#11111a] border border-zinc-850 text-center">
                <div className="text-sm font-black text-purple-300 font-mono">{user.following || 12}</div>
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Following</div>
              </div>
            </div>
          </div>

          {/* Posts Gallery Tab */}
          <div className="px-5 sm:px-6 pt-2 pb-5 flex-1 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Creations & Posts ({userPosts.length})</span>
            </div>

            {userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {userPosts.map((post) => (
                  <div
                    key={`modal-post-${post.id}`}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 group cursor-pointer"
                  >
                    <img
                      src={post.image}
                      alt={post.caption || 'Post image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center space-x-2 text-white text-xs font-bold">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs bg-[#11111a]/40 rounded-xl border border-zinc-900/60 p-4">
                <p>No posts published yet by @{user.username}.</p>
                <p className="text-[11px] text-zinc-600 mt-1">Check back later for midnight frequencies.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Post Viewer Overlay */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-md bg-[#0e0e16] border border-zinc-800 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square bg-black">
              <img
                src={selectedPost.image}
                alt={selectedPost.caption}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-white">@{selectedPost.username}</span>
                <span>{selectedPost.time}</span>
              </div>
              <p className="text-xs text-zinc-300">{selectedPost.caption}</p>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
