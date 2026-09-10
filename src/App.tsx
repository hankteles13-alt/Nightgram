import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  MessageSquare,
  User,
  Plus,
  PlusSquare,
  Bell,
  Play,
  Pause,
  Home,
  Search,
  Film,
  Heart,
  CheckCircle,
  Clock,
  Sparkles,
  Contrast,
  Settings,
} from 'lucide-react';
import { Post, Story, Message, UserProfile } from './types';
import {
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_MESSAGES,
  CURRENT_USER,
  NOTIFICATIONS,
} from './data';
import StoriesSection from './components/StoriesSection';
import FeedSection from './components/FeedSection';
import CreatePostModal from './components/CreatePostModal';
import CreateStoryModal from './components/CreateStoryModal';
import CreateShortModal from './components/CreateShortModal';
import CreatorChoiceSheet from './components/CreatorChoiceSheet';
import MessagesSection from './components/MessagesSection';
import ProfileSection from './components/ProfileSection';
import { ReelsSection, ShortVideo, DEFAULT_SHORTS } from './components/ReelsSection';
import WelcomeCoverScreen from './components/WelcomeCoverScreen';
import AuthScreen from './components/AuthScreen';
import AvatarStatusIndicator from './components/AvatarStatusIndicator';
import PullToRefresh from './components/PullToRefresh';
import { AppSettingsModal } from './components/AppSettingsModal';
import SearchUsersModal from './components/SearchUsersModal';
import UserProfileModal from './components/UserProfileModal';
import { optimizeImageForFirestore } from './lib/imageOptimizer';
import { auth, onAuthStateChanged, signOut } from './lib/supabaseAuth';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
} from './lib/firebase';

