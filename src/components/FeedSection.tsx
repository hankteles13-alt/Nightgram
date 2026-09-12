import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, Comment, UserProfile } from '../types';
import { ShortVideo } from './ReelsSection';
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
  RotateCw,
  Play,
  Pause,
  UserPlus,
  UserCheck,
  EyeOff,
  Flag,
  ArrowUp,
  Image as LucideImage,
  Trash2,
  Edit3,
} from 'lucide-react';
import AnimatedLikeButton from './AnimatedLikeButton';
import AnimatedCommentButton from './AnimatedCommentButton';
import AvatarStatusIndicator from './AvatarStatusIndicator';

interface FeedSectionProps {
  posts: Post[];
  shorts?: ShortVideo[];
  currentUser?: UserProfile | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
  onOpenChatWithUser?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
  onOpenUserProfile?: (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => void;
  onRefreshFeed?: () => void;
  isRefreshing?: boolean;
}

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😢', '😍', '😂', '😮', '🥺', '🥳', '💙'];

const TRENDING_REACTION_GIFS = [
  { label: '🔥 Fire', tag: '[GIF: Fire Reactions]' },
  { label: '👏 Clap', tag: '[GIF: Clapping Crowd]' },
  { label: '✨ Vibes', tag: '[GIF: Midnight Neon Vibes]' },
  { label: '😂 Laugh', tag: '[GIF: Laughing Tears]' },
  { label: '❤️ Love', tag: '[GIF: Sending Hearts]' },
  { label: '💯 100', tag: '[GIF: Keep It 100]' },
];

// Quick share friends from user's video demo
const SHARE_FRIENDS = [
  {
    id: 'diane_dili',
    name: 'Diane Dili 💕',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    statusTime: 'Active',
  },
  {
    id: 'jamie_erinah',
    name: 'Jamie erinah',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    statusTime: '2m ago',
  },
  {
    id: 'kazibwe_davix',
    name: 'Kazibwe Davix',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    statusTime: '15m ago',
  },
  {
    id: 'simon',
    name: 'simon',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    statusTime: '1h ago',
  },
  {
    id: 'lil_danz',
    name: 'Lil Danz Belton',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    statusTime: 'Active',
  },
  {
    id: 'tegara30',
    name: 'tegara30',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    statusTime: '3h ago',
  },
  {
    id: 'frank_james',
    name: 'Frank James',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    statusTime: 'Yesterday',
  },
];

// Suggested friends list appearing in-feed (as in Instagram video)
const INITIAL_SUGGESTIONS = [
  {
    id: 'sugg-1',
    username: 'kazibwe_davix',
    displayName: 'Kazibwe Davix',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Followed by diane_dili + 4 more',
  },
  {
    id: 'sugg-2',
    username: 'jamie_erinah',
    displayName: 'Jamie Erinah',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Suggested for you',
  },
  {
    id: 'sugg-3',
    username: 'lil_danz_belton',
    displayName: 'Lil Danz Belton',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Follows you',
  },
  {
    id: 'sugg-4',
    username: 'tegara30',
    displayName: 'Tegara',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Popular creator in your area',
  },
];

// Fallback reliable public video streams
const RELIABLE_VIDEO_FALLBACKS = [
  'https://vjs.zencdn.net/v/oceans.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
];

export default function FeedSection({
  posts,
  shorts = [],
  currentUser,
  onLike,
  onSave,
  onAddComment,
  selectedMood,
  setSelectedMood,
  onOpenChatWithUser,
  onOpenUserProfile,
  onRefreshFeed,
  isRefreshing = false,
}: FeedSectionProps) {
  // Carousel Slide State per Post
  const [carouselIndex, setCarouselIndex] = useState<{ [postId: string]: number }>({});
  // Mute Audio State per Post
  const [mutedPosts, setMutedPosts] = useState<{ [postId: string]: boolean }>({});
  // Video Play / Pause state per post
  const [playingVideos, setPlayingVideos] = useState<{ [postId: string]: boolean }>({});
  // Center play/pause indicator flash
  const [playbackIndicator, setPlaybackIndicator] = useState<{ [postId: string]: 'play' | 'pause' | null }>({});
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
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [commentLikes, setCommentLikes] = useState<{ [commentId: string]: { isLiked: boolean; count: number } }>({});
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [inlineCommentInputs, setInlineCommentInputs] = useState<{ [postId: string]: string }>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Share Sheet State
  const [activeSharePost, setActiveSharePost] = useState<any | null>(null);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharedSentUsers, setSharedSentUsers] = useState<{ [userId: string]: boolean }>({});

  // Post Options Sheet (Three dots)
  const [activeOptionsPost, setActiveOptionsPost] = useState<any | null>(null);
  const [hiddenPosts, setHiddenPosts] = useState<{ [postId: string]: boolean }>({});

  // Ad Interest Feedback Box state
  const [adFeedbackDismissed, setAdFeedbackDismissed] = useState(false);
  const [adFeedbackSelected, setAdFeedbackSelected] = useState<'interested' | 'not_interested' | null>(null);

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState(INITIAL_SUGGESTIONS);
  const [followedSuggestions, setFollowedSuggestions] = useState<{ [id: string]: boolean }>({});

  // Video refs dictionary
  const videoRefs = useRef<{ [postId: string]: HTMLVideoElement | null }>({});

