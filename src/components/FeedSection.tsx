import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment, UserProfile } from '../types';
import { MOODS } from '../data';
import { Heart, MessageCircle, Bookmark, MapPin, Search, Send, Sparkles, AlertCircle, MessageSquare, X, Tag, SlidersHorizontal, Compass } from 'lucide-react';
import AnimatedLikeButton from './AnimatedLikeButton';

interface FeedSectionProps {
  posts: Post[];
  currentUser?: UserProfile | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
}

export default function FeedSection({
  posts,
  currentUser,
  onLike,
  onSave,
  onAddComment,
  selectedMood,
  setSelectedMood,
  onOpenChatWithUser,
}: FeedSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'location' | 'hashtag' | 'mood'>('all');
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [newCommentTexts, setNewCommentTexts] = useState<{ [postId: string]: string }>({});
  const [doubleClickedPostId, setDoubleClickedPostId] = useState<string | null>(null);

  // Popular quick search suggestion tags
  const POPULAR_SUGGESTIONS = [
    { label: '#cyberpunk', type: 'hashtag' as const },
    { label: 'Tokyo, Japan', type: 'location' as const },
    { label: 'Quiet Hours', type: 'mood' as const },
    { label: '#lofi', type: 'hashtag' as const },
    { label: 'Shibuya', type: 'location' as const },
    { label: '#neon', type: 'hashtag' as const },
  ];

  // Filter posts based on search query, scope, and selected mood
  const filteredPosts = posts.filter((post) => {
    const matchesMood = selectedMood === 'All Vibes' || post.mood === selectedMood;

    if (!searchQuery.trim()) {
      return matchesMood;
    }

    const q = searchQuery.toLowerCase().trim();
    const queryNoHash = q.startsWith('#') ? q.slice(1) : q;

    let matchesSearch = false;
    if (searchScope === 'location') {
      matchesSearch = post.location.toLowerCase().includes(q);
    } else if (searchScope === 'hashtag') {
      matchesSearch = post.tags.some((tag) => tag.toLowerCase().includes(queryNoHash));
    } else if (searchScope === 'mood') {
      matchesSearch = post.mood.toLowerCase().includes(q);
    } else {
      // 'all' scope checks caption, author, location, mood, and tags
      matchesSearch =
        post.caption.toLowerCase().includes(q) ||
        post.username.toLowerCase().includes(q) ||
        post.location.toLowerCase().includes(q) ||
        post.mood.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(queryNoHash));
    }

    return matchesMood && matchesSearch;
  });

  const handleQuickSuggestion = (item: { label: string; type: 'all' | 'location' | 'hashtag' | 'mood' }) => {
    setSearchQuery(item.label);
    setSearchScope(item.type);
  };

  const handleDoubleTap = (postId: string) => {
    onLike(postId);
    setDoubleClickedPostId(postId);
    setTimeout(() => {
      setDoubleClickedPostId(null);
    }, 800);
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentTexts[postId]?.trim();
    if (!text) return;

    onAddComment(postId, text);
    setNewCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    // Ensure comments tray stays expanded
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="space-y-6 w-full" id="feed-wrapper">
      {/* Search Bar & Scope Filters Panel */}
      <div className="bg-[#0e0e13]/80 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/80 space-y-3.5 shadow-xl" id="search-filter-panel">
        {/* Main Search Input */}
        <div className="relative" id="search-input-wrapper">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/90 w-4.5 h-4.5 pointer-events-none" />
          <input
            id="search-feed-input"
            type="text"
            placeholder={
              searchScope === 'location'
                ? 'Search locations (e.g. Tokyo, Seattle, Rainy Cafe)...'
                : searchScope === 'hashtag'
                ? 'Search hashtags (e.g. cyberpunk, lofi, neon)...'
                : searchScope === 'mood'
                ? 'Search moods (e.g. Quiet Hours, Urban Neon)...'
                : 'Search posts by location, hashtag, mood, or text...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161f] border border-zinc-800/80 rounded-xl py-2.5 pl-11 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
          />
          {searchQuery && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scope Filters & Quick Suggestions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5" id="search-scope-toolbar">
          {/* Scope Selectors */}
          <div className="flex items-center space-x-1 bg-[#121218] p-1 rounded-xl border border-zinc-800/80" id="search-scope-tabs">
            {(
              [
                { id: 'all', label: 'All', icon: <Compass className="w-3 h-3" /> },
                { id: 'location', label: 'Location', icon: <MapPin className="w-3 h-3 text-cyan-400" /> },
                { id: 'hashtag', label: 'Hashtag', icon: <Tag className="w-3 h-3 text-purple-400" /> },
                { id: 'mood', label: 'Mood', icon: <Sparkles className="w-3 h-3 text-fuchsia-400" /> },
              ] as const
            ).map((scope) => (
              <button
                key={scope.id}
                id={`search-scope-${scope.id}`}
                onClick={() => setSearchScope(scope.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  searchScope === scope.id
                    ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {scope.icon}
                <span>{scope.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Search Tag Suggestions */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none" id="quick-search-tags">
            <span className="text-[10px] text-zinc-500 uppercase font-mono shrink-0 hidden sm:inline">Try:</span>
            {POPULAR_SUGGESTIONS.map((sug) => (
              <button
                type="button"
                key={sug.label}
                id={`quick-search-${sug.label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`}
                onClick={() => handleQuickSuggestion(sug)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-300 transition shrink-0 cursor-pointer"
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Result Feedback Bar */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-900" id="search-feedback-bar">
            <span>
              Found <strong className="text-cyan-300">{filteredPosts.length}</strong> {filteredPosts.length === 1 ? 'post' : 'posts'} matching{' '}
              <span className="text-zinc-200 font-semibold">"{searchQuery}"</span>
              {searchScope !== 'all' && <span className="text-zinc-500 ml-1">in {searchScope}</span>}
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchScope('all');
              }}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Mood Filter Rails */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-zinc-900/80" id="mood-rail">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.name;
            return (
              <button
                key={mood.name}
                id={`mood-btn-${mood.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedMood(mood.name)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/25 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>{mood.icon}</span>
                <span>{mood.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Feed - Clean Instagram Mockup Format */}
      <div className="space-y-4 max-w-[480px] sm:max-w-xl mx-auto w-full" id="posts-feed-container">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, postIndex) => (
            <motion.article
              key={`${post.id}-${postIndex}`}
              id={`post-card-${post.id}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35 }}
              className="bg-[#000000] border-y sm:border sm:rounded-xl border-zinc-800/80 overflow-hidden flex flex-col shadow-lg"
            >
              {/* Post Header: Circular gradient story ring around avatar + username + 3 dots menu */}
              <div className="px-3.5 py-2.5 flex items-center justify-between" id={`post-header-${post.id}`}>
                <div className="flex items-center space-x-2.5 cursor-pointer">
                  {/* Instagram Story Gradient Ring around author avatar */}
                  <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]">
                    <div className="w-full h-full rounded-full p-[1.5px] bg-black">
                      <img
                        src={
                          currentUser && (post.userId === currentUser.uid || post.username === currentUser.username)
                            ? currentUser.avatar
                            : post.userAvatar
                        }
                        alt={post.username}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-zinc-100 tracking-tight leading-none hover:underline">
                      {post.username}
                    </span>
                    {post.location && (
                      <span className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5 truncate max-w-[170px]">
                        {post.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {onOpenChatWithUser && (
                    <button
                      type="button"
                      id={`whisper-post-author-btn-${post.id}`}
                      onClick={() =>
                        onOpenChatWithUser({
                          uid: post.userId,
                          username: post.username,
                          displayName: post.username,
                          avatar: post.userAvatar,
                        })
                      }
                      className="p-1.5 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800/60"
                      title={`Message @${post.username}`}
                    >
                      <Send className="w-4 h-4 -rotate-45" />
                    </button>
                  )}
                  {/* Instagram 3-dots more menu */}
                  <button
                    type="button"
                    id={`post-more-btn-${post.id}`}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
                    title="More options"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Post Media: Full width clean photo canvas */}
              <div
                id={`post-image-wrapper-${post.id}`}
                className="relative aspect-square w-full bg-[#0a0a0f] overflow-hidden group cursor-pointer select-none"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Double tap heart animation overlay */}
                <AnimatePresence>
                  {doubleClickedPostId === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0.5, 1.25, 1], opacity: [0, 1, 0] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                      <Heart className="w-24 h-24 text-[#ff3040] fill-[#ff3040] drop-shadow-[0_0_20px_rgba(255,48,64,0.8)]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Instagram Action Row: Like (Red Heart), Comment, Share/Paper Plane, Bookmark */}
              <div className="px-3.5 pt-3 pb-1 flex items-center justify-between" id={`post-actions-${post.id}`}>
                <div className="flex items-center space-x-4">
                  {/* Heart / Like button matching exact red heart in mockup */}
                  <button
                    id={`like-btn-${post.id}`}
                    onClick={() => onLike(post.id)}
                    className="transition-transform active:scale-75 cursor-pointer"
                    title={post.isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      className={`w-[26px] h-[26px] transition-colors ${
                        post.isLiked
                          ? 'text-[#ed4956] fill-[#ed4956]'
                          : 'text-zinc-100 hover:text-zinc-400'
                      }`}
                    />
                  </button>

                  {/* Comment Bubble Icon */}
                  <button
                    id={`comment-toggle-btn-${post.id}`}
                    onClick={() => toggleComments(post.id)}
                    className="text-zinc-100 hover:text-zinc-400 transition-colors cursor-pointer"
                    title="Comment"
                  >
                    <svg className="w-[24px] h-[24px] fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" strokeLinejoin="round" strokeLinecap="round"/>
                    </svg>
                  </button>

                  {/* Share / Paper Plane Icon */}
                  <button
                    id={`share-btn-${post.id}`}
                    onClick={() => {
                      if (onOpenChatWithUser) {
                        onOpenChatWithUser({
                          uid: post.userId,
                          username: post.username,
                          displayName: post.username,
                          avatar: post.userAvatar,
                        });
                      }
                    }}
                    className="text-zinc-100 hover:text-zinc-400 transition-colors cursor-pointer"
                    title="Share"
                  >
                    <svg className="w-[24px] h-[24px] fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Bookmark / Save Icon */}
                <button
                  id={`save-btn-${post.id}`}
                  onClick={() => onSave(post.id)}
                  className="text-zinc-100 hover:text-zinc-400 transition-colors cursor-pointer"
                  title="Save"
                >
                  <Bookmark
                    className={`w-[24px] h-[24px] ${
                      post.isSaved ? 'text-zinc-100 fill-zinc-100' : 'text-zinc-100 fill-none'
                    }`}
                  />
                </button>
              </div>

              {/* Likes Count in exact mockup format: "10547 Likes" */}
              <div className="px-3.5 pt-1 text-[13px] font-bold text-zinc-100 tracking-tight" id={`post-likes-${post.id}`}>
                {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
              </div>

              {/* Caption in exact mockup format: @username Caption text with blue hashtags */}
              <div className="px-3.5 pt-1 pb-1 text-[13px] leading-snug text-zinc-200" id={`post-caption-box-${post.id}`}>
                <span className="font-bold text-zinc-100 mr-2 cursor-pointer hover:underline">
                  @{post.username}
                </span>
                <span className="text-zinc-200 font-normal">{post.caption}</span>

                {/* Hashtags in exact cyan/blue color format from mockup */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-[13px] font-normal" id={`tags-container-${post.id}`}>
                    {post.tags.map((tag, tagIdx) => (
                      <span
                        key={`${post.id}-tag-${tag}-${tagIdx}`}
                        className="text-[#3897f0] hover:underline cursor-pointer"
                        onClick={() => setSearchQuery(`#${tag}`)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View comments toggle */}
              {post.comments.length > 0 && (
                <button
                  id={`view-comments-btn-${post.id}`}
                  onClick={() => toggleComments(post.id)}
                  className="text-left px-3.5 pt-1 text-[12px] text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                >
                  {expandedComments[post.id]
                    ? 'Hide comments'
                    : `View all ${post.comments.length} comments`}
                </button>
              )}

              {/* Comments drawer */}
              <AnimatePresence>
                {expandedComments[post.id] && post.comments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    id={`comments-drawer-${post.id}`}
                    className="px-3.5 pt-2 pb-1 space-y-2 overflow-hidden"
                  >
                    {post.comments.map((comment, commentIdx) => (
                      <div
                        key={`${post.id}-comment-${comment.id || commentIdx}-${commentIdx}`}
                        className="flex items-start space-x-2 text-[12px]"
                        id={`comment-${comment.id || commentIdx}`}
                      >
                        <span className="font-bold text-zinc-100 shrink-0">@{comment.username}</span>
                        <span className="text-zinc-300 flex-1">{comment.text}</span>
                        <span className="text-[10px] text-zinc-500 shrink-0">{comment.time}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post timestamp */}
              <div className="px-3.5 pt-1 pb-2 text-[10px] uppercase text-zinc-500 font-medium tracking-wider">
                {post.time}
              </div>

              {/* Comment Input Field */}
              <form
                id={`comment-form-${post.id}`}
                onSubmit={(e) => handleCommentSubmit(post.id, e)}
                className="px-3.5 py-2.5 border-t border-zinc-900 flex items-center space-x-2.5"
              >
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={currentUser?.displayName || "Me"}
                  className="w-6 h-6 object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
                <input
                  id={`comment-input-${post.id}`}
                  type="text"
                  placeholder="Add a comment..."
                  value={newCommentTexts[post.id] || ''}
                  onChange={(e) =>
                    setNewCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  className="flex-1 bg-transparent border-none text-[12px] text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
                {newCommentTexts[post.id]?.trim() && (
                  <button
                    id={`submit-comment-${post.id}`}
                    type="submit"
                    className="text-[#0095f6] font-semibold text-[12px] hover:text-[#1877f2] transition cursor-pointer"
                  >
                    Post
                  </button>
                )}
              </form>
            </motion.article>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl text-center space-y-3 shadow-xl" id="feed-empty-state">
            <div className="p-4 rounded-full bg-cyan-950/20 border border-cyan-800/40 text-cyan-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-base">The Midnight streets are quiet...</h3>
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
              No matching vibes found for "{searchQuery || selectedMood}". Try clearing your filters or creating a post of your own to illuminate this space.
            </p>
            {(searchQuery || selectedMood !== 'All Vibes' || searchScope !== 'all') && (
              <button
                id="reset-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSearchScope('all');
                  setSelectedMood('All Vibes');
                }}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs hover:bg-zinc-800 hover:text-white transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