export default function App() {
  // Current logged in user (Firebase profile)
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore Synchronized states
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Other UI states
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('nightgram_notifications');
    return saved ? JSON.parse(saved) : NOTIFICATIONS;
  });

  const [isTrueBlack, setIsTrueBlack] = useState<boolean>(() => {
    return localStorage.getItem('nightgram_theme') === 'true_black';
  });

  const toggleTheme = () => {
    const nextTheme = !isTrueBlack;
    setIsTrueBlack(nextTheme);
    localStorage.setItem('nightgram_theme', nextTheme ? 'true_black' : 'deep_charcoal');
  };

  const [activeTab, setActiveTab] = useState<'feed' | 'shorts' | 'messages' | 'profile'>('feed');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('niytee_agreed_terms') === 'true';
  });
  const [selectedMood, setSelectedMood] = useState('All Vibes');
  const [showCreateChooser, setShowCreateChooser] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [showCreateShortModal, setShowCreateShortModal] = useState(false);
  const [shorts, setShorts] = useState<ShortVideo[]>(() => {
    try {
      const saved = localStorage.getItem('nightgram_shorts');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed && parsed.length > 0 ? parsed : DEFAULT_SHORTS;
    } catch {
      return DEFAULT_SHORTS;
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'all' | 'unread' | 'mentions'>('all');
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<{ uid?: string; username: string; displayName?: string; avatar?: string } | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<any | null>(null);

  // Global shortcut (Cmd+K / Ctrl+K) to search users by username
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Header visibility scroll listener state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsHeaderVisible(false);
        setShowNotifications(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenChatWithUser = (user: { uid?: string; username: string; displayName?: string; avatar?: string }) => {
    setTargetChatUser(user);
    setActiveTab('messages');
  };

  // Audio stream reference for atmospheric lo-fi beats
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Manage Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isGoogleUser =
          firebaseUser.app_metadata?.provider === 'google' ||
          (Array.isArray(firebaseUser.app_metadata?.providers) && firebaseUser.app_metadata.providers.includes('google')) ||
          firebaseUser.user_metadata?.iss?.includes('google') ||
          firebaseUser.user_metadata?.avatar_url?.includes('googleusercontent') ||
          sessionStorage.getItem(`nightgram_google_${firebaseUser.uid}`) === 'true';

        if (isGoogleUser) {
          sessionStorage.setItem(`nightgram_2fa_${firebaseUser.uid}`, 'true');
        }

        const isSession2FAValid =
          isGoogleUser ||
          sessionStorage.getItem(`nightgram_2fa_${firebaseUser.uid}`) === 'true';

        setIs2FAVerified(isSession2FAValid);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data());
          } else {
            // Create user profile document if it doesn't exist
            const defaultCommunityFollowers = [
              'synth_fox',
              'nocturnal_rider',
              'tokyo_drift',
              'beat_maker',
              'luna_vibes',
              'coffee_at_3am',
              'cyber_wanderer',
            ];
            const defaultCommunityFollowing = ['nocturnal_rider', 'tokyo_drift', 'coffee_at_3am'];

            const fallbackProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'dreamer')
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, ''),
              displayName: firebaseUser.displayName || 'A Midnight Dreamer',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              bio: 'Chasing midnight dreams.',
              followers: defaultCommunityFollowers.length,
              following: defaultCommunityFollowing.length,
              followersList: defaultCommunityFollowers,
              followingList: defaultCommunityFollowing,
              stars: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, fallbackProfile);
            setCurrentUser(fallbackProfile);
          }
        } catch (err) {
          console.warn('Auth user profile fetch fallback:', err);
          const defaultCommunityFollowers = [
            'synth_fox',
            'nocturnal_rider',
            'tokyo_drift',
            'beat_maker',
            'luna_vibes',
            'coffee_at_3am',
            'cyber_wanderer',
          ];
          const defaultCommunityFollowing = ['nocturnal_rider', 'tokyo_drift', 'coffee_at_3am'];

          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'dreamer')
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, ''),
            displayName: firebaseUser.displayName || 'A Midnight Dreamer',
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: 'Chasing midnight dreams.',
            followers: defaultCommunityFollowers.length,
            following: defaultCommunityFollowing.length,
            followersList: defaultCommunityFollowers,
            followingList: defaultCommunityFollowing,
            stars: 0,
          });
        }
      } else {
        setCurrentUser(null);
        setIs2FAVerified(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Profile Listener (keeps profile in sync across edits)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUser(docSnap.data());
        }
      },
      (err) => {
        console.warn('Profile listener error (offline/cache mode):', err);
      }
    );
    return () => unsubscribeProfile();
  }, [currentUser?.uid]);

  // 3. Listen to Posts, Stories, and Shorts in Real-time from Firestore for all users
  useEffect(() => {
    // Listen to Posts in Real-time
    const unsubscribePosts = onSnapshot(
      collection(db, 'posts'),
      (snapshot) => {
        const fetchedPosts: Post[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedPosts.push({
            id: docSnap.id,
            username: data.username || 'anonymous',
            userAvatar:
              data.userAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            userId: data.userId || '',
            image: data.image && data.image.trim() ? data.image : 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000',
            caption: data.caption || '',
            location: data.location || '',
            time: data.time || 'Midnight',
            likes: data.likedBy ? data.likedBy.length : (data.likes || 0),
            comments: data.comments || [],
            isLiked: currentUser?.uid ? (data.likedBy ? data.likedBy.includes(currentUser.uid) : false) : false,
            isSaved: currentUser?.uid ? (data.savedBy ? data.savedBy.includes(currentUser.uid) : false) : false,
            mood: data.mood || 'Vaporwave',
            tags: data.tags || [],
            likedBy: data.likedBy || [],
            savedBy: data.savedBy || [],
            createdAt: data.createdAt || '',
          });
        });

        // Sort descending by created date
        fetchedPosts.sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setPosts(fetchedPosts);
      },
      (err) => {
        console.warn('Firestore posts snapshot warning:', err);
      }
    );

    // Listen to Stories in Real-time
    const unsubscribeStories = onSnapshot(
      collection(db, 'stories'),
      (snapshot) => {
        const fetchedStories: Story[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedStories.push({
            id: docSnap.id,
            username: data.username || 'anonymous',
            userAvatar:
              data.userAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            userId: data.userId || '',
            mediaUrl: data.mediaUrl && data.mediaUrl.trim() ? data.mediaUrl : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
            caption: data.caption || '',
            mood: data.mood || 'Cozy',
            createdAt: data.createdAt || '',
          });
        });

        fetchedStories.sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setStories(fetchedStories);
      },
      (err) => {
        console.warn('Firestore stories snapshot warning:', err);
      }
    );

    // Listen to Shorts (Video Reels) in Real-time from Firestore
    const unsubscribeShorts = onSnapshot(
      collection(db, 'shorts'),
      (snapshot) => {
        const fetchedShorts: ShortVideo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const safeVideo =
            data.videoUrl && !data.videoUrl.startsWith('blob:')
              ? data.videoUrl
              : 'https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-city-at-night-42646-large.mp4';
          const safePoster =
            data.posterUrl && data.posterUrl.trim()
              ? data.posterUrl
              : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800';

          fetchedShorts.push({
            id: docSnap.id,
            creator: data.creator || {
              username: data.username || 'dreamer',
              displayName: data.displayName || 'Midnight Dreamer',
              avatar:
                data.userAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              badge: '🌙 Night Owl',
              isFollowing: false,
            },
            videoUrl: safeVideo,
            posterUrl: safePoster,
            caption: data.caption || 'Nightgram Short',
            tags: data.tags || ['nightgram', 'shorts'],
            audioTrack: data.audioTrack || {
              title: 'Midnight Radio',
              artist: data.username || 'Nightgram',
              codeNumber: '0001',
            },
            likes: data.likedBy ? data.likedBy.length : (data.likes || 0),
            commentsCount: data.commentsCount || (data.comments ? data.comments.length : 0),
            sharesCount: data.sharesCount || 0,
            savesCount: data.savedBy ? data.savedBy.length : (data.savesCount || 0),
            isLiked: currentUser?.uid ? (data.likedBy ? data.likedBy.includes(currentUser.uid) : false) : false,
            isSaved: currentUser?.uid ? (data.savedBy ? data.savedBy.includes(currentUser.uid) : false) : false,
            timeAgo: data.timeAgo || 'Just now',
            moodTag: data.moodTag || 'Cyber City',
            createdAt: data.createdAt || '',
          });
        });

        fetchedShorts.sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        // Merge with preset default shorts so there are always variety
        const combined = [...fetchedShorts];
        for (const def of DEFAULT_SHORTS) {
          if (!combined.some((s) => s.id === def.id)) {
            combined.push(def);
          }
        }
        setShorts(combined);
      },
      (err) => {
        console.warn('Firestore shorts snapshot warning:', err);
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribeStories();
      unsubscribeShorts();
    };
  }, [currentUser?.uid]);

  // 4. Listen to user's whisper box (messages) in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;
    const messagesQuery = query(collection(db, 'users', currentUser.uid, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages: Message[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedMessages.push({
            id: docSnap.id,
            sender: data.sender,
            text: data.text,
            timestamp: data.timestamp,
          });
        });
        setMessages(fetchedMessages);
      },
      (err) => {
        console.warn('Firestore user messages snapshot warning:', err);
      }
    );

    return () => unsubscribeMessages();
  }, [currentUser?.uid]);

  // 5. Track unread direct chats for currentUser
  const [unreadDirectChatsCount, setUnreadDirectChatsCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadDirectChatsCount(0);
      return;
    }
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let count = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.unreadBy && data.unreadBy.includes(currentUser.uid)) {
            count++;
          }
        });
        setUnreadDirectChatsCount(count);
      }, (err) => {
        console.warn('Unread chats count snapshot warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up unread chats counter:', e);
    }
  }, [currentUser?.uid]);

  // Synchronize notifications to localStorage
  useEffect(() => {
    localStorage.setItem('nightgram_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Audio player init/trigger
  const toggleLofi = () => {
    if (!audioRef.current) {
      // Atmospheric, slow ambient chill chord progression
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.25; // Quiet, subtle volume level
    }

    if (isLofiPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.log('Audio autoplay prevented: ', err));
    }
    setIsLofiPlaying(!isLofiPlaying);
  };

  // Pull to refresh state
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);

  const handleRefreshFeed = async () => {
    if (isRefreshingFeed) return;
    setIsRefreshingFeed(true);
    try {
      // Direct re-fetch of the posts collection from Firestore with client-side sort
      const snapshot = await getDocs(collection(db, 'posts'));
      const fetchedPosts: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedPosts.push({
          id: docSnap.id,
          username: data.username || 'anonymous',
          userAvatar: data.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          userId: data.userId || '',
          image: data.image && data.image.trim() ? data.image : 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000',
          caption: data.caption || '',
          location: data.location || '',
          time: data.time || 'Midnight',
          likes: data.likedBy ? data.likedBy.length : (data.likes || 0),
          comments: data.comments || [],
          isLiked: currentUser ? (data.likedBy ? data.likedBy.includes(currentUser.uid) : false) : false,
          isSaved: currentUser ? (data.savedBy ? data.savedBy.includes(currentUser.uid) : false) : false,
          mood: data.mood || 'Vaporwave',
          tags: data.tags || [],
          likedBy: data.likedBy || [],
          savedBy: data.savedBy || [],
          createdAt: data.createdAt || '',
        });
      });

      fetchedPosts.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setPosts(fetchedPosts);
    } catch (err) {
      console.warn('Firestore posts manual re-fetch warning:', err);
    } finally {
      // Artificial delay so the pull-to-refresh animation provides tactile feedback
      await new Promise((resolve) => setTimeout(resolve, 650));
      setIsRefreshingFeed(false);
    }
  };

  // State actions
  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likedBy = postData.likedBy || [];
        const isLikedNow = likedBy.includes(currentUser.uid);
        await updateDoc(postRef, {
          likedBy: isLikedNow ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        });
      }
    } catch (err) {
      console.error('Error liking post: ', err);
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const savedBy = postData.savedBy || [];
        const isSavedNow = savedBy.includes(currentUser.uid);
        await updateDoc(postRef, {
          savedBy: isSavedNow ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        });
      }
    } catch (err) {
      console.error('Error saving post: ', err);
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!currentUser) return;
    try {
      const newComment = {
        id: `comment-${Date.now()}`,
        username: currentUser.username || 'dreamer',
        userAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        userId: currentUser.uid,
        text: commentText,
        time: 'Just now',
      };
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });
    } catch (err) {
      console.error('Error adding comment: ', err);
    }
  };

  const handleSendMessage = async (sender: 'me' | 'teles' | string, text: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'messages'), {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error sending message: ', err);
    }
  };

  const handleClearMessages = async () => {
    if (currentUser?.uid) {
      try {
        const msgsRef = collection(db, 'users', currentUser.uid, 'messages');
        const snapshot = await getDocs(msgsRef);
        const deletePromises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, 'users', currentUser.uid, 'messages', docSnap.id))
        );
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error clearing messages: ', err);
      }
    }
    setMessages([]);
  };

  const handleCreatePostSubmit = async (newPost: Post) => {
    if (!currentUser) return;
    try {
      // Ensure image is safely compressed below Firestore's 1MB limit
      let safeImage = newPost.image;
      if (safeImage && safeImage.startsWith('data:image')) {
        safeImage = await optimizeImageForFirestore(safeImage, {
          maxDimension: 1200,
          quality: 0.82,
          maxSizeBytes: 420000,
        });
      }

      if (!safeImage || !safeImage.trim()) {
        safeImage = 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000';
      }

      let safeAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      if (safeAvatar && safeAvatar.startsWith('data:image') && safeAvatar.length > 50000) {
        safeAvatar = await optimizeImageForFirestore(safeAvatar, {
          maxDimension: 250,
          quality: 0.8,
          maxSizeBytes: 60000,
        });
      }

      const docRef = await addDoc(collection(db, 'posts'), {
        username: currentUser.username || 'dreamer',
        userAvatar: safeAvatar,
        userId: currentUser.uid,
        image: safeImage,
        caption: newPost.caption || '',
        location: newPost.location || 'Night Scene',
        mood: newPost.mood || 'Urban Neon',
        tags: newPost.tags || [],
        time: newPost.time || 'Midnight',
        likedBy: [],
        savedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
      });

      // Optimistic local state prepend if needed
      const optimisticPost: Post = {
        ...newPost,
        id: docRef.id,
        image: safeImage,
        userAvatar: safeAvatar,
      };
      setPosts((prev) => {
        if (prev.some((p) => p.id === docRef.id)) return prev;
        return [optimisticPost, ...prev];
      });

      setShowCreateModal(false);
      setActiveTab('feed');

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'system',
          user: {
            username: currentUser.username || 'you',
            avatar: safeAvatar,
          },
          content: '✨ Your midnight photo has been posted to the feed!',
          time: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('Error creating post: ', err);
      alert(err.message || 'Failed to create post. Please try another image.');
    }
  };

  const handleCreateStorySubmit = async (newStory: { mediaUrl: string; caption: string; mood: string }) => {
    if (!currentUser) return;
    try {
      let safeMedia = newStory.mediaUrl;
      if (safeMedia && safeMedia.startsWith('data:image')) {
        safeMedia = await optimizeImageForFirestore(safeMedia, {
          maxDimension: 1080,
          quality: 0.82,
          maxSizeBytes: 380000,
        });
      }

      if (!safeMedia || !safeMedia.trim()) {
        safeMedia = 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800';
      }

      let safeAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      if (safeAvatar && safeAvatar.startsWith('data:image') && safeAvatar.length > 50000) {
        safeAvatar = await optimizeImageForFirestore(safeAvatar, {
          maxDimension: 250,
          quality: 0.8,
          maxSizeBytes: 60000,
        });
      }

      await addDoc(collection(db, 'stories'), {
        username: currentUser.username || 'dreamer',
        userAvatar: safeAvatar,
        userId: currentUser.uid,
        mediaUrl: safeMedia,
        caption: newStory.caption || '',
        mood: newStory.mood || 'Urban Neon',
        createdAt: new Date().toISOString(),
      });
      setShowCreateStoryModal(false);
      setActiveTab('feed');

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'system',
          user: {
            username: currentUser.username || 'you',
            avatar: safeAvatar,
          },
          content: '🌙 Your story is now live for the next 24 hours!',
          time: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('Error creating story: ', err);
      alert(err.message || 'Failed to create story. Please try another image.');
    }
  };

  const handleCreateShortSubmit = async (newShort: ShortVideo) => {
    let safePoster = newShort.posterUrl;
    if (safePoster && safePoster.startsWith('data:image') && safePoster.length > 50000) {
      try {
        safePoster = await optimizeImageForFirestore(safePoster, {
          maxDimension: 720,
          quality: 0.8,
          maxSizeBytes: 120000,
        });
      } catch {}
    }

    let safeAvatar =
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    if (safeAvatar && safeAvatar.startsWith('data:image') && safeAvatar.length > 50000) {
      try {
        safeAvatar = await optimizeImageForFirestore(safeAvatar, {
          maxDimension: 250,
          quality: 0.8,
          maxSizeBytes: 60000,
        });
      } catch {}
    }

    // Ensure the videoUrl is universal and streamable by all users on all devices
    const publicStreams = [
      'https://assets.mixkit.co/videos/preview/mixkit-traffic-in-a-city-at-night-42646-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-the-water-of-a-lake-seen-up-18312-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-driving-down-a-tunnel-at-night-42649-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-in-a-club-with-neon-lights-42526-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-1610-large.mp4',
    ];
    let publicVideoUrl = newShort.videoUrl;
    if (!publicVideoUrl || publicVideoUrl.startsWith('blob:') || !publicVideoUrl.startsWith('http')) {
      const chosenIdx = Math.abs((newShort.caption || '').length + (newShort.tags?.length || 0)) % publicStreams.length;
      publicVideoUrl = publicStreams[chosenIdx];
    }

    const shortPayload = {
      userId: currentUser?.uid || 'community_user',
      username: currentUser?.username || 'dreamer',
      displayName: currentUser?.displayName || 'A Midnight Dreamer',
      userAvatar: safeAvatar,
      creator: {
        username: currentUser?.username || 'dreamer',
        displayName: currentUser?.displayName || 'A Midnight Dreamer',
        avatar: safeAvatar,
        badge: '🌙 Night Owl',
        isFollowing: false,
      },
      videoUrl: publicVideoUrl,
      posterUrl: safePoster || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      caption: newShort.caption || 'Nightgram Short',
      tags: newShort.tags || ['nightgram', 'shorts'],
      audioTrack: newShort.audioTrack || {
        title: 'Midnight Radio',
        artist: currentUser?.username || 'Nightgram',
        codeNumber: '0001',
      },
      likes: 1,
      likedBy: currentUser?.uid ? [currentUser.uid] : [],
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0,
      savedBy: [],
      timeAgo: 'Just now',
      moodTag: newShort.moodTag || 'Cyber City',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'shorts'), shortPayload);
      const optimisticShort: ShortVideo = {
        ...newShort,
        id: docRef.id,
        posterUrl: safePoster || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
        creator: {
          username: currentUser?.username || 'dreamer',
          displayName: currentUser?.displayName || 'A Midnight Dreamer',
          avatar: safeAvatar,
          badge: '🌙 Night Owl',
          isFollowing: false,
        },
      };

      setShorts((prev) => [optimisticShort, ...prev.filter((s) => s.id !== docRef.id)]);
    } catch (err) {
      console.warn('Firestore short saving notice (fallback local):', err);
      setShorts((prev) => [newShort, ...prev]);
    }

    try {
      localStorage.setItem('nightgram_shorts', JSON.stringify([newShort, ...shorts]));
    } catch {}

    setActiveTab('shorts');
    setShowCreateShortModal(false);
    setShowCreateChooser(false);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'system',
        user: {
          username: currentUser?.username || 'you',
          avatar: safeAvatar,
        },
        content: '🎬 Your short video has been published to Reels!',
        time: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleFollowCreator = async (creator: {
    username: string;
    displayName?: string;
    avatar?: string;
    isFollowing: boolean;
  }) => {
    if (!currentUser) return;

    const usernameLower = creator.username.toLowerCase();
    const currentFollowingList = currentUser.followingList || ['nocturnal_rider', 'tokyo_drift', 'coffee_at_3am'];
    let nextFollowingList: string[];

    if (creator.isFollowing) {
      if (!currentFollowingList.includes(usernameLower)) {
        nextFollowingList = [...currentFollowingList, usernameLower];
      } else {
        nextFollowingList = currentFollowingList;
      }
    } else {
      nextFollowingList = currentFollowingList.filter((u) => u !== usernameLower);
    }

    const nextFollowingCount = nextFollowingList.length;
    const updatedUser: UserProfile = {
      ...currentUser,
      following: nextFollowingCount,
      followingList: nextFollowingList,
    };

    setCurrentUser(updatedUser);

    // Sync to Firestore if logged in
    if (currentUser.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          following: nextFollowingCount,
          followingList: nextFollowingList,
        });
      } catch (err) {
        console.warn('Notice syncing follow list to Firestore:', err);
      }
    }

    // Add notification when following a creator
    if (creator.isFollowing) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'follow',
          user: {
            username: creator.username,
            avatar: creator.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
          content: `You followed @${creator.username} from Shorts!`,
          time: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const handleRemoveFollower = async (targetUsername: string) => {
    if (!currentUser) return;

    const usernameLower = targetUsername.toLowerCase();
    const currentFollowersList =
      currentUser.followersList || [
        'synth_fox',
        'nocturnal_rider',
        'tokyo_drift',
        'beat_maker',
        'luna_vibes',
        'coffee_at_3am',
        'cyber_wanderer',
      ];
    const nextFollowersList = currentFollowersList.filter((u) => u !== usernameLower);
    const nextFollowersCount = nextFollowersList.length;

    const updatedUser: UserProfile = {
      ...currentUser,
      followers: nextFollowersCount,
      followersList: nextFollowersList,
    };

    setCurrentUser(updatedUser);

    if (currentUser.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          followers: nextFollowersCount,
          followersList: nextFollowersList,
        });
      } catch (err) {
        console.warn('Notice syncing followers to Firestore:', err);
      }
    }
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile> | UserProfile) => {
    if (!currentUser?.uid) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);

      const newDisplayName = updated.displayName !== undefined ? updated.displayName : (currentUser.displayName || currentUser.username || 'A Midnight Dreamer');
      const newBio = updated.bio !== undefined ? updated.bio : (currentUser.bio || '');
      let newAvatar = updated.avatar !== undefined && updated.avatar !== null && updated.avatar !== '' 
        ? updated.avatar 
        : (currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      const newUsername = updated.username !== undefined ? updated.username : (currentUser.username || 'dreamer');

      if (newAvatar && newAvatar.startsWith('data:image') && newAvatar.length > 50000) {
        try {
          newAvatar = await optimizeImageForFirestore(newAvatar, {
            maxDimension: 250,
            quality: 0.8,
            maxSizeBytes: 60000,
          });
        } catch (err) {
          console.warn('Avatar optimization fallback:', err);
        }
      }

      const updateData: Record<string, any> = {
        displayName: newDisplayName,
        bio: newBio,
        avatar: newAvatar,
        username: newUsername,
      };

      if (updated.email !== undefined) updateData.email = updated.email;
      if (updated.phoneNumber !== undefined) updateData.phoneNumber = updated.phoneNumber;
      if (updated.settings !== undefined) updateData.settings = updated.settings;

      await updateDoc(userRef, updateData);

      // If username changed, reserve new username and release previous one
      if (newUsername && newUsername !== currentUser.username) {
        try {
          await setDoc(doc(db, 'usernames', newUsername), {
            uid: currentUser.uid,
            updatedAt: new Date().toISOString(),
          });
          if (currentUser.username) {
            await deleteDoc(doc(db, 'usernames', currentUser.username));
          }
        } catch (uErr) {
          console.warn('Username reservation sync notice:', uErr);
        }
      }

      // Update local state immediately so all UI components update instantly
      const updatedUser = {
        ...currentUser,
        displayName: newDisplayName,
        bio: newBio,
        avatar: newAvatar,
        username: newUsername,
        ...(updated.email !== undefined ? { email: updated.email } : {}),
        ...(updated.phoneNumber !== undefined ? { phoneNumber: updated.phoneNumber } : {}),
        ...(updated.settings !== undefined ? { settings: updated.settings } : {}),
      };
      setCurrentUser(updatedUser);

      // Synchronize local posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          const isUserPost = post.userId === currentUser.uid || post.username === currentUser.username;
          const updatedComments = (post.comments || []).map((comment) =>
            comment.userId === currentUser.uid || comment.username === currentUser.username
              ? { ...comment, userAvatar: newAvatar }
              : comment
          );

          if (isUserPost) {
            return {
              ...post,
              userAvatar: newAvatar,
              username: newUsername,
              comments: updatedComments,
            };
          }
          return {
            ...post,
            comments: updatedComments,
          };
        })
      );

      // Update Firestore posts collection
      if (updated.avatar !== undefined) {
        try {
          const postsRef = collection(db, 'posts');
          const userPostsQ = query(postsRef, where('userId', '==', currentUser.uid));
          const userPostsSnap = await getDocs(userPostsQ);
          userPostsSnap.forEach((docSnap) => {
            updateDoc(doc(db, 'posts', docSnap.id), {
              userAvatar: newAvatar,
            });
          });
        } catch (e) {
          console.error('Error updating user posts in Firestore:', e);
        }
      }

      // Update Firestore chats participantProfiles
      try {
        const chatsRef = collection(db, 'chats');
        const userChatsQ = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const userChatsSnap = await getDocs(userChatsQ);
        userChatsSnap.forEach((docSnap) => {
          const chatUpdatePayload: Record<string, any> = {
            [`participantProfiles.${currentUser.uid}.avatar`]: newAvatar,
            [`participantProfiles.${currentUser.uid}.displayName`]: newDisplayName,
            [`participantProfiles.${currentUser.uid}.username`]: newUsername,
          };
          updateDoc(doc(db, 'chats', docSnap.id), chatUpdatePayload);
        });
      } catch (e) {
        console.error('Error updating user chats in Firestore:', e);
      }
    } catch (err) {
      console.error('Error updating profile: ', err);
    }
  };

  const handleSignOut = async () => {
    try {
      if (currentUser?.uid) {
        sessionStorage.removeItem(`nightgram_2fa_${currentUser.uid}`);
      }
      setIs2FAVerified(false);
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error signing out: ', err);
    }
  };

  const triggerVibration = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore if restricted or unsupported
      }
    }
  };

  const handleNotificationClick = (notifId: string) => {
    triggerVibration(15);
    setNotifications((prev) =>
      prev.map((n: any) => (n.id === notifId ? { ...n, unread: false } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    triggerVibration([10, 30, 10]);
    setNotifications((prev) => prev.map((n: any) => ({ ...n, unread: false })));
  };

  const unreadNotifsCount = notifications.filter((n: any) => n.unread).length;

  const filteredNotifications = notifications.filter((notif: any) => {
    if (notifFilterTab === 'unread') return notif.unread;
    if (notifFilterTab === 'mentions') {
      const actionLower = (notif.action || '').toLowerCase();
      const targetLower = (notif.target || '').toLowerCase();
      return (
        actionLower.includes('comment') ||
        actionLower.includes('mention') ||
        actionLower.includes('tag') ||
        actionLower.includes('reply') ||
        actionLower.includes('starred') ||
        actionLower.includes('@') ||
        targetLower.includes('@')
      );
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#030305] text-zinc-200 flex flex-col items-center justify-center p-4" id="app-auth-loading">
        <div className="text-center space-y-4">
          <Moon className="w-10 h-10 text-cyan-400 fill-cyan-400 animate-pulse mx-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
          <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Awaiting late-night frequency...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !is2FAVerified) {
    if (!hasAcceptedTerms) {
      return (
        <WelcomeCoverScreen
          onAgree={() => {
            localStorage.setItem('niytee_agreed_terms', 'true');
            setHasAcceptedTerms(true);
          }}
        />
      );
    }
    return (
      <AuthScreen
        pendingTwoFactorUser={currentUser && !is2FAVerified ? currentUser : null}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          setIs2FAVerified(true);
          if (profile?.uid) {
            sessionStorage.setItem(`nightgram_2fa_${profile.uid}`, 'true');
          }
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div
      className={`min-h-screen h-screen w-full ${
        isTrueBlack ? 'bg-black' : 'bg-[#030305]'
      } text-zinc-200 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300 overflow-hidden`}
      id="nightgram-root-container"
    >
      {/* Absolute Neon Ambient Background Blobs */}
      <div className={`fixed top-0 right-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none z-0 transition-opacity duration-300 ${isTrueBlack ? 'opacity-15' : 'opacity-100'}`}></div>
      <div className={`fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-950/10 rounded-full blur-[150px] pointer-events-none z-0 transition-opacity duration-300 ${isTrueBlack ? 'opacity-15' : 'opacity-100'}`}></div>

      {/* Primary Sticky Header */}
      {activeTab !== 'shorts' && activeTab !== 'messages' && (
        <header
          className={`sticky top-0 z-40 ${
            isTrueBlack ? 'bg-black/95 border-zinc-900/90' : 'bg-[#06060a]/85 border-zinc-900/80'
          } backdrop-blur-xl border-b px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-300 ease-in-out ${
            isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
          id="app-header-bar"
        >
        <div className="flex items-center space-x-3 cursor-pointer select-none" id="brand-container" onClick={() => setActiveTab('feed')}>
          <div className="relative" id="logo-wrapper">
            <Moon className="w-6 h-6 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-[0.1em] uppercase bg-gradient-to-r from-zinc-100 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent font-sans">
              Nightgram
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              Midnight Frequency
            </p>
          </div>
        </div>

        {/* Search Citizens Input Trigger */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
          <button
            id="header-search-citizens-btn"
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-[#12121a]/90 hover:bg-[#181826] border border-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-zinc-200 transition shadow-inner group cursor-pointer"
            title="Search citizens by username or name (Cmd+K)"
          >
            <div className="flex items-center space-x-2 truncate min-w-0">
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 flex-shrink-0" />
              <span className="text-xs truncate font-sans text-zinc-400 group-hover:text-zinc-200">
                Search <span className="text-cyan-400 font-mono font-semibold">@username</span> or name...
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              ⌘K
            </span>
          </button>
        </div>

        {/* Global Utilities (Theme Toggle, Lofi, Notifications, Quick Chats) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5" id="global-header-controls">
          {/* Theme Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              isTrueBlack
                ? 'bg-zinc-950 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
            title={isTrueBlack ? 'Switch to Deep Charcoal Theme' : 'Switch to True Black (OLED) Theme'}
          >
            <Contrast className={`w-3.5 h-3.5 ${isTrueBlack ? 'text-cyan-400' : 'text-zinc-400'}`} />
            <span className="hidden md:inline text-[10px] uppercase font-mono tracking-wider">
              {isTrueBlack ? 'True Black' : 'Deep Charcoal'}
            </span>
          </button>

          {/* Lofi Radio Stream */}
          <button
            id="lofi-toggle-btn"
            onClick={toggleLofi}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              isLofiPlaying
                ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Midnight Lofi Music"
          >
            {isLofiPlaying ? (
              <>
                <div className="flex space-x-0.5 items-end h-3" id="audio-bars">
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_0.8s_infinite_alternate]" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_1s_infinite_alternate]" style={{ animationDelay: '400ms' }}></span>
                </div>
                <span className="hidden sm:inline">Chill Chords</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-zinc-400 fill-zinc-400" />
                <span className="hidden sm:inline">Lofi</span>
              </>
            )}
          </button>

          {/* App Settings Button in Header */}
          <button
            id="top-header-settings-btn"
            onClick={() => setShowAppSettingsModal(true)}
            className="p-2 rounded-xl border border-zinc-800/60 bg-[#121218]/40 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition cursor-pointer"
            title="Nightgram App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>
      )}

      {/* Main Full-Screen Body Area */}
      <main
        className="flex-1 w-full mx-auto relative z-10 flex flex-col min-h-0 overflow-hidden"
        id="app-main-workspace"
      >
        <section className="w-full flex-1 flex flex-col min-h-0" id="app-stage-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col min-h-0"
              id="active-content-stage-wrapper"
            >
              {activeTab === 'feed' && (
                <PullToRefresh
                  id="feed-tab-pane"
                  className="w-full h-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-4 sm:space-y-6 flex-1"
                  onRefresh={handleRefreshFeed}
                  isRefreshing={isRefreshingFeed}
                >
                  {/* Neon Stories list */}
                  <StoriesSection
                    stories={stories}
                    currentUser={currentUser}
                    onOpenCreateStory={() => setShowCreateStoryModal(true)}
                  />

                  {/* Video format feed list */}
                  <FeedSection
                    posts={posts}
                    currentUser={currentUser}
                    onLike={handleLikePost}
                    onSave={handleSavePost}
                    onAddComment={handleAddComment}
                    selectedMood={selectedMood}
                    setSelectedMood={setSelectedMood}
                    onOpenChatWithUser={handleOpenChatWithUser}
                    onOpenUserProfile={(user) => setViewingUserProfile(user)}
                    onRefreshFeed={handleRefreshFeed}
                    isRefreshing={isRefreshingFeed}
                  />
                </PullToRefresh>
              )}

              {activeTab === 'shorts' && (
                <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden" id="shorts-tab-pane">
                  <ReelsSection
                    currentUser={currentUser}
                    onClose={() => setActiveTab('feed')}
                    onOpenChatWithUser={handleOpenChatWithUser}
                    onOpenCreateShort={() => setShowCreateShortModal(true)}
                    onOpenUserProfile={(user) => setViewingUserProfile(user)}
                    onFollowCreator={handleFollowCreator}
                    shorts={shorts}
                    setShorts={setShorts}
                  />
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden" id="messages-tab-pane">
                  <MessagesSection
                    currentUser={currentUser}
                    targetChatUser={targetChatUser}
                    onClearTargetChatUser={() => setTargetChatUser(null)}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onClearMessages={handleClearMessages}
                    onOpenAppSettings={() => setShowAppSettingsModal(true)}
                    onClose={() => {
                      setTargetChatUser(null);
                      setActiveTab('feed');
                    }}
                  />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="w-full h-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 flex-1 overflow-y-auto" id="profile-tab-pane">
                  <ProfileSection
                    userProfile={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    posts={posts}
                    onLike={handleLikePost}
                    onSignOut={handleSignOut}
                    onOpenChatWithUser={handleOpenChatWithUser}
                    onOpenUserProfile={(user) => setViewingUserProfile(user)}
                    onToggleFollowUser={(targetUser, isFollowed) =>
                      handleFollowCreator({
                        username: targetUser.username,
                        displayName: targetUser.displayName,
                        avatar: targetUser.avatar,
                        isFollowing: isFollowed,
                      })
                    }
                    followingList={currentUser?.followingList}
                    followersList={currentUser?.followersList}
                    onRemoveFollower={handleRemoveFollower}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Universal Bottom Navigation Footer */}
      <footer
        className="sticky bottom-0 z-40 bg-[#06060a]/95 backdrop-blur-xl border-t border-zinc-900/80 px-2 sm:px-4 py-2.5 sm:py-3 flex items-center justify-around w-full shadow-[0_-5px_25px_rgba(0,0,0,0.5)] flex-shrink-0"
        id="app-bottom-nav-footer"
      >
        <button
          id="nav-feed-btn"
          onClick={() => setActiveTab('feed')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="Feed Lounge"
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Feed</span>
        </button>

        {/* Short Videos Tab */}
        <button
          id="nav-shorts-btn"
          onClick={() => setActiveTab('shorts')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'shorts'
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="Short Videos"
        >
          <Film className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Shorts</span>
        </button>

        {/* Floating gradient '+' creator button */}
        <button
          id="nav-create-btn"
          onClick={() => {
            if (activeTab === 'shorts') {
              setShowCreateShortModal(true);
            } else {
              setShowCreateChooser(true);
            }
          }}
          className="p-3.5 rounded-full bg-gradient-to-tr from-cyan-400 via-cyan-500 to-purple-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)] active:scale-95 transition cursor-pointer -mt-5 border-4 border-[#030305] hover:scale-105"
          title="Create Short Video or Post"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          id="nav-messages-btn"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'messages'
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="Nightgram Chats"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadDirectChatsCount > 0 && (
              <span className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-cyan-400 text-zinc-950 font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse">
                {unreadDirectChatsCount > 9 ? '9+' : unreadDirectChatsCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Chats</span>
        </button>

        <button
          id="nav-profile-btn"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer border ${
            activeTab === 'profile'
              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="My Nebula Profile"
        >
          <div className="relative">
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={currentUser?.displayName || "Profile"}
              className="w-5 h-5 rounded-full object-cover border border-cyan-400/60"
              referrerPolicy="no-referrer"
            />
            <AvatarStatusIndicator isOnline={true} size="sm" />
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Profile</span>
        </button>
      </footer>

      {/* Creator choice modal */}
      <CreatorChoiceSheet
        isOpen={showCreateChooser}
        onClose={() => setShowCreateChooser(false)}
        onSelectShort={() => {
          setShowCreateChooser(false);
          setShowCreateShortModal(true);
        }}
        onSelectPost={() => {
          setShowCreateChooser(false);
          setShowCreateModal(true);
        }}
        onSelectStory={() => {
          setShowCreateChooser(false);
          setShowCreateStoryModal(true);
        }}
      />

      {/* Create short, post & story modal dialogs */}
      <AnimatePresence>
        {showCreateShortModal && (
          <CreateShortModal
            currentUser={currentUser}
            onClose={() => setShowCreateShortModal(false)}
            onSubmit={handleCreateShortSubmit}
          />
        )}
        {showCreateModal && (
          <CreatePostModal
            currentUser={currentUser}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePostSubmit}
            onSwitchToShorts={() => {
              setShowCreateModal(false);
              setShowCreateShortModal(true);
            }}
          />
        )}
        {showCreateStoryModal && (
          <CreateStoryModal
            currentUser={currentUser}
            onClose={() => setShowCreateStoryModal(false)}
            onSubmit={handleCreateStorySubmit}
          />
        )}
      </AnimatePresence>

      {/* Global App Settings Modal */}
      <AppSettingsModal
        isOpen={showAppSettingsModal}
        onClose={() => setShowAppSettingsModal(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onSignOut={handleSignOut}
        isTrueBlack={isTrueBlack}
        onToggleTheme={toggleTheme}
        onClearAllChats={handleClearMessages}
      />

      {/* Global Search Users by Username Modal */}
      <SearchUsersModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        currentUser={currentUser}
        onSelectUser={(user) => setViewingUserProfile(user)}
        onOpenChatWithUser={handleOpenChatWithUser}
      />

      {/* User Profile Modal when a Citizen is clicked/searched */}
      <UserProfileModal
        isOpen={Boolean(viewingUserProfile)}
        user={viewingUserProfile}
        currentUser={currentUser}
        posts={posts}
        onClose={() => setViewingUserProfile(null)}
        onOpenChatWithUser={handleOpenChatWithUser}
      />
    </div>
  );
}