  // Formatted User Posts from Firestore + Authentic In-Feed Posts matching user's video demo
  const combinedFeedPosts = useMemo(() => {
    // 1. Convert Firestore posts
    const mappedDbPosts = posts.map((p) => {
      const isVideo = p.mediaType === 'video' || !!p.videoUrl || (p.image && (p.image.endsWith('.mp4') || p.image.includes('video')));
      const validImage = p.image && p.image.trim() ? p.image : 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000';
      const validAvatar = p.userAvatar && p.userAvatar.trim() ? p.userAvatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      const videoSource = p.videoUrl || (isVideo ? p.image : undefined);

      return {
        id: p.id,
        userId: p.userId,
        username: p.username || 'night_citizen',
        displayName: p.username || 'Night Citizen',
        userAvatar: validAvatar,
        hasStory: true,
        audioTrack: p.audioTrack || (p.mood ? `Nightgram Radio • ${p.mood} Frequency` : 'Nightgram Ambient Lounge'),
        mediaType: isVideo ? ('video' as const) : ('image' as const),
        videoUrl: videoSource,
        duration: p.duration || (isVideo ? '0:45' : undefined),
        images: p.images && p.images.length > 0 ? p.images : [validImage],
        caption: p.caption || '',
        likesCount: p.likes || 0,
        commentsCount: p.comments?.length || 0,
        repostsCount: p.repostsCount || 0,
        sharesCount: p.sharesCount || 0,
        likedByText: 'Liked by others',
        timeAgo: p.time || 'Just now',
        isFromDb: true,
        isSponsored: false,
        isLiked: p.isLiked || false,
        isSaved: p.isSaved || false,
        commentsList: p.comments || [],
      };
    });

    // 2. Convert Firestore Shorts into in-feed short video items
    const mappedShorts = shorts.map((s, sIdx) => {
      const videoFallback = RELIABLE_VIDEO_FALLBACKS[sIdx % RELIABLE_VIDEO_FALLBACKS.length];
      const videoSource = s.videoUrl && s.videoUrl.startsWith('http') && !s.videoUrl.includes('mixkit')
        ? s.videoUrl
        : videoFallback;

      return {
        id: s.id || `short-feed-${sIdx}`,
        userId: (s as any).userId || (s.creator ? s.creator.username : 'creator'),
        username: s.creator?.username || 'short_creator',
        displayName: s.creator?.displayName || s.creator?.username || 'Creator',
        userAvatar: s.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        hasStory: true,
        audioTrack: s.audioTrack ? `${s.audioTrack.title} • ${s.audioTrack.artist}` : 'Original Audio',
        mediaType: 'video' as const,
        videoUrl: videoSource,
        duration: '0:30',
        images: [s.posterUrl || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'],
        caption: s.caption || 'Nightgram Short #reels #nocturnal',
        likesCount: s.likes || 120,
        commentsCount: s.commentsCount || 12,
        repostsCount: s.sharesCount || 6,
        sharesCount: s.sharesCount || 4,
        likedByText: 'Liked by night_citizens and others',
        timeAgo: s.timeAgo || 'Recently',
        isFromDb: false,
        isSponsored: false,
        isLiked: s.isLiked || false,
        isSaved: s.isSaved || false,
        commentsList: [
          {
            id: `c-short-${sIdx}`,
            username: 'night_owl',
            userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            text: 'Love this clip! 🔥',
            time: '1h',
          }
        ],
      };
    });

    // 3. Authentic video-format feed items directly matching user's video screen recording:
    // Item A: m.u.h.o.z.a.6 (Photo carousel with 9/12 badge, Rihanna We Found Love audio, Danielbanks comment)
    const muhozaPost = {
      id: 'demo-muhoza-carousel',
      userId: 'user_muhoza',
      username: 'm.u.h.o.z.a.6',
      displayName: 'm.u.h.o.z.a.6',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      hasStory: true,
      audioTrack: 'Rihanna • We Found Love (feat. Calvin Harris)',
      mediaType: 'image' as const,
      images: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop&q=80',
      ],
      carouselStartDisplay: '9/12',
      caption: 'Golden hour reflections ✨ Cherishing every second under this sky.',
      likesCount: 168,
      commentsCount: 2,
      repostsCount: 7,
      sharesCount: 4,
      likedByText: 'Liked by _g.i.h.f.h.y__ and others',
      timeAgo: '6 days ago',
      isFromDb: false,
      isSponsored: false,
      isLiked: false,
      isSaved: false,
      commentsList: [
        {
          id: 'c-muh-son',
          username: 'son_of_natalie',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          text: '😍😍😍',
          time: '5d',
          likes: 0,
        },
        {
          id: 'c-muh-loyce',
          username: 'itsloypepraise',
          userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          text: 'happiness 🥹 friendship 💙 memories ❤️ ol',
          time: '5d',
          likes: 1,
        },
      ],
    };

    // Item B: bolt (In-feed sponsored ad post)
    const boltAdPost = {
      id: 'demo-bolt-sponsored',
      userId: 'bolt_official',
      username: 'bolt',
      displayName: 'Bolt',
      userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      hasStory: false,
      audioTrack: 'Sponsored Audio',
      mediaType: 'image' as const,
      images: [
        'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=1000&auto=format&fit=crop&q=80',
      ],
      caption: 'Make every free hour count. Earn on your terms with Bolt.',
      likesCount: 1420,
      commentsCount: 28,
      repostsCount: 12,
      sharesCount: 34,
      likedByText: 'Sponsored',
      timeAgo: 'Sponsored',
      isFromDb: false,
      isSponsored: true,
      ctaText: "I'm interested >",
      ctaLink: 'https://bolt.eu',
      isLiked: false,
      isSaved: false,
      commentsList: [],
    };

    // Item C: thecineverseworld (Short video playing directly in feed with 2:58 badge)
    const cineverseVideoPost = {
      id: 'demo-cineverse-video',
      userId: 'user_cineverse',
      username: 'thecineverseworld',
      displayName: 'The Cineverse World',
      userAvatar: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=150&auto=format&fit=crop&q=80',
      hasStory: true,
      audioTrack: 'Reacher Sound • Cinematic Audio',
      mediaType: 'video' as const,
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      duration: '2:58',
      images: ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'],
      caption: 'Reacher vs Paulie 🍿💥 Watch till the end! #action #movies #reacher',
      likesCount: 1248,
      commentsCount: 84,
      repostsCount: 42,
      sharesCount: 19,
      likedByText: 'Liked by film_buff and others',
      timeAgo: '2 days ago',
      isFromDb: false,
      isSponsored: false,
      isLiked: false,
      isSaved: false,
      commentsList: [
        {
          id: 'c-cine-1',
          username: 'action_fan',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          text: 'The best scene in season 2! 🔥',
          time: '2d',
          likes: 12,
        }
      ],
    };

    // Item D: interesting.clipzz (Short video playing directly in feed with 1:42 badge)
    const clipzzVideoPost = {
      id: 'demo-clipzz-video',
      userId: 'user_clipzz',
      username: 'interesting.clipzz',
      displayName: 'Interesting Clips',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      hasStory: true,
      audioTrack: 'Tony Morales • Reacher Un...',
      mediaType: 'video' as const,
      videoUrl: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
      duration: '1:42',
      images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'],
      caption: 'When you know you shouldn\'t have said that 😂 Wait for his reaction #clips #humor',
      likesCount: 3590,
      commentsCount: 120,
      repostsCount: 89,
      sharesCount: 56,
      likedByText: 'Liked by comedy_central and others',
      timeAgo: '1 day ago',
      isFromDb: false,
      isSponsored: false,
      isLiked: false,
      isSaved: false,
      commentsList: [
        {
          id: 'c-clip-1',
          username: 'laugh_daily',
          userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          text: 'His face expression killed me 😭',
          time: '1d',
          likes: 45,
        }
      ],
    };

    // Item E: joynm19 (Short video playing in feed with 0:45 duration)
    const joynVideoPost = {
      id: 'demo-joyn-video',
      userId: 'user_joyn',
      username: 'joynm19',
      displayName: 'Joyn M',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      hasStory: true,
      audioTrack: 'joynm19 • Original audio',
      mediaType: 'video' as const,
      videoUrl: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
      duration: '0:45',
      images: ['https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=800'],
      caption: 'Midnight drive aesthetic 🌃 #vibes #citynights #drive',
      likesCount: 892,
      commentsCount: 35,
      repostsCount: 18,
      sharesCount: 12,
      likedByText: 'Liked by night_riders and others',
      timeAgo: '13 hours ago',
      isFromDb: false,
      isSponsored: false,
      isLiked: false,
      isSaved: false,
      commentsList: [],
    };

    // Construct stream: DB Posts + Shorts + Authentic Video Experience Items
    const stream = [
      ...mappedDbPosts,
      ...mappedShorts,
      muhozaPost,
      boltAdPost,
      cineverseVideoPost,
      clipzzVideoPost,
      joynVideoPost,
    ];

    // Filter out posts user marked 'Not interested'
    return stream.filter((p) => !hiddenPosts[p.id]);
  }, [posts, shorts, hiddenPosts]);

