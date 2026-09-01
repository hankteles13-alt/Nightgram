import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment, UserProfile } from '../types';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Music,
  Repeat2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Check,
  Smile,
  Copy,
  Link2,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Info,
  ExternalLink,
  MessageSquare,
  RotateCw
} from 'lucide-react';
import AnimatedLikeButton from './AnimatedLikeButton';
import AvatarStatusIndicator from './AvatarStatusIndicator';

interface FeedSectionProps {
  posts: Post[];
  currentUser?: UserProfile | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
  onRefreshFeed?: () => void;
  isRefreshing?: boolean;
}

// Quick share friend list
const SHARE_FRIENDS: any[] = [];

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '🥳', '😍', '😢', '😂', '😮'];

export default function FeedSection({
  posts,
  currentUser,
  onLike,
  onSave,
  onAddComment,
  selectedMood,
  setSelectedMood,
  onOpenChatWithUser,
  onRefreshFeed,
  isRefreshing = false,
}: FeedSectionProps) {
  // Carousel Slide State per Post
  const [carouselIndex, setCarouselIndex] = useState<{ [postId: string]: number }>({});
  // Mute Audio State per Post
  const [mutedPosts, setMutedPosts] = useState<{ [postId: string]: boolean }>({});
  // Likes State for local demo sync
  const [localLikes, setLocalLikes] = useState<{ [postId: string]: { isLiked: boolean; count: number } }>({});
  // Repost State & Undo Notification
  const [repostedPosts, setRepostedPosts] = useState<{ [postId: string]: boolean }>({});
  const [showRepostUndoBanner, setShowRepostUndoBanner] = useState(false);
  const [lastRepostedPostId, setLastRepostedPostId] = useState<string | null>(null);
  // Saved Posts State
  const [savedPosts, setSavedPosts] = useState<{ [postId: string]: boolean }>({});
  // Double tap heart animation
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ [postId: string]: boolean }>({});

  // Slide-up Comments Drawer
  const [activeCommentPost, setActiveCommentPost] = useState<any | null>(null);
  const [commentInputText, setCommentInputText] = useState('');
  const [localComments, setLocalComments] = useState<{ [postId: string]: any[] }>({});

  // Share Sheet State
  const [activeSharePost, setActiveSharePost] = useState<any | null>(null);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharedSentUsers, setSharedSentUsers] = useState<{ [userId: string]: boolean }>({});

  // Ad Interest Feedback Box state
  const [adFeedbackDismissed, setAdFeedbackDismissed] = useState(false);
  const [adFeedbackSelected, setAdFeedbackSelected] = useState<'interested' | 'not_interested' | null>(null);

  // Formatted User Posts from Firestore/Props
  const combinedFeedPosts = useMemo(() => {
    return posts.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.username,
      userAvatar: p.userAvatar,
      hasStory: true,
      audioTrack: p.mood ? `Nightgram Radio • ${p.mood} Frequency` : 'Nightgram Ambient Lounge',
      images: [p.image],
      caption: p.caption,
      likesCount: p.likes || 0,
      commentsCount: p.comments?.length || 0,
      repostsCount: 0,
      timeAgo: p.time || 'Just now',
      isFromDb: true,
      isSponsored: false,
      commentsList: p.comments || [],
    }));
  }, [posts]);

  // Handle Like
  const handleToggleLike = (postId: string, isFromDb?: boolean) => {
    if (isFromDb) {
      onLike(postId);
    }
    setLocalLikes((prev) => {
      const current = prev[postId] || { isLiked: false, count: 0 };
      return {
        ...prev,
        [postId]: {
          isLiked: !current.isLiked,
          count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
        },
      };
    });
  };

  // Handle Double Tap on Image
  const handleDoubleTap = (postId: string, isFromDb?: boolean) => {
    handleToggleLike(postId, isFromDb);
    setDoubleTapHeart((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setDoubleTapHeart((prev) => ({ ...prev, [postId]: false }));
    }, 800);
  };

  // Handle Repost
  const handleToggleRepost = (postId: string) => {
    const nextState = !repostedPosts[postId];
    setRepostedPosts((prev) => ({ ...prev, [postId]: nextState }));
    if (nextState) {
      setLastRepostedPostId(postId);
      setShowRepostUndoBanner(true);
      setTimeout(() => setShowRepostUndoBanner(false), 4000);
    }
  };

  // Handle Carousel Next / Prev
  const handleCarouselNav = (postId: string, total: number, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => {
      const current = prev[postId] || 0;
      if (direction === 'next') {
        return { ...prev, [postId]: Math.min(total - 1, current + 1) };
      } else {
        return { ...prev, [postId]: Math.max(0, current - 1) };
      }
    });
  };

  // Handle Comment Add in Slide-Up Drawer
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCommentPost || !commentInputText.trim()) return;

    const newCommentObj = {
      id: `c_${Date.now()}`,
      username: currentUser?.username || 'hankteles',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      text: commentInputText.trim(),
      time: 'Just now',
      likes: 0,
    };

    if (activeCommentPost.isFromDb) {
      onAddComment(activeCommentPost.id, commentInputText.trim());
    }

    setLocalComments((prev) => ({
      ...prev,
      [activeCommentPost.id]: [...(prev[activeCommentPost.id] || []), newCommentObj],
    }));

    setCommentInputText('');
  };

  // Handle Share Send
  const handleSendShareToFriend = (friendId: string) => {
    setSharedSentUsers((prev) => ({ ...prev, [friendId]: true }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 select-none" id="instagram-feed-layout">
      {/* 1. REPOST UNDO TOAST BANNER */}
      <AnimatePresence>
        {showRepostUndoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#12121c] border border-cyan-500/40 text-zinc-100 px-4 py-2.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center space-x-3 text-xs"
          >
            <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
              <Repeat2 className="w-4 h-4 text-cyan-400" />
              <span>Reposted to your profile</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (lastRepostedPostId) {
                  setRepostedPosts((prev) => ({ ...prev, [lastRepostedPostId]: false }));
                }
                setShowRepostUndoBanner(false);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Sub-Header with Quick Refresh Button & Active Status */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400" id="feed-top-subbar">
        <div className="flex items-center space-x-1.5 font-medium text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Latest Moments</span>
        </div>
        {onRefreshFeed && (
          <button
            type="button"
            id="feed-manual-refresh-btn"
            onClick={onRefreshFeed}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 py-1 px-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/90 text-zinc-300 hover:text-cyan-400 transition cursor-pointer text-[11px] disabled:opacity-50"
            title="Re-fetch posts from Firestore"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* 2. POST CARDS STREAM */}
      <div className="space-y-4 sm:space-y-6" id="instagram-posts-stream">
        {combinedFeedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0b0b14]/80 border border-zinc-800/80 rounded-2xl shadow-xl">
            <div className="w-16 h-16 rounded-full bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-1.5">No posts yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-4">
              Your feed is a clean canvas under the night sky. Tap the camera or compose button to share your first midnight moment.
            </p>
          </div>
        ) : (
          combinedFeedPosts.map((post, postIndex) => {
          const postSlide = carouselIndex[post.id] || 0;
          const totalSlides = post.images.length;
          const isLiked = localLikes[post.id]?.isLiked ?? false;
          const likesDisplay = (localLikes[post.id]?.count ?? post.likesCount) + (isLiked ? 1 : 0);
          const isReposted = !!repostedPosts[post.id];
          const repostCount = post.repostsCount + (isReposted ? 1 : 0);
          const isSaved = !!savedPosts[post.id];
          const isMuted = !!mutedPosts[post.id];
          const isHeartPopping = !!doubleTapHeart[post.id];
          const commentsArray = localComments[post.id] || post.commentsList || [];

          return (
            <article
              key={`feed-post-${post.id || 'p'}-${postIndex}`}
              id={`instagram-post-${post.id}`}
              className="bg-[#0b0b14] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl hover:border-zinc-700/80 transition group"
            >
              {/* Post Header: Avatar + Username + Audio Subtitle + 3-dots */}
              <div className="px-3.5 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Story ring on avatar */}
                  <div
                    className="relative cursor-pointer"
                    onClick={() =>
                      onOpenChatWithUser?.({
                        username: post.username,
                        displayName: post.displayName || post.username,
                        avatar: post.userAvatar,
                      })
                    }
                  >
                    <div
                      className={`p-[2px] rounded-full ${
                        post.hasStory
                          ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-[0_0_8px_rgba(225,48,108,0.4)]'
                          : 'bg-zinc-800'
                      }`}
                    >
                      <img
                        src={post.userAvatar}
                        alt={post.username}
                        className="w-8.5 h-8.5 rounded-full object-cover border border-[#0b0b14]"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span
                        onClick={() =>
                          onOpenChatWithUser?.({
                            username: post.username,
                            displayName: post.displayName || post.username,
                            avatar: post.userAvatar,
                          })
                        }
                        className="text-xs sm:text-sm font-bold text-zinc-100 hover:text-cyan-300 transition cursor-pointer truncate"
                      >
                        {post.username}
                      </span>
                      {post.isSponsored && (
                        <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-medium text-zinc-400">
                          Ad
                        </span>
                      )}
                    </div>

                    {/* Audio track line */}
                    {post.audioTrack && (
                      <div className="flex items-center space-x-1 text-[11px] text-zinc-400 truncate max-w-[220px] sm:max-w-xs">
                        <Music className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 animate-pulse" />
                        <span className="truncate">{post.audioTrack}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 3-dots */}
                <button
                  type="button"
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800/60 transition cursor-pointer"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-Photo Carousel Media */}
              <div
                className="relative aspect-[4/5] sm:aspect-square md:max-h-[580px] w-full bg-zinc-950 overflow-hidden cursor-pointer select-none"
                onDoubleClick={() => handleDoubleTap(post.id, post.isFromDb)}
              >
                <img
                  src={post.images[postSlide] || post.images[0]}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-opacity duration-200"
                  loading="lazy"
                />

                {/* Double Tap Floating Heart Animation */}
                <AnimatePresence>
                  {isHeartPopping && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute inset-0 m-auto w-24 h-24 flex items-center justify-center pointer-events-none z-30"
                    >
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_20px_rgba(244,63,94,0.9)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top Right Carousel Counter Pill (e.g. 1/5) */}
                {totalSlides > 1 && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-mono font-semibold text-white/90 border border-white/10 shadow-sm">
                    {postSlide + 1}/{totalSlides}
                  </div>
                )}

                {/* Carousel Left / Right Arrows */}
                {totalSlides > 1 && postSlide > 0 && (
                  <button
                    type="button"
                    onClick={(e) => handleCarouselNav(post.id, totalSlides, 'prev', e)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition z-10"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {totalSlides > 1 && postSlide < totalSlides - 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleCarouselNav(post.id, totalSlides, 'next', e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition z-10"
                    title="Next photo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Bottom Right Audio Mute Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMutedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                  }}
                  className="absolute bottom-3 right-3 z-10 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 hover:text-cyan-300 hover:bg-black/80 transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Sponsored CTA Bar */}
              {post.isSponsored && (
                <a
                  href={post.ctaLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-purple-950/80 border-t border-b border-zinc-800 flex items-center justify-between text-xs text-cyan-300 font-semibold hover:text-white transition group"
                >
                  <span>{post.ctaText || 'See details'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}

              {/* Carousel Pagination Dots */}
              {totalSlides > 1 && (
                <div className="flex items-center justify-center space-x-1.5 py-2">
                  {post.images.map((_, dotIdx) => (
                    <span
                      key={`post-dot-${post.id || 'p'}-${dotIdx}`}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        dotIdx === postSlide
                          ? 'w-4 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]'
                          : 'w-1.5 bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons Bar: Like, Comment, Repost, Share ... Bookmark */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id, post.isFromDb)}
                    className="flex items-center space-x-1.5 text-zinc-300 hover:text-rose-400 transition cursor-pointer group"
                    title="Like"
                  >
                    <Heart
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                        isLiked
                          ? 'fill-rose-500 text-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                          : 'text-zinc-300'
                      }`}
                    />
                    <span className="text-xs font-semibold font-mono text-zinc-200">
                      {likesDisplay}
                    </span>
                  </button>

                  {/* Comment Button */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentPost(post)}
                    className="flex items-center space-x-1.5 text-zinc-300 hover:text-cyan-300 transition cursor-pointer group"
                    title="Comments"
                  >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold font-mono text-zinc-200">
                      {commentsArray.length}
                    </span>
                  </button>

                  {/* Repost Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleRepost(post.id)}
                    className={`flex items-center space-x-1.5 transition cursor-pointer group ${
                      isReposted ? 'text-cyan-400' : 'text-zinc-300 hover:text-cyan-400'
                    }`}
                    title="Repost"
                  >
                    <Repeat2
                      className={`w-6 h-6 group-hover:scale-110 transition-transform ${
                        isReposted ? 'stroke-[2.5]' : ''
                      }`}
                    />
                    <span className="text-xs font-semibold font-mono">
                      {repostCount}
                    </span>
                  </button>

                  {/* Share / Paper Plane Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSharePost(post)}
                    className="text-zinc-300 hover:text-purple-400 transition cursor-pointer group"
                    title="Share"
                  >
                    <Send className="w-5.5 h-5.5 group-hover:scale-110 -rotate-12 transition-transform" />
                  </button>
                </div>

                {/* Bookmark / Save Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (post.isFromDb) onSave(post.id);
                    setSavedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                  }}
                  className={`transition cursor-pointer ${
                    isSaved
                      ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                  title="Save"
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-cyan-400' : ''}`} />
                </button>
              </div>

              {/* Caption & Timestamp Section */}
              <div className="px-3.5 pb-3.5 space-y-1.5">
                <div className="text-xs text-zinc-200 leading-relaxed">
                  <span className="font-bold text-white mr-2">@{post.username}</span>
                  <span>{post.caption}</span>
                </div>

                {/* View Comments trigger */}
                {commentsArray.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCommentPost(post)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer block"
                  >
                    View {commentsArray.length === 1 ? '1 comment' : `all ${commentsArray.length} comments`}
                  </button>
                )}

                <div className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
                  {post.timeAgo}
                </div>
              </div>

              {/* Ad Feedback Box (from video for sponsored cards) */}
              {post.isSponsored && !adFeedbackDismissed && (
                <div className="mx-3.5 mb-3.5 p-3 bg-[#12121c] border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-zinc-100">
                        Are you interested in this ad?
                      </h5>
                      <p className="text-[11px] text-zinc-400">
                        Help us show the nocturnal updates that are right for you.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdFeedbackDismissed(true)}
                      className="text-zinc-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAdFeedbackSelected('not_interested')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1 transition ${
                        adFeedbackSelected === 'not_interested'
                          ? 'bg-zinc-800 border-zinc-600 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>Not interested</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdFeedbackSelected('interested')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1 transition ${
                        adFeedbackSelected === 'interested'
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-cyan-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Interested</span>
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        }))}
      </div>

      {/* 3. INSTAGRAM COMMENTS SLIDE-UP BOTTOM SHEET */}
      <AnimatePresence>
        {activeCommentPost && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg max-h-[85vh] sm:max-h-[600px] h-full bg-[#0d0d16] border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              id="instagram-comments-sheet"
            >
              {/* Sheet Handle & Header */}
              <div className="pt-2 pb-3 px-4 border-b border-zinc-800/80 flex items-center justify-between relative flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-zinc-700 absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
                <div className="w-6" />
                <h3 className="text-sm font-bold text-zinc-100 mt-2 sm:mt-0">
                  Comments
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveCommentPost(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-zinc-900/60 scrollbar-thin">
                {((localComments[activeCommentPost.id] || activeCommentPost.commentsList || []).length === 0) ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">
                    No comments yet. Start the nocturnal conversation!
                  </div>
                ) : (
                  (localComments[activeCommentPost.id] || activeCommentPost.commentsList || []).map((c: any, cIdx: number) => (
                    <div key={`post-comment-${c.id || cIdx}-${cIdx}`} className="pt-3 first:pt-0 flex items-start justify-between">
                      <div className="flex items-start space-x-3 min-w-0">
                        <img
                          src={c.avatar || c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={c.username}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-800 flex-shrink-0 mt-0.5"
                        />
                        <div className="text-xs">
                          <div className="flex items-baseline space-x-2">
                            <span className="font-bold text-zinc-100">
                              {c.username}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {c.time}
                            </span>
                          </div>
                          <p className="text-zinc-200 mt-1">{c.text}</p>
                          <button
                            type="button"
                            onClick={() => setCommentInputText(`@${c.username} `)}
                            className="text-[11px] text-zinc-500 font-semibold hover:text-cyan-400 mt-1.5 transition"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-zinc-500 hover:text-rose-400 p-1 flex-shrink-0"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Emojis Row (from video: ❤️ 🔥 👏 🥳 😍 😢 😂 😮) */}
              <div className="px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between overflow-x-auto scrollbar-none bg-[#090910]">
                {QUICK_EMOJIS.map((emoji, idx) => (
                  <button
                    key={`quick-emoji-${emoji}-${idx}`}
                    type="button"
                    onClick={() => setCommentInputText((prev) => prev + emoji)}
                    className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Bottom Sticky Comment Input Bar */}
              <form
                onSubmit={handleSendComment}
                className="p-3 bg-[#0a0a12] border-t border-zinc-800/80 flex items-center space-x-2.5 flex-shrink-0"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="My avatar"
                  className="w-8 h-8 rounded-full object-cover border border-cyan-500/40 flex-shrink-0"
                />
                <input
                  type="text"
                  placeholder={`Add a comment for ${activeCommentPost.username}...`}
                  value={commentInputText}
                  onChange={(e) => setCommentInputText(e.target.value)}
                  className="flex-1 bg-[#141420] border border-zinc-800 rounded-full px-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
                />
                <button
                  type="submit"
                  disabled={!commentInputText.trim()}
                  className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. INSTAGRAM SHARE TO FRIENDS MODAL SHEET */}
      <AnimatePresence>
        {activeSharePost && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0d0d16] border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              id="instagram-share-sheet"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Share to</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Links you share are unique to you and encrypted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSharePost(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-zinc-800/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    className="w-full bg-[#141420] border border-zinc-800 rounded-full py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Circular Friends List (Frank James, Kazilowe Davix, Jamie erinah, tegara30, simon, Kyeyune Emmanuel) */}
              <div className="p-4 overflow-x-auto scrollbar-none">
                <div className="flex space-x-4">
                  {SHARE_FRIENDS.filter((f) =>
                    !shareSearchQuery || f.name.toLowerCase().includes(shareSearchQuery.toLowerCase())
                  ).map((friend, fIdx) => {
                    const isSent = !!sharedSentUsers[friend.id];
                    return (
                      <div
                        key={`share-friend-${friend.id || fIdx}-${fIdx}`}
                        onClick={() => handleSendShareToFriend(friend.id)}
                        className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group"
                      >
                        <div className="relative">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className={`w-14 h-14 rounded-full object-cover border-2 transition ${
                              isSent ? 'border-emerald-400 scale-95' : 'border-zinc-700 group-hover:border-cyan-400'
                            }`}
                          />
                          {isSent && (
                            <span className="absolute bottom-0 right-0 p-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          {friend.statusTime && !isSent && (
                            <span className="absolute -top-1 -right-1 px-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-mono text-zinc-300">
                              {friend.statusTime}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-300 truncate max-w-[65px] text-center">
                          {friend.name}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-semibold">
                          {isSent ? 'Sent ✓' : 'Send'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Row: WhatsApp, WhatsApp Status, Copy Link, Add to story */}
              <div className="p-4 border-t border-zinc-800/80 grid grid-cols-4 gap-2 text-center bg-[#0a0a12]">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-[#12121c] border border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition flex flex-col items-center space-y-1 cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">
                    {copiedShareLink ? 'Copied!' : 'Copy link'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Shared link generated for WhatsApp')}
                  className="p-2.5 rounded-2xl bg-[#12121c] border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/30 transition flex flex-col items-center space-y-1 cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Post pinned to your Nightgram Story')}
                  className="p-2.5 rounded-2xl bg-[#12121c] border border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/30 transition flex flex-col items-center space-y-1 cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">Add to story</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-[#12121c] border border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition flex flex-col items-center space-y-1 cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium">Share...</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
