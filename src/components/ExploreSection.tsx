import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Users, UserPlus, UserCheck, Image as ImageIcon } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { collection, getDocs, db } from '../lib/supabaseFirestore';

type ExploreUser = UserProfile & { uid: string };

interface ExploreSectionProps {
  currentUser: UserProfile | null;
  posts: Post[];
  onOpenUserProfile: (user: UserProfile) => void;
  onToggleFollow: (user: UserProfile, shouldFollow: boolean) => void;
}

export default function ExploreSection({ currentUser, posts, onOpenUserProfile, onToggleFollow }: ExploreSectionProps) {
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const next: ExploreUser[] = [];
        snapshot.forEach((item) => {
          const data = item.data();
          if (!data.username || item.id === currentUser?.uid) return;
          next.push({
            uid: item.id,
            username: data.username,
            displayName: data.displayName || data.username,
            avatar: data.avatar || '',
            bio: data.bio || '',
            followers: Number(data.followers || 0),
            following: Number(data.following || 0),
            stars: Number(data.stars || 0),
            followersList: Array.isArray(data.followersList) ? data.followersList : [],
            followingList: Array.isArray(data.followingList) ? data.followingList : [],
          });
        });
        if (active) setUsers(next.sort((a, b) => (b.followers || 0) - (a.followers || 0)));
      } catch (error) {
        console.warn('Explore could not load user directory:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadUsers();
    return () => { active = false; };
  }, [currentUser?.uid]);

  const followingList = (currentUser?.followingList || []).map((name) => name.toLowerCase());
  const cleanSearch = search.trim().replace(/^@/, '').toLowerCase();
  const visibleUsers = useMemo(() => users.filter((user) => {
    if (!cleanSearch) return true;
    return user.username.toLowerCase().includes(cleanSearch) ||
      user.displayName.toLowerCase().includes(cleanSearch) ||
      user.bio.toLowerCase().includes(cleanSearch);
  }), [users, cleanSearch]);

  const photoPosts = posts.filter((post) => post.mediaType !== 'video' && !post.videoUrl).slice(0, 24);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-7 overflow-y-auto">
      <header className="space-y-2">
        <div className="text-sm font-semibold text-violet-300">Discover people</div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Find your people.</h1>
        <p className="text-sm text-zinc-400">See what people are sharing on Nightgram.</p>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-300" />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people by @username, name, or bio"
            aria-label="Search people"
            className="w-full bg-[#101019] border border-zinc-800 focus:border-violet-500 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none" />
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> People to discover</h2>
          <span className="text-xs text-zinc-500">{visibleUsers.length} people</span>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c14] p-8 text-center text-sm text-zinc-400">Loading creators…</div>
        ) : loadError ? (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c14] p-8 text-center text-sm text-zinc-400">People could not be loaded. Check your connection and try again.</div>
        ) : visibleUsers.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleUsers.map((user) => {
              const isFollowing = followingList.includes(user.username.toLowerCase());
              return (
                <motion.article layout key={user.uid} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#0c0c14] p-3 sm:p-4">
                  <button onClick={() => onOpenUserProfile(user)} className="shrink-0" aria-label={`Open @${user.username} profile`}>
                    <img src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt=""
                      className="w-14 h-14 rounded-full object-cover border border-zinc-700" referrerPolicy="no-referrer" />
                  </button>
                  <button onClick={() => onOpenUserProfile(user)} className="min-w-0 flex-1 text-left">
                    <div className="font-bold text-white truncate">{user.displayName}</div>
                    <div className="text-xs text-violet-300 truncate">@{user.username}</div>
                    <p className="text-xs text-zinc-500 truncate mt-1">{user.bio || 'Sharing moments on Nightgram.'}</p>
                    <p className="text-[11px] text-zinc-600 mt-1">{user.followers || 0} followers</p>
                  </button>
                  <button onClick={() => onToggleFollow(user, !isFollowing)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition ${isFollowing ? 'border border-zinc-700 bg-zinc-900 text-zinc-300' : 'bg-violet-600 text-white hover:bg-violet-500'}`}
                    aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} @${user.username}`}>
                    {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c14] p-8 text-center text-sm text-zinc-500">No people match that search.</div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-fuchsia-400" /> Photo discovery</h2>
          <span className="text-xs text-zinc-500">{photoPosts.length} photos</span>
        </div>
        {photoPosts.length ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {photoPosts.map((post) => (
              <button key={post.id} onClick={() => onOpenUserProfile(users.find((user) => user.uid === post.userId) || {
                username: post.username, displayName: post.username, avatar: post.userAvatar, bio: '', followers: 0, following: 0, stars: 0,
              })} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 text-left">
                <img src={(post.images && post.images[0]) || post.image} alt={post.caption || 'Community photo'} loading="lazy"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 text-[10px] sm:text-xs text-white opacity-0 group-hover:opacity-100 transition truncate">@{post.username}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c14] p-8 text-center text-sm text-zinc-500">Photo posts will appear here as the community shares them.</div>
        )}
      </section>
    </div>
  );
}
