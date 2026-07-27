import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment, UserProfile } from '../types';
import { MOODS } from '../data';
import { Heart, MessageCircle, Bookmark, MapPin, Search, Send, Sparkles, AlertCircle, MessageSquare, X, Tag, SlidersHorizontal, Compass } from 'lucide-react';

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

      {/* Posts Feed */}
      <div className="space-y-6" id="posts-feed-container">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.article
              key={post.id}
              id={`post-card-${post.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-zinc-900/60" id={`post-header-${post.id}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                    <img
                      src={
                        currentUser && (post.userId === currentUser.uid || post.username === currentUser.username)
                          ? currentUser.avatar
                          : post.userAvatar
                      }
                      alt={post.username}
                      className="w-full h-full object-cover rounded-full border border-black"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-semibold text-zinc-100">{post.username}</span>
                      {post.mood && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                          {post.mood}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-zinc-500 text-[11px]">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-cyan-400/80" />
                      <span className="truncate max-w-[150px]">{post.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cyan-950/50 hover:bg-cyan-900/80 border border-cyan-800/50 text-cyan-300 rounded-lg text-[10px] font-semibold cursor-pointer transition"
                      title={`Send a whisper to @${post.username}`}
                    >
                      <MessageSquare className="w-3 h-3 text-cyan-400" />
                      <span>Chat</span>
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-600 font-medium">{post.time}</span>
                </div>
              </div>

              {/* Photo Area */}
              <div
                id={`post-image-wrapper-${post.id}`}
                className="relative aspect-square md:aspect-video w-full bg-black overflow-hidden group cursor-pointer"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Cyber gradient shade overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>

                {/* Double click heart overlay */}
                <AnimatePresence>
                  {doubleClickedPostId === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                      <Heart className="w-20 h-20 text-fuchsia-500 fill-fuchsia-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex items-center justify-between" id={`post-actions-${post.id}`}>
                <div className="flex items-center space-x-4">
                  <button
                    id={`like-btn-${post.id}`}
                    onClick={() => onLike(post.id)}
                    className="flex items-center space-x-1.5 group text-zinc-400 hover:text-fuchsia-400 transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-5.5 h-5.5 transition-all duration-300 group-active:scale-130 ${
                        post.isLiked ? 'text-fuchsia-500 fill-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]' : ''
                      }`}
                    />
                    <span className={`text-xs font-medium ${post.isLiked ? 'text-fuchsia-400' : 'text-zinc-500'}`}>
                      {post.likes}
                    </span>
                  </button>

                  <button
                    id={`comment-toggle-btn-${post.id}`}
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-1.5 text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-5.5 h-5.5" />
                    <span className="text-xs font-medium text-zinc-500">{post.comments.length}</span>
                  </button>
                </div>

                <button
                  id={`save-btn-${post.id}`}
                  onClick={() => onSave(post.id)}
                  className="text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Bookmark
                    className={`w-5.5 h-5.5 ${
                      post.isSaved ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Caption & Tags */}
              <div className="px-4 pb-3 space-y-1.5" id={`post-caption-box-${post.id}`}>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                  <span className="font-bold text-zinc-100 mr-2">{post.username}</span>
                  {post.caption}
                </p>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" id={`tags-container-${post.id}`}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-cyan-400 font-medium hover:underline cursor-pointer"
                        onClick={() => setSearchQuery(`#${tag}`)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Collapsed comments status */}
              {post.comments.length > 0 && !expandedComments[post.id] && (
                <button
                  id={`view-comments-btn-${post.id}`}
                  onClick={() => toggleComments(post.id)}
                  className="text-left px-4 pb-3 text-xs text-zinc-500 hover:text-zinc-400 transition font-medium"
                >
                  View all {post.comments.length} comments
                </button>
              )}

              {/* Comments Section list */}
              <AnimatePresence>
                {expandedComments[post.id] && post.comments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    id={`comments-drawer-${post.id}`}
                    className="px-4 pb-3 border-t border-zinc-900/60 pt-3 space-y-3 overflow-hidden"
                  >
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2.5 text-xs" id={`comment-${comment.id}`}>
                        <img
                          src={
                            currentUser && (comment.userId === currentUser.uid || comment.username === currentUser.username)
                              ? currentUser.avatar
                              : comment.userAvatar
                          }
                          alt={comment.username}
                          className="w-6 h-6 object-cover rounded-full border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 bg-[#121218]/40 border border-zinc-900/50 p-2 rounded-xl">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-zinc-200">{comment.username}</span>
                            <span className="text-[10px] text-zinc-600">{comment.time}</span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed font-sans">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comment Input Form */}
              <form
                id={`comment-form-${post.id}`}
                onSubmit={(e) => handleCommentSubmit(post.id, e)}
                className="p-3 border-t border-zinc-900/60 bg-[#0d0d12]/30 flex items-center space-x-2.5"
              >
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={currentUser?.displayName || "Me"}
                  className="w-7 h-7 object-cover rounded-full border border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                  referrerPolicy="no-referrer"
                />
                <input
                  id={`comment-input-${post.id}`}
                  type="text"
                  placeholder="Share a late-night thought..."
                  value={newCommentTexts[post.id] || ''}
                  onChange={(e) =>
                    setNewCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  className="flex-1 bg-[#121218] border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
                <button
                  id={`submit-comment-${post.id}`}
                  type="submit"
                  disabled={!newCommentTexts[post.id]?.trim()}
                  className={`p-1.5 rounded-xl border transition ${
                    newCommentTexts[post.id]?.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-transparent text-white hover:opacity-90 cursor-pointer'
                      : 'bg-zinc-900 border-zinc-800/80 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
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
