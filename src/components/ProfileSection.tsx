import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, UserProfile } from '../types';
import AnimatedLikeButton from './AnimatedLikeButton';
import {
  Edit2,
  Grid,
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  X,
  ShieldAlert,
  LogOut,
  Camera,
  Upload,
  Sparkles,
  Share2,
  UserPlus,
  Film,
  Repeat,
  Play,
  Plus,
  Music,
  AtSign,
  Activity,
  Volume2
} from 'lucide-react';
import NocturnalRhythmChart from './NocturnalRhythmChart';

interface ProfileSectionProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  posts: Post[];
  onLike: (postId: string) => void;
  onSignOut?: () => void;
}

interface StoryHighlight {
  id: string;
  title: string;
  coverImage: string;
}

const DEFAULT_HIGHLIGHTS: StoryHighlight[] = [];

export default function ProfileSection({
  userProfile,
  onUpdateProfile,
  posts,
  onLike,
  onSignOut,
}: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'reposts' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [showRhythmChart, setShowRhythmChart] = useState(false);
  const [editName, setEditName] = useState(userProfile.displayName || '');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [highlights, setHighlights] = useState<StoryHighlight[]>(DEFAULT_HIGHLIGHTS);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(userProfile.displayName || '');
    setEditBio(userProfile.bio || '');
    setEditAvatar(userProfile.avatar || '');
  }, [userProfile.displayName, userProfile.bio, userProfile.avatar]);

  const myPosts = posts.filter((p) => p.userId === userProfile.uid || p.username === userProfile.username);
  const savedPosts = posts.filter((p) => p.savedBy?.includes(userProfile.uid) || p.isSaved);

  // Computed tab content lists
  const getDisplayPosts = () => {
    switch (activeTab) {
      case 'posts':
        return myPosts;
      case 'reels':
        return posts.filter((p) => p.image);
      case 'reposts':
        return posts.slice(0, 3);
      case 'saved':
        return savedPosts;
      default:
        return myPosts;
    }
  };

  const displayPosts = getDisplayPosts();

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setEditAvatar(dataUrl);
          if (!isEditing) {
            onUpdateProfile({
              ...userProfile,
              avatar: dataUrl,
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      displayName: editName,
      bio: editBio,
      avatar: editAvatar,
    });
    setIsEditing(false);
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    } else {
      alert(`Sharing profile: @${userProfile.username}`);
    }
  };

  const handleAddHighlight = () => {
    const title = prompt('Enter highlight title:', 'Night Vibe');
    if (!title) return;
    const newHL: StoryHighlight = {
      id: Date.now().toString(),
      title,
      coverImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=200&auto=format&fit=crop&q=80',
    };
    setHighlights((prev) => [...prev, newHL]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 px-1 py-2" id="profile-container-wrapper">
      {/* Hidden File Input for Device Storage Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
        id="profile-avatar-file-input"
      />

      {/* TOP DISPLAY NAME HEADER */}
      <div className="flex items-center justify-between pt-1 px-1" id="profile-top-title-bar">
        <h1 className="text-lg font-bold text-white tracking-wide font-sans flex items-center space-x-1.5">
          <span>{userProfile.displayName || userProfile.username || 'λλRΥλ'}</span>
          <span className="text-zinc-400">🖤</span>
        </h1>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowRhythmChart(!showRhythmChart)}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
            title="Toggle Nocturnal Rhythm Chart"
          >
            <Activity className="w-4 h-4" />
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-red-400 hover:text-red-300 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN PROFILE AVATAR & STATS ROW */}
      <div className="flex items-center justify-between px-1" id="profile-avatar-stats-row">
        {/* Left: Avatar with Floating Top Heart Badge and Bottom '+' Button */}
        <div className="relative group cursor-pointer" id="profile-avatar-wrapper">
          {/* Top Left Heart Badge */}
          <div className="absolute -top-1.5 -left-1.5 z-10 w-6 h-6 rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shadow">
            <Heart className="w-3.5 h-3.5 fill-zinc-400 text-zinc-400" />
          </div>

          {/* Main Circular Image */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-22 h-22 sm:w-24 sm:h-24 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-purple-500 to-indigo-500 shadow-[0_0_18px_rgba(6,182,212,0.3)] hover:scale-102 transition duration-300 relative overflow-hidden"
            title="Click to choose profile picture from device storage"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.username}
              className="w-full h-full object-cover rounded-full border-2 border-[#0a0a0f]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera className="w-5 h-5 text-cyan-300" />
            </div>
          </div>

          {/* Bottom Right '+' Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 z-10 w-6.5 h-6.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center font-bold shadow-md cursor-pointer border-2 border-[#0a0a0f] transition active:scale-95"
            title="Upload photo from device"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Right: Stats Counters */}
        <div className="flex items-center space-x-6 sm:space-x-8 text-center pr-2" id="profile-stats-counters">
          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {myPosts.length}
            </span>
            <span className="text-xs text-zinc-400 font-medium font-sans">posts</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {userProfile.followers || 365}
            </span>
            <span className="text-xs text-zinc-400 font-medium font-sans">followers</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {userProfile.following || 28}
            </span>
            <span className="text-xs text-zinc-400 font-medium font-sans">following</span>
          </div>
        </div>
      </div>

      {/* BIO & MULTILINE QUOTE SECTION */}
      <div className="px-1 space-y-2.5 font-sans" id="profile-bio-section">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center space-x-1">
            <span>{userProfile.displayName || 'Aarya'}</span>
            <span className="text-zinc-400">🖤</span>
          </h2>
          <div className="text-xs text-zinc-200 font-medium leading-relaxed uppercase tracking-wide mt-1 space-y-0.5">
            {userProfile.bio ? (
              userProfile.bio.split('\n').map((line, idx) => (
                <p key={`bio-line-${idx}`} className="flex items-center space-x-1 flex-wrap">
                  <span>{line}</span>
                </p>
              ))
            ) : (
              <>
                <p>DON'T TRY TO CHECK MY MISTAKES, I'M AFRAID YOU MIGHT BE ONE OF THEM.🖤</p>
                <p>CHOOSE A GOOD HEART, NOT A GOOD FACE.🖤</p>
              </>
            )}
          </div>
        </div>

        {/* METADATA PILLS: THREAD & MUSIC BADGE */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 pt-0.5">
          {/* Threads / Handle Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#12121e] border border-zinc-800 text-xs font-semibold text-zinc-300">
            <AtSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>01.30.am_</span>
          </div>

          {/* Music Track Badge with Play toggle */}
          <button
            type="button"
            onClick={() => setIsPlayingMusic(!isPlayingMusic)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition cursor-pointer ${
              isPlayingMusic
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-[#12121e] border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {isPlayingMusic ? (
              <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            )}
            <span>Infinity • Jaymes Young</span>
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS ROW: EDIT PROFILE | SHARE PROFILE | +PERSON */}
      <div className="grid grid-cols-12 gap-2 pt-1 px-1" id="profile-action-buttons-row">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="col-span-5 py-2 px-3 rounded-xl bg-[#141420] hover:bg-[#1a1a2a] border border-zinc-800/90 text-white text-xs font-bold tracking-wide transition cursor-pointer text-center"
        >
          Edit profile
        </button>

        <button
          type="button"
          onClick={handleShareProfile}
          className="col-span-5 py-2 px-3 rounded-xl bg-[#141420] hover:bg-[#1a1a2a] border border-zinc-800/90 text-white text-xs font-bold tracking-wide transition cursor-pointer text-center"
        >
          Share profile
        </button>

        <button
          type="button"
          onClick={() => alert('Discovering Nightgram dreamers...')}
          className="col-span-2 py-2 rounded-xl bg-[#141420] hover:bg-[#1a1a2a] border border-zinc-800/90 text-zinc-200 hover:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center"
          title="Discover people"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* EDIT PROFILE MODAL / FORM INLINE */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0a12] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white tracking-wide">Edit Profile</h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Photo uploader */}
                <div className="flex items-center space-x-3 bg-[#12121c] p-3 rounded-xl border border-zinc-800">
                  <img src={editAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-cyan-500/40" />
                  <div className="flex-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-cyan-950 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose from Device</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Bio / Status Quote
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STORY HIGHLIGHTS ROW WITH CIRCULAR ITEMS & SMALL HEART BADGES BELOW */}
      <div className="pt-2 px-1" id="profile-story-highlights-row">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
          {/* Add Highlight Button */}
          <button
            type="button"
            onClick={handleAddHighlight}
            className="flex flex-col items-center flex-shrink-0 space-y-1.5 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 group-hover:border-cyan-400 flex items-center justify-center bg-[#0e0e16] transition">
              <Plus className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400" />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">New</span>
          </button>

          {/* Highlights List */}
          {highlights.map((hl, hlIndex) => (
            <div key={`${hl.id}-${hlIndex}`} className="flex flex-col items-center flex-shrink-0 space-y-1 group cursor-pointer">
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-zinc-800 via-zinc-700 to-zinc-900 group-hover:from-cyan-400 group-hover:to-purple-500 transition duration-300">
                  <img
                    src={hl.coverImage}
                    alt={hl.title}
                    className="w-full h-full object-cover rounded-full border-2 border-[#0a0a0f]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Heart Badge Underneath Circle as shown in format */}
              <div className="flex items-center justify-center pt-0.5">
                <Heart className="w-3 h-3 text-zinc-500 fill-zinc-500 group-hover:text-purple-400 group-hover:fill-purple-400 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLLAPSIBLE NOCTURNAL RHYTHM CHART ANALYTICS */}
      <AnimatePresence>
        {showRhythmChart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <NocturnalRhythmChart posts={myPosts} username={userProfile.username} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB NAVIGATION BAR (4 ICON TABS WITH UNDERLINE INDICATOR) */}
      <div className="border-t border-b border-zinc-900/80 pt-1" id="profile-tabs-navigation">
        <div className="grid grid-cols-4 w-full">
          {/* Tab 1: Grid (Posts) */}
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`py-3 flex flex-col items-center justify-center relative cursor-pointer transition ${
              activeTab === 'posts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Posts"
          >
            <Grid className="w-5 h-5" />
            {activeTab === 'posts' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            )}
          </button>

          {/* Tab 2: Reels / Video */}
          <button
            type="button"
            onClick={() => setActiveTab('reels')}
            className={`py-3 flex flex-col items-center justify-center relative cursor-pointer transition ${
              activeTab === 'reels' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Reels"
          >
            <Film className="w-5 h-5" />
            {activeTab === 'reels' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            )}
          </button>

          {/* Tab 3: Reposts / Loops */}
          <button
            type="button"
            onClick={() => setActiveTab('reposts')}
            className={`py-3 flex flex-col items-center justify-center relative cursor-pointer transition ${
              activeTab === 'reposts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Reposts"
          >
            <Repeat className="w-5 h-5" />
            {activeTab === 'reposts' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            )}
          </button>

          {/* Tab 4: Saved / Tagged */}
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`py-3 flex flex-col items-center justify-center relative cursor-pointer transition ${
              activeTab === 'saved' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Saved Vibes"
          >
            <Bookmark className="w-5 h-5" />
            {activeTab === 'saved' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            )}
          </button>
        </div>
      </div>

      {/* 3-COLUMN CONTENT MEDIA GRID */}
      <div className="grid grid-cols-3 gap-1" id="profile-media-grid">
        {displayPosts.length > 0 ? (
          displayPosts.map((post, postIndex) => (
            <div
              key={`${post.id}-${postIndex}`}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square bg-[#0c0c14] overflow-hidden cursor-pointer group"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Hover Stats */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-3 transition-opacity duration-200">
                <div className="flex items-center space-x-1 text-white text-xs font-bold">
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1 text-white text-xs font-bold">
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-zinc-500 text-xs font-sans">
            No media items to display in this tab yet.
          </div>
        )}
      </div>

      {/* POST DETAIL INSPECTION MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0a0a0f] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.caption}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-3 right-3 p-1 rounded-full bg-black/60 text-zinc-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">@{selectedPost.username}</span>
                  <span className="text-[10px] text-zinc-500">{selectedPost.time}</span>
                </div>
                <p className="text-xs text-zinc-300 font-sans">{selectedPost.caption}</p>

                <div className="flex items-center space-x-4 border-t border-zinc-900 pt-3 text-xs">
                  <AnimatedLikeButton
                    postId={selectedPost.id}
                    isLiked={!!selectedPost.isLiked}
                    likesCount={selectedPost.likes}
                    onLike={onLike}
                    size="sm"
                  />
                  <div className="flex items-center space-x-1 text-cyan-400 font-semibold">
                    <MessageCircle className="w-4 h-4" />
                    <span>{selectedPost.comments?.length || 0} Thoughts</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
