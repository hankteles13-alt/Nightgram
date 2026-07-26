import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, UserProfile } from '../types';
import { Edit2, Moon, Grid, Bookmark, Check, Heart, MessageCircle, X, ShieldAlert, LogOut, Camera, Upload } from 'lucide-react';

interface ProfileSectionProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  posts: Post[];
  onLike: (postId: string) => void;
  onSignOut?: () => void;
}

export default function ProfileSection({
  userProfile,
  onUpdateProfile,
  posts,
  onLike,
  onSignOut,
}: ProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.displayName || '');
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(userProfile.displayName || '');
    setEditBio(userProfile.bio || '');
    setEditAvatar(userProfile.avatar || '');
  }, [userProfile.displayName, userProfile.bio, userProfile.avatar]);

  const myPosts = posts.filter((p) => p.userId === userProfile.uid || p.username === userProfile.username);
  const savedPosts = posts.filter((p) => p.savedBy?.includes(userProfile.uid) || p.isSaved);

  const displayPosts = activeTab === 'posts' ? myPosts : savedPosts;

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
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
        setUploadingAvatar(false);
      };
      img.onerror = () => setUploadingAvatar(false);
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

  return (
    <div className="space-y-6 w-full" id="profile-container-wrapper">
      {/* Hidden File Input for Device Storage Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
        id="profile-avatar-file-input"
      />

      {/* Profile Info Card */}
      <div className="bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden" id="profile-banner-card">
        {/* Glow styling */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {!isEditing ? (
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8" id="profile-info-display">
            {/* Clickable Avatar with overlay & file input trigger */}
            <div
              className="relative group cursor-pointer"
              id="profile-avatar-outer-container"
              onClick={() => fileInputRef.current?.click()}
              title="Click to choose profile picture from device storage"
            >
              <div className="w-24 h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition duration-500 relative overflow-hidden">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.username}
                  className="w-full h-full object-cover rounded-full border border-black"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                  <Camera className="w-6 h-6 text-cyan-300 mb-0.5" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Upload</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-black/90 rounded-full p-1.5 border border-zinc-800 group-hover:border-cyan-400 group-hover:scale-110 transition">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>

            {/* User Meta info */}
            <div className="flex-1 text-center md:text-left space-y-4" id="profile-meta-details">
              <div>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <h2 className="text-xl font-bold text-zinc-100 tracking-wide font-sans">
                    {userProfile.displayName}
                  </h2>
                  <span className="text-xs text-cyan-400 font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-950/20 border border-cyan-800/40 w-fit mx-auto md:mx-0">
                    @{userProfile.username}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-2.5 max-w-lg mx-auto md:mx-0">
                  {userProfile.bio}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-b border-zinc-900/80 py-3.5 max-w-sm mx-auto md:mx-0 text-center" id="profile-stats-grid">
                <div>
                  <span className="block text-base font-bold text-zinc-200 font-mono">
                    {myPosts.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    Illuminations
                  </span>
                </div>
                <div>
                  <span className="block text-base font-bold text-zinc-200 font-mono">
                    {userProfile.followers}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    Dreamers
                  </span>
                </div>
                <div>
                  <span className="block text-base font-bold text-zinc-200 font-mono">
                    {userProfile.stars}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    Stars Recd
                  </span>
                </div>
              </div>

              {/* Edit, Device Upload and Log Out buttons */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start" id="profile-action-buttons">
                <button
                  id="change-avatar-direct-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Photo from Device</span>
                </button>
                <button
                  id="edit-profile-trigger"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Profile & Description</span>
                </button>
                {onSignOut && (
                  <button
                    id="sign-out-btn"
                    onClick={onSignOut}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-300 hover:text-red-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSaveProfile} className="space-y-4" id="profile-edit-form">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Update Profile Information
            </h3>

            <div className="space-y-4" id="edit-profile-fields">
              {/* Device Photo Uploader Bar */}
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div
                  className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 group cursor-pointer border border-cyan-500/40"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to select new photo from device"
                >
                  <img src={editAvatar} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera className="w-5 h-5 text-cyan-300" />
                  </div>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-300">
                      Profile Avatar Picture
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Choose from Device Storage</span>
                    </button>
                  </div>
                  <input
                    id="edit-avatar-url-input"
                    type="text"
                    placeholder="Or enter image URL directly..."
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">
                    Display Name
                  </label>
                  <input
                    id="edit-display-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">
                    Username (Read Only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`@${userProfile.username}`}
                    className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">
                  Midnight Biography / Description
                </label>
                <textarea
                  id="edit-bio-textarea"
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-[#121218] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-2" id="edit-profile-actions">
              <button
                type="submit"
                id="save-profile-btn"
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Synchronize</span>
              </button>
              <button
                type="button"
                id="cancel-profile-edit-btn"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabs Selector Header */}
      <div className="flex border-b border-zinc-900/60" id="profile-tabs-header">
        <button
          id="tab-btn-posts"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === 'posts'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>My Chronicles ({myPosts.length})</span>
        </button>

        <button
          id="tab-btn-saved"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === 'saved'
              ? 'border-purple-400 text-purple-400 bg-purple-950/5'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Vibes ({savedPosts.length})</span>
        </button>
      </div>

      {/* Grid of Posts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" id="profile-posts-grid">
        {displayPosts.length > 0 ? (
          displayPosts.map((post) => (
            <div
              key={post.id}
              id={`grid-item-${post.id}`}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group border border-zinc-900/50 hover:border-zinc-800 transition duration-300 shadow-md"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                referrerPolicy="no-referrer"
              />

              {/* Hover Overlay displaying stats */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-4 transition-opacity duration-300">
                <div className="flex items-center space-x-1 text-white">
                  <Heart className="w-4 h-4 fill-white" />
                  <span className="text-xs font-bold font-mono">{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1 text-white">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span className="text-xs font-bold font-mono">{post.comments.length}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 md:col-span-3 py-16 text-center space-y-2.5 border border-zinc-900/50 bg-zinc-950/10 rounded-2xl" id="profile-empty-state">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-center text-zinc-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              No illuminations shared here yet. Go to the feed or tap + to illuminate the screen!
            </p>
          </div>
        )}
      </div>

      {/* Grid Post Detailed Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="post-detail-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              id="post-detail-modal"
              className="relative w-full max-w-md bg-[#0a0a0f] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Banner */}
              <div className="relative aspect-video w-full" id="post-detail-media">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.caption}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  id="close-post-detail-modal"
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-3 right-3 p-1 rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-black/80 transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Content text */}
              <div className="p-5 space-y-4" id="post-detail-info">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-200">@{selectedPost.username}</span>
                    <span className="text-[10px] text-zinc-500">{selectedPost.time}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">{selectedPost.caption}</p>
                </div>

                <div className="flex items-center space-x-4 border-t border-zinc-900/60 pt-3 text-xs" id="post-detail-footer">
                  <div className="flex items-center space-x-1 text-fuchsia-400 font-medium">
                    <Heart className="w-4 h-4 fill-fuchsia-400" />
                    <span>{selectedPost.likes} Stars</span>
                  </div>
                  <div className="flex items-center space-x-1 text-cyan-400 font-medium">
                    <MessageCircle className="w-4 h-4" />
                    <span>{selectedPost.comments.length} Thoughts</span>
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