  // Handle Video Tap (Pause / Play)
  const handleTogglePlayVideo = (postId: string) => {
    const vid = videoRefs.current[postId];
    const isCurrentlyPlaying = playingVideos[postId] !== false; // default playing

    if (vid) {
      if (isCurrentlyPlaying) {
        vid.pause();
        setPlayingVideos((prev) => ({ ...prev, [postId]: false }));
        setPlaybackIndicator((prev) => ({ ...prev, [postId]: 'pause' }));
      } else {
        vid.play().catch(() => {});
        setPlayingVideos((prev) => ({ ...prev, [postId]: true }));
        setPlaybackIndicator((prev) => ({ ...prev, [postId]: 'play' }));
      }

      setTimeout(() => {
        setPlaybackIndicator((prev) => ({ ...prev, [postId]: null }));
      }, 700);
    }
  };

  // Handle Like
  const handleToggleLike = (postId: string, isFromDb?: boolean) => {
    if (isFromDb) {
      onLike(postId);
    }
    const currentPost = combinedFeedPosts.find((p) => p.id === postId);
    const initialLiked = currentPost?.isLiked ?? false;
    const initialCount = currentPost?.likesCount ?? 0;

    setLocalLikes((prev) => {
      const current = prev[postId] || { isLiked: initialLiked, count: initialCount };
      const nextLiked = !current.isLiked;
      return {
        ...prev,
        [postId]: {
          isLiked: nextLiked,
          count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1),
        },
      };
    });
  };

  // Handle Double Tap (Like + Big Heart Pop)
  const handleDoubleTap = (postId: string, isFromDb?: boolean) => {
    setDoubleTapHeart((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => {
      setDoubleTapHeart((prev) => ({ ...prev, [postId]: false }));
    }, 900);

    const currentPost = combinedFeedPosts.find((p) => p.id === postId);
    const alreadyLiked = localLikes[postId]?.isLiked ?? currentPost?.isLiked ?? false;
    if (!alreadyLiked) {
      handleToggleLike(postId, isFromDb);
    }
  };

  // Handle Repost
  const handleToggleRepost = (postId: string) => {
    const currentlyReposted = !!repostedPosts[postId];
    setRepostedPosts((prev) => ({ ...prev, [postId]: !currentlyReposted }));

    if (!currentlyReposted) {
      setLastRepostedPostId(postId);
      setShowRepostUndoBanner(true);
      setTimeout(() => {
        setShowRepostUndoBanner(false);
      }, 4000);
    } else {
      setShowRepostUndoBanner(false);
    }
  };

  // Undo Repost
  const handleUndoRepost = () => {
    if (lastRepostedPostId) {
      setRepostedPosts((prev) => ({ ...prev, [lastRepostedPostId]: false }));
      setShowRepostUndoBanner(false);
      setLastRepostedPostId(null);
    }
  };

  // Carousel Next/Prev Navigation
  const handleCarouselNav = (postId: string, total: number, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => {
      const current = prev[postId] || 0;
      if (direction === 'next') {
        return { ...prev, [postId]: (current + 1) % total };
      } else {
        return { ...prev, [postId]: (current - 1 + total) % total };
      }
    });
  };

  // Send Comment with immediate optimistic feedback matching video
  const handleSendComment = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== undefined ? customText : commentInputText).trim();
    if (!textToSend || !activeCommentPost) return;

    const commentId = `comm-${Date.now()}`;
    const safeUsername = currentUser?.username || 'danielbanks7765';
    const safeAvatar =
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    const newCommentObj = {
      id: commentId,
      username: safeUsername,
      userAvatar: safeAvatar,
      text: textToSend,
      time: 'Posting...',
      isPosting: true,
      likes: 0,
      isJustPosted: true,
      isOwn: true,
    };

    setOptimisticStatus('Posting comment...');

    // Optimistically prepend to comments for this post
    setLocalComments((prev) => {
      const existing = prev[activeCommentPost.id] || activeCommentPost.commentsList || [];
      return {
        ...prev,
        [activeCommentPost.id]: [newCommentObj, ...existing],
      };
    });

    // In 650ms, mark as posted and switch to '1s' (as seen in video)
    setTimeout(() => {
      setOptimisticStatus(null);
      setLocalComments((prev) => {
        const currentList = prev[activeCommentPost.id] || [];
        return {
          ...prev,
          [activeCommentPost.id]: currentList.map((c) =>
            c.id === commentId ? { ...c, isPosting: false, time: '1s' } : c
          ),
        };
      });
    }, 650);

    onAddComment(activeCommentPost.id, textToSend);

    setCommentInputText('');
    setShowGifPicker(false);
  };

  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!activeCommentPost || !editingText.trim()) return;
    setLocalComments((prev) => {
      const currentList = prev[activeCommentPost.id] || [];
      return {
        ...prev,
        [activeCommentPost.id]: currentList.map((c) =>
          c.id === commentId ? { ...c, text: editingText.trim() } : c
        ),
      };
    });
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!activeCommentPost) return;
    setLocalComments((prev) => {
      const currentList = prev[activeCommentPost.id] || [];
      return {
        ...prev,
        [activeCommentPost.id]: currentList.filter((c) => c.id !== commentId),
      };
    });
  };

  const handleToggleLikeComment = (commentId: string, initialLikes = 0) => {
    setCommentLikes((prev) => {
      const current = prev[commentId] || { isLiked: false, count: initialLikes };
      const nextLiked = !current.isLiked;
      return {
        ...prev,
        [commentId]: {
          isLiked: nextLiked,
          count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1),
        },
      };
    });
  };

  // Send comment directly from in-feed input
  const handleSendInlineComment = (postId: string, customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inlineCommentInputs[postId] || '').trim();
    if (!textToSend) return;

    const commentId = `comm-inline-${Date.now()}`;
    const safeUsername = currentUser?.username || 'danielbanks7765';
    const safeAvatar =
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    const newCommentObj = {
      id: commentId,
      username: safeUsername,
      userAvatar: safeAvatar,
      text: textToSend,
      time: 'Posting...',
      isPosting: true,
      likes: 0,
      isJustPosted: true,
      isOwn: true,
    };

    const postItem = combinedFeedPosts.find((p) => p.id === postId);

    // Optimistically add to comments for this post
    setLocalComments((prev) => {
      const existing = prev[postId] || postItem?.commentsList || [];
      return {
        ...prev,
        [postId]: [newCommentObj, ...existing],
      };
    });

    setInlineCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    // Switch from Posting... to 1s after 650ms
    setTimeout(() => {
      setLocalComments((prev) => {
        const currentList = prev[postId] || [];
        return {
          ...prev,
          [postId]: currentList.map((c) =>
            c.id === commentId ? { ...c, isPosting: false, time: '1s' } : c
          ),
        };
      });
    }, 650);

    onAddComment(postId, textToSend);
  };

  // Copy Link action
  const handleCopyLink = () => {
    setCopiedShareLink(true);
    navigator.clipboard?.writeText(window.location.href);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // Send to friend in share sheet
  const handleSendShareToFriend = (friendId: string) => {
    setSharedSentUsers((prev) => ({ ...prev, [friendId]: true }));
  };

  // Follow suggested user
  const handleToggleFollowSuggestion = (id: string) => {
    setFollowedSuggestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Dismiss suggested user
  const handleDismissSuggestion = (id: string) => {
    setSuggestedUsers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 select-none" id="feed-container-main">
      {/* Undo Repost Floating Banner */}
      <AnimatePresence>
        {showRepostUndoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-16 inset-x-4 max-w-sm mx-auto z-50 bg-[#0d0d16] border border-cyan-500/50 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between backdrop-blur-xl"
            id="repost-undo-toast"
          >
            <div className="flex items-center space-x-2 text-xs text-zinc-200">
              <Repeat2 className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span>Reposted to your profile</span>
            </div>
            <button
              type="button"
              onClick={handleUndoRepost}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition cursor-pointer"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEED POSTS STREAM */}
      <div className="space-y-4 sm:space-y-6" id="instagram-posts-stream">
        {combinedFeedPosts.map((post, postIndex) => {
          const postSlide = carouselIndex[post.id] || 0;
          const totalSlides = post.images.length;
          const isLiked = localLikes[post.id] !== undefined ? localLikes[post.id].isLiked : post.isLiked;
          const likesDisplay = localLikes[post.id] !== undefined ? localLikes[post.id].count : post.likesCount;
          const isReposted = !!repostedPosts[post.id];
          const repostCount = post.repostsCount + (isReposted ? 1 : 0);
          const isSaved = savedPosts[post.id] !== undefined ? savedPosts[post.id] : post.isSaved;
          const isMuted = !!mutedPosts[post.id];
          const isHeartPopping = !!doubleTapHeart[post.id];
          const commentsArray = localComments[post.id] || post.commentsList || [];
          const isVideoPost = post.mediaType === 'video' || !!post.videoUrl;
          const isVideoPlaying = playingVideos[post.id] !== false;
          const indicatorState = playbackIndicator[post.id];

          return (
            <React.Fragment key={`feed-post-frag-${post.id || 'p'}-${postIndex}`}>
              <article
                id={`instagram-post-${post.id}`}
                className="bg-[#090910] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl hover:border-zinc-700/80 transition group"
              >
                {/* 1. Post Header: Avatar with story ring + Username + Audio Subtitle + 3-dots */}
                <div className="px-3.5 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Story ring on avatar */}
                    <div
                      className="relative cursor-pointer shrink-0"
                      onClick={() => {
                        if (onOpenUserProfile) {
                          onOpenUserProfile({
                            uid: post.userId,
                            username: post.username,
                            displayName: post.displayName || post.username,
                            avatar: post.userAvatar,
                          });
                        } else {
                          onOpenChatWithUser?.({
                            uid: post.userId,
                            username: post.username,
                            displayName: post.displayName || post.username,
                            avatar: post.userAvatar,
                          });
                        }
                      }}
                    >
                      <div
                        className={`p-[2px] rounded-full ${
                          post.hasStory
                            ? 'bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-[0_0_8px_rgba(221,42,123,0.4)]'
                            : 'bg-zinc-800'
                        }`}
                      >
                        <img
                          src={post.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={post.username}
                          className="w-8.5 h-8.5 rounded-full object-cover border border-[#090910]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span
                          onClick={() => {
                            if (onOpenUserProfile) {
                              onOpenUserProfile({
                                uid: post.userId,
                                username: post.username,
                                displayName: post.displayName || post.username,
                                avatar: post.userAvatar,
                              });
                            } else {
                              onOpenChatWithUser?.({
                                uid: post.userId,
                                username: post.username,
                                displayName: post.displayName || post.username,
                                avatar: post.userAvatar,
                              });
                            }
                          }}
                          className="text-xs sm:text-sm font-bold text-zinc-100 hover:text-cyan-300 transition cursor-pointer truncate"
                        >
                          {post.username}
                        </span>

                        {post.isSponsored && (
                          <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-medium text-zinc-400">
                            Ad
                          </span>
                        )}

                        {post.isSponsored && (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 ml-1 cursor-pointer"
                          >
                            Follow
                          </button>
                        )}
                      </div>

                      {/* Audio track line with pulsating music note */}
                      {post.audioTrack && (
                        <div className="flex items-center space-x-1 text-[11px] text-zinc-400 truncate max-w-[220px] sm:max-w-xs">
                          <Music className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 animate-pulse" />
                          <span className="truncate">{post.audioTrack}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 3-dots (More Options Modal Sheet) */}
                  <button
                    type="button"
                    onClick={() => setActiveOptionsPost(post)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800/60 transition cursor-pointer"
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Post Media Container: Either Real In-Feed Video OR Multi-Photo Carousel */}
                <div
                  className="relative aspect-[4/5] sm:aspect-square md:max-h-[580px] w-full bg-black overflow-hidden cursor-pointer select-none"
                  onDoubleClick={() => handleDoubleTap(post.id, post.isFromDb)}
                  onClick={() => {
                    if (isVideoPost) {
                      handleTogglePlayVideo(post.id);
                    }
                  }}
                >
                  {isVideoPost ? (
                    /* IN-FEED VIDEO PLAYER */
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video
                        ref={(el) => {
                          videoRefs.current[post.id] = el;
                        }}
                        src={post.videoUrl || RELIABLE_VIDEO_FALLBACKS[0]}
                        poster={post.images[0] || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = RELIABLE_VIDEO_FALLBACKS[postIndex % RELIABLE_VIDEO_FALLBACKS.length];
                          if (target.src !== fallback) {
                            target.src = fallback;
                            target.load();
                            target.play().catch(() => {});
                          }
                        }}
                        className="w-full h-full object-cover"
                      />

                      {/* Video Top Right Duration Pill (e.g. 2:58 or 1:42 as seen in video) */}
                      {post.duration && (
                        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-black/65 backdrop-blur-md rounded-lg text-[11px] font-mono font-bold text-white border border-white/10 shadow-sm flex items-center gap-1">
                          <span>{post.duration}</span>
                        </div>
                      )}

                      {/* Tap Play/Pause Indicator Overlay Flash */}
                      <AnimatePresence>
                        {indicatorState && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.1, opacity: 1 }}
                            exit={{ scale: 1.3, opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center pointer-events-none z-20 border border-white/20"
                          >
                            {indicatorState === 'play' ? (
                              <Play className="w-8 h-8 text-white fill-white ml-1" />
                            ) : (
                              <Pause className="w-8 h-8 text-white fill-white" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    /* MULTI-PHOTO CAROUSEL */
                    <div className="relative w-full h-full">
                      <img
                        src={post.images[postSlide] || post.images[0] || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-opacity duration-200"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Carousel Top Right Pill (e.g. 9/12 or 1/3 as seen in video) */}
                      {totalSlides > 1 && (
                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-mono font-semibold text-white/90 border border-white/10 shadow-sm">
                          {(post as any).carouselStartDisplay && postSlide === 0
                            ? (post as any).carouselStartDisplay
                            : `${postSlide + 1}/${totalSlides}`}
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
                    </div>
                  )}

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

                  {/* Bottom Right Audio Mute Button (Volume2 / VolumeX) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMutedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                    }}
                    className="absolute bottom-3 right-3 z-10 p-2 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white/90 hover:text-cyan-300 hover:bg-black/85 transition"
                    title={isMuted ? 'Unmute audio' : 'Mute audio'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Sponsored Call To Action Bar (e.g. Bolt Ad) */}
                {post.isSponsored && (
                  <a
                    href={(post as any).ctaLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-purple-950/80 border-t border-b border-zinc-800 flex items-center justify-between text-xs text-cyan-300 font-semibold hover:text-white transition group"
                  >
                    <span>{(post as any).ctaText || "I'm interested >"}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                {/* Carousel Pagination Dots */}
                {!isVideoPost && totalSlides > 1 && (
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

                {/* 3. Action Buttons Bar: Like, Comment, Repost, Share ... Bookmark */}
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

                    {/* Animated Comment Button with 3-dot bubble, burst particles, tactile spring bounce & live counter */}
                    <AnimatedCommentButton
                      postId={post.id}
                      commentsCount={commentsArray.length}
                      onClick={() => {
                        setActiveCommentPost(post);
                        setTimeout(() => commentInputRef.current?.focus(), 200);
                      }}
                    />

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
                      className="flex items-center space-x-1.5 text-zinc-300 hover:text-purple-400 transition cursor-pointer group"
                      title="Share"
                    >
                      <Send className="w-5.5 h-5.5 group-hover:scale-110 -rotate-12 transition-transform" />
                      {post.sharesCount > 0 && (
                        <span className="text-xs font-semibold font-mono text-zinc-200">
                          {post.sharesCount}
                        </span>
                      )}
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

                {/* 4. Post Text & Details: Liked By + Caption + Comment Preview */}
                <div className="px-3.5 pb-3.5 space-y-1.5">
                  {/* Liked by string */}
                  <div className="flex items-center space-x-1.5 text-xs text-zinc-300">
                    <span className="text-zinc-400">Liked by</span>
                    <strong className="text-white font-semibold cursor-pointer hover:underline">
                      {post.likedByText || 'others'}
                    </strong>
                  </div>

                  {/* Caption */}
                  <div className="text-xs text-zinc-200 leading-relaxed">
                    <span
                      onClick={() => onOpenUserProfile?.({ username: post.username, displayName: post.displayName, avatar: post.userAvatar })}
                      className="font-bold text-white mr-2 cursor-pointer hover:underline"
                    >
                      {post.username}
                    </span>
                    <span>{post.caption}</span>
                  </div>

                  {/* Comment preview (e.g. danielbanks7765: Ohhh) */}
                  {commentsArray.length > 0 && (
                    <div
                      onClick={() => {
                        setActiveCommentPost(post);
                        setTimeout(() => commentInputRef.current?.focus(), 200);
                      }}
                      className="text-xs text-zinc-300 space-y-0.5 pt-0.5 cursor-pointer group/prev"
                    >
                      <div className="flex items-baseline space-x-1.5">
                        <span className="font-semibold text-zinc-100 group-hover/prev:text-cyan-300 transition-colors">
                          {commentsArray[0].username}
                        </span>
                        <span className="text-zinc-300">{commentsArray[0].text}</span>
                      </div>
                    </div>
                  )}

                  {/* View all comments trigger */}
                  {commentsArray.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCommentPost(post);
                        setTimeout(() => commentInputRef.current?.focus(), 200);
                      }}
                      className="text-xs text-zinc-500 hover:text-cyan-400 transition cursor-pointer block pt-0.5"
                    >
                      View all {commentsArray.length} comments
                    </button>
                  )}

                  {/* Timestamp */}
                  <div className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase pt-0.5">
                    {post.timeAgo}
                  </div>

                  {/* In-Feed Quick Comment Input Bar */}
                  <div className="pt-2 mt-1 border-t border-zinc-900 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <img
                        src={
                          currentUser?.avatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                        }
                        alt="My avatar"
                        className="w-5.5 h-5.5 rounded-full object-cover border border-zinc-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={inlineCommentInputs[post.id] || ''}
                        onChange={(e) =>
                          setInlineCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendInlineComment(post.id);
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {(inlineCommentInputs[post.id] || '').trim() ? (
                        <button
                          type="button"
                          onClick={() => handleSendInlineComment(post.id)}
                          className="text-xs font-bold text-[#0095f6] hover:text-[#1877f2] transition cursor-pointer px-1.5 py-0.5 active:scale-95"
                        >
                          Post
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleSendInlineComment(post.id, '❤️')}
                            className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                            title="React with heart"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendInlineComment(post.id, '🔥')}
                            className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                            title="React with fire"
                          >
                            🔥
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCommentPost(post);
                              setTimeout(() => commentInputRef.current?.focus(), 200);
                            }}
                            className="p-1 text-zinc-500 hover:text-cyan-400 transition cursor-pointer"
                            title="Open comments drawer"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
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
                          Help us show the updates that are right for you.
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
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer ${
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
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer ${
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

              {/* IN-FEED SUGGESTED FOR YOU CAROUSEL (after 2nd post as seen in Instagram video) */}
              {postIndex === 1 && suggestedUsers.length > 0 && (
                <div className="w-full py-3 space-y-2.5" id="in-feed-suggestions-box">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-zinc-300 tracking-wide">
                      Suggested for you
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuggestedUsers([])}
                      className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      See all
                    </button>
                  </div>

                  <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-none">
                    {suggestedUsers.map((sug) => {
                      const isFollowing = !!followedSuggestions[sug.id];
                      return (
                        <div
                          key={`sugg-card-${sug.id}`}
                          className="w-36 flex-shrink-0 bg-[#0c0c14] border border-zinc-800/90 rounded-2xl p-3 flex flex-col items-center text-center relative group select-none shadow-md"
                        >
                          <button
                            type="button"
                            onClick={() => handleDismissSuggestion(sug.id)}
                            className="absolute top-2 right-2 text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] mb-2">
                            <img
                              src={sug.avatar}
                              alt={sug.username}
                              className="w-full h-full object-cover rounded-full border border-black"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <span className="text-xs font-bold text-white truncate max-w-[110px] block">
                            {sug.username}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate max-w-[110px] block mb-3">
                            {sug.subtitle}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleFollowSuggestion(sug.id)}
                            className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isFollowing
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-zinc-950 hover:brightness-110 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 4. INSTAGRAM THREE-DOTS OPTIONS BOTTOM SHEET */}
      <AnimatePresence>
        {activeOptionsPost && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setActiveOptionsPost(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-[#0d0d16] border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-center divide-y divide-zinc-800/80"
              onClick={(e) => e.stopPropagation()}
              id="post-options-sheet"
            >
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mt-3 mb-1 sm:hidden" />

              <button
                type="button"
                onClick={() => {
                  setHiddenPosts((prev) => ({ ...prev, [activeOptionsPost.id]: true }));
                  setActiveOptionsPost(null);
                }}
                className="py-3.5 px-4 text-xs font-semibold text-rose-400 hover:bg-zinc-900/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                <span>Not interested</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('Thank you for your report. We review content 24/7.');
                  setActiveOptionsPost(null);
                }}
                className="py-3.5 px-4 text-xs font-semibold text-red-500 hover:bg-zinc-900/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                  setActiveOptionsPost(null);
                }}
                className="py-3.5 px-4 text-xs font-semibold text-zinc-200 hover:bg-zinc-900/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Copy link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = activeOptionsPost;
                  setActiveOptionsPost(null);
                  setActiveSharePost(target);
                }}
                className="py-3.5 px-4 text-xs font-semibold text-zinc-200 hover:bg-zinc-900/50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Share to...</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOptionsPost(null)}
                className="py-3 px-4 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. INSTAGRAM COMMENTS SLIDE-UP BOTTOM SHEET (Direct match to video 00:27-00:46) */}
      <AnimatePresence>
        {activeCommentPost && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => {
              setActiveCommentPost(null);
              setShowGifPicker(false);
              setEditingCommentId(null);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg max-h-[85vh] sm:max-h-[620px] h-full bg-[#0d0d16] border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              id="instagram-comments-sheet"
            >
              {/* Sheet Handle & Header */}
              <div className="pt-2.5 pb-3 px-4 border-b border-zinc-800/80 flex items-center justify-between relative flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-zinc-700 absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
                <div className="w-6" />
                <h3 className="text-sm font-bold text-zinc-100 mt-2 sm:mt-0 tracking-wide">
                  Comments
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCommentPost(null);
                    setShowGifPicker(false);
                    setEditingCommentId(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition cursor-pointer"
                  title="Close comments"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-zinc-900/60 scrollbar-thin">
                {((localComments[activeCommentPost.id] || activeCommentPost.commentsList || []).length === 0) ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  (localComments[activeCommentPost.id] || activeCommentPost.commentsList || []).map((c: any, cIdx: number) => {
                    const isLiked = commentLikes[c.id]?.isLiked ?? false;
                    const displayLikes = commentLikes[c.id]?.count ?? (c.likes || 0);
                    const isOwnComment =
                      c.isJustPosted ||
                      c.isOwn ||
                      c.username === (currentUser?.username || 'danielbanks7765') ||
                      c.userId === currentUser?.uid;

                    return (
                      <div
                        key={`post-comment-${c.id || cIdx}-${cIdx}`}
                        className="pt-3.5 first:pt-0 flex items-start justify-between gap-3 group"
                      >
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <img
                            src={
                              c.userAvatar ||
                              c.avatar ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={c.username}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-800 flex-shrink-0 mt-0.5"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-xs flex-1 min-w-0">
                            <div className="flex items-baseline space-x-2">
                              <span className="font-bold text-zinc-100 hover:text-cyan-400 cursor-pointer">
                                {c.username}
                              </span>
                              {c.isPosting ? (
                                <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                  Posting...
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {c.time || '1s'}
                                </span>
                              )}
                            </div>

                            {/* Comment Text or Inline Edit */}
                            {editingCommentId === c.id ? (
                              <div className="mt-1 space-y-1.5">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-zinc-900 border border-cyan-500/60 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  autoFocus
                                />
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditComment(c.id)}
                                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="text-[11px] text-zinc-500 hover:text-zinc-400 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-zinc-200 mt-1 leading-relaxed break-words">
                                {c.text}
                              </p>
                            )}

                            {/* Action Buttons: Reply, Edit, Delete */}
                            <div className="flex items-center space-x-3.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setCommentInputText(`@${c.username} `);
                                  commentInputRef.current?.focus();
                                }}
                                className="text-[11px] text-zinc-500 font-semibold hover:text-cyan-400 transition cursor-pointer"
                              >
                                Reply
                              </button>
                              {isOwnComment && !c.isPosting && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(c)}
                                    className="text-[11px] text-zinc-500 font-semibold hover:text-cyan-400 transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="text-[11px] text-zinc-500 font-semibold hover:text-rose-400 transition cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Comment Like Heart */}
                        <button
                          type="button"
                          onClick={() => handleToggleLikeComment(c.id, c.likes || 0)}
                          className="text-zinc-500 hover:text-rose-400 p-1 flex-shrink-0 flex flex-col items-center group/heart transition cursor-pointer"
                          title="Like comment"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform group-hover/heart:scale-125 ${
                              isLiked ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'
                            }`}
                          />
                          {displayLikes > 0 && (
                            <span
                              className={`text-[10px] font-mono mt-0.5 ${
                                isLiked ? 'text-rose-400 font-bold' : 'text-zinc-500'
                              }`}
                            >
                              {displayLikes}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Optimistic Sending Notification Bar */}
              {optimisticStatus && (
                <div className="px-4 py-1.5 bg-rose-950/40 border-t border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Posting comment...</span>
                  </div>
                </div>
              )}

              {/* Reaction GIF Selector Strip (Toggled by GIF button) */}
              {showGifPicker && (
                <div className="px-3 py-2 bg-[#12121e] border-t border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 flex-shrink-0">
                    GIF Reactions:
                  </span>
                  {TRENDING_REACTION_GIFS.map((gif, idx) => (
                    <button
                      key={`reaction-gif-${idx}`}
                      type="button"
                      onClick={() => handleSendComment(undefined, `${gif.label} ${gif.tag}`)}
                      className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-cyan-900/60 border border-zinc-700 hover:border-cyan-500/50 text-zinc-200 text-xs font-medium whitespace-nowrap transition cursor-pointer"
                    >
                      {gif.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Emojis Row (Exact match to video: ❤️ 🔥 👏 😢 😍 😂 😮 🥺 🥳 💙) */}
              <div className="px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between overflow-x-auto scrollbar-none bg-[#090910]">
                {QUICK_EMOJIS.map((emoji, idx) => (
                  <button
                    key={`quick-emoji-${emoji}-${idx}`}
                    type="button"
                    onClick={() => {
                      setCommentInputText((prev) => prev + emoji);
                      commentInputRef.current?.focus();
                    }}
                    className="text-lg hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Bottom Sticky Comment Input Bar (Direct match to video 00:34-00:46) */}
              <form
                onSubmit={(e) => handleSendComment(e)}
                className="p-3 bg-[#0a0a12] border-t border-zinc-800/80 flex items-center space-x-2.5 flex-shrink-0"
              >
                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt="My avatar"
                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 flex items-center bg-[#141420] border border-zinc-800 rounded-full px-3 py-1.5 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder="Join the conversation..."
                    value={commentInputText}
                    onChange={(e) => setCommentInputText(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                  />

                  <div className="flex items-center space-x-2 pl-2">
                    {/* Sticker/Media button */}
                    <button
                      type="button"
                      onClick={() => setCommentInputText((prev) => prev + ' ✨')}
                      className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Add sticker"
                    >
                      <LucideImage className="w-4 h-4" />
                    </button>

                    {/* GIF Picker button */}
                    <button
                      type="button"
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        showGifPicker
                          ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                          : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                      }`}
                      title="Reaction GIFs"
                    >
                      GIF
                    </button>
                  </div>
                </div>

                {/* Send Button: Blue circular button with white upward arrow */}
                <button
                  type="submit"
                  disabled={!commentInputText.trim()}
                  className="w-8 h-8 rounded-full bg-[#0095f6] hover:bg-[#1877f2] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-[0_0_10px_rgba(0,149,246,0.4)] flex-shrink-0"
                  title="Send comment"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. INSTAGRAM SHARE TO FRIENDS MODAL SHEET (Direct match to video 00:54-00:59) */}
      <AnimatePresence>
        {activeSharePost && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setActiveSharePost(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0d0d16] border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              id="instagram-share-sheet"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Share to</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm">
                    Links you share are unique to you and may be used to improve suggestions and ads you see.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSharePost(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition cursor-pointer"
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

              {/* Circular Friends List (Diane Dili 💕, Jamie erinah, Kazibwe Davix, simon, Lil Danz Belton, tegara30) */}
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
                        className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group select-none"
                      >
                        <div className="relative">
                          <img
                            src={friend.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={friend.name}
                            className={`w-14 h-14 rounded-full object-cover border-2 transition ${
                              isSent ? 'border-emerald-400 scale-95' : 'border-zinc-700 group-hover:border-cyan-400'
                            }`}
                            referrerPolicy="no-referrer"
                          />
                          {isSent && (
                            <span className="absolute bottom-0 right-0 p-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold shadow-md">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          {friend.statusTime && !isSent && (
                            <span className="absolute -top-1 -right-1 px-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-mono text-zinc-300">
                              {friend.statusTime}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-300 truncate max-w-[68px] text-center">
                          {friend.name}
                        </span>
                        <span className={`text-[10px] font-semibold ${isSent ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {isSent ? 'Sent ✓' : 'Send'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Row: WhatsApp, WhatsApp Status, Add to story, Copy link */}
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
                  onClick={() => alert('Post added to your Nightgram Story')}
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
