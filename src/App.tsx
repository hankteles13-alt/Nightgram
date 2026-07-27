import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  MessageSquare,
  User,
  Plus,
  Bell,
  Play,
  Pause,
  Home,
  CheckCircle,
  Clock,
  Sparkles,
  Contrast,
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
import MessagesSection from './components/MessagesSection';
import ProfileSection from './components/ProfileSection';
import ExperienceHub from './components/ExperienceHub';
import AuthScreen from './components/AuthScreen';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
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
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export default function App() {
  // Current logged in user (Firebase profile)
  const [currentUser, setCurrentUser] = useState<any | null>(null);
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

  const [activeTab, setActiveTab] = useState<'feed' | 'messages' | 'profile' | 'hub'>('feed');
  const [selectedMood, setSelectedMood] = useState('All Vibes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'all' | 'unread' | 'mentions'>('all');
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  const [targetChatUser, setTargetChatUser] = useState<{ uid?: string; username: string; displayName?: string; avatar?: string } | null>(null);

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
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data());
          } else {
            // Create user profile document if it doesn't exist
            const fallbackProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.email?.split('@')[0] || 'dreamer',
              displayName: firebaseUser.displayName || 'A Midnight Dreamer',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              bio: 'Chasing midnight dreams.',
              followers: 0,
              following: 0,
              stars: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, fallbackProfile);
            setCurrentUser(fallbackProfile);
          }
        } catch (err) {
          console.warn('Auth user profile fetch fallback:', err);
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: firebaseUser.email?.split('@')[0] || 'dreamer',
            displayName: firebaseUser.displayName || 'A Midnight Dreamer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: 'Chasing midnight dreams.',
            followers: 0,
            following: 0,
            stars: 0,
          });
        }
      } else {
        setCurrentUser(null);
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

  // Seeding helper to ensure Firestore is never completely dry
  const seedDatabaseIfEmpty = async () => {
    try {
      const postsSnap = await getDocs(query(collection(db, 'posts')));
      if (postsSnap.empty) {
        for (const post of INITIAL_POSTS) {
          await addDoc(collection(db, 'posts'), {
            username: post.username,
            userAvatar: post.userAvatar,
            userId: 'seed_author',
            image: post.image,
            caption: post.caption,
            location: post.location,
            time: post.time,
            likedBy: post.isLiked ? ['seed_author'] : [],
            savedBy: post.isSaved ? ['seed_author'] : [],
            comments: post.comments.map(c => ({ ...c, userId: 'seed_commenter' })),
            mood: post.mood,
            tags: post.tags,
            createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          });
        }
      }

      const storiesSnap = await getDocs(query(collection(db, 'stories')));
      if (storiesSnap.empty) {
        for (const story of INITIAL_STORIES) {
          await addDoc(collection(db, 'stories'), {
            username: story.username,
            userAvatar: story.userAvatar,
            userId: 'seed_author',
            mediaUrl: story.mediaUrl,
            caption: story.caption,
            mood: story.mood || 'Cozy',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Error seeding data (operating offline or seed exists):', err);
    }
  };

  // 3. Listen to Posts & Stories in Real-time from Firestore
  useEffect(() => {
    if (!currentUser) return;

    seedDatabaseIfEmpty();

    // Query posts sorted by creation date
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const fetchedPosts: Post[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedPosts.push({
            id: docSnap.id,
            username: data.username || 'anonymous',
            userAvatar: data.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            userId: data.userId || '',
            image: data.image || '',
            caption: data.caption || '',
            location: data.location || '',
            time: data.time || 'Midnight',
            likes: data.likedBy ? data.likedBy.length : (data.likes || 0),
            comments: data.comments || [],
            isLiked: data.likedBy ? data.likedBy.includes(currentUser.uid) : false,
            isSaved: data.savedBy ? data.savedBy.includes(currentUser.uid) : false,
            mood: data.mood || 'Vaporwave',
            tags: data.tags || [],
            likedBy: data.likedBy || [],
            savedBy: data.savedBy || [],
          });
        });
        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        } else {
          setPosts(INITIAL_POSTS);
        }
      },
      (err) => {
        console.warn('Firestore posts snapshot warning (using initial fallback state):', err);
        setPosts((prev) => (prev.length > 0 ? prev : INITIAL_POSTS));
      }
    );

    // Query stories sorted by creation date
    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubscribeStories = onSnapshot(
      storiesQuery,
      (snapshot) => {
        const fetchedStories: Story[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedStories.push({
            id: docSnap.id,
            username: data.username || 'anonymous',
            userAvatar: data.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            userId: data.userId || '',
            mediaUrl: data.mediaUrl || '',
            caption: data.caption || '',
            mood: data.mood || 'Cozy',
          });
        });
        if (fetchedStories.length > 0) {
          setStories(fetchedStories);
        } else {
          setStories(INITIAL_STORIES);
        }
      },
      (err) => {
        console.warn('Firestore stories snapshot warning (using initial fallback state):', err);
        setStories((prev) => (prev.length > 0 ? prev : INITIAL_STORIES));
      }
    );

    // Listen to user's whisper box (messages) in real-time
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
        
        if (fetchedMessages.length > 0) {
          setMessages(fetchedMessages);
        } else {
          // Seed initial message list in the cloud for this user if blank
          INITIAL_MESSAGES.forEach(async (msg) => {
            try {
              await addDoc(collection(db, 'users', currentUser.uid, 'messages'), {
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp,
                createdAt: new Date().toISOString(),
              });
            } catch (e) {
              console.warn('Error seeding initial user message:', e);
            }
          });
          setMessages(INITIAL_MESSAGES);
        }
      },
      (err) => {
        console.warn('Firestore user messages snapshot warning:', err);
        setMessages((prev) => (prev.length > 0 ? prev : INITIAL_MESSAGES));
      }
    );

    return () => {
      unsubscribePosts();
      unsubscribeStories();
      unsubscribeMessages();
    };
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
        username: currentUser.username,
        userAvatar: currentUser.avatar,
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

  const handleSendMessage = async (sender: 'me' | 'luna' | 'neon_wanderer' | 'night_owl', text: string) => {
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

  const handleCreatePostSubmit = async (newPost: Post) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'posts'), {
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        userId: currentUser.uid,
        image: newPost.image,
        caption: newPost.caption,
        location: newPost.location,
        mood: newPost.mood,
        tags: newPost.tags,
        time: newPost.time || 'Midnight',
        likedBy: [],
        savedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
      });
      setShowCreateModal(false);
      setActiveTab('feed');
    } catch (err) {
      console.error('Error creating post: ', err);
    }
  };

  const handleCreateStorySubmit = async (newStory: { mediaUrl: string; caption: string; mood: string }) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'stories'), {
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        userId: currentUser.uid,
        mediaUrl: newStory.mediaUrl,
        caption: newStory.caption,
        mood: newStory.mood || 'Urban Neon',
        createdAt: new Date().toISOString(),
      });
      setShowCreateStoryModal(false);
      setActiveTab('feed');
    } catch (err) {
      console.error('Error creating story: ', err);
    }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: updated.displayName,
        bio: updated.bio,
        avatar: updated.avatar,
      });

      // Update local state immediately so all UI components update instantly
      setCurrentUser({
        ...currentUser,
        displayName: updated.displayName,
        bio: updated.bio,
        avatar: updated.avatar,
      });

      // Synchronize local posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          const isUserPost = post.userId === currentUser.uid || post.username === currentUser.username;
          const updatedComments = post.comments.map((comment) =>
            comment.userId === currentUser.uid || comment.username === currentUser.username
              ? { ...comment, userAvatar: updated.avatar }
              : comment
          );

          if (isUserPost) {
            return {
              ...post,
              userAvatar: updated.avatar,
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
      try {
        const postsRef = collection(db, 'posts');
        const userPostsQ = query(postsRef, where('userId', '==', currentUser.uid));
        const userPostsSnap = await getDocs(userPostsQ);
        userPostsSnap.forEach((docSnap) => {
          updateDoc(doc(db, 'posts', docSnap.id), {
            userAvatar: updated.avatar,
          });
        });
      } catch (e) {
        console.error('Error updating user posts in Firestore:', e);
      }

      // Update Firestore chats participantProfiles
      try {
        const chatsRef = collection(db, 'chats');
        const userChatsQ = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const userChatsSnap = await getDocs(userChatsQ);
        userChatsSnap.forEach((docSnap) => {
          updateDoc(doc(db, 'chats', docSnap.id), {
            [`participantProfiles.${currentUser.uid}.avatar`]: updated.avatar,
            [`participantProfiles.${currentUser.uid}.displayName`]: updated.displayName,
          });
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
      await signOut(auth);
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

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(profile) => setCurrentUser(profile)} />;
  }

  return (
    <div
      className={`min-h-screen ${
        isTrueBlack ? 'bg-black' : 'bg-[#030305]'
      } text-zinc-200 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300`}
      id="nightgram-root-container"
    >
      {/* Absolute Neon Ambient Background Blobs */}
      <div className={`fixed top-0 right-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[140px] pointer-events-none z-0 transition-opacity duration-300 ${isTrueBlack ? 'opacity-15' : 'opacity-100'}`}></div>
      <div className={`fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-950/10 rounded-full blur-[150px] pointer-events-none z-0 transition-opacity duration-300 ${isTrueBlack ? 'opacity-15' : 'opacity-100'}`}></div>

      {/* Primary Sticky Header */}
      <header
        className={`sticky top-0 z-40 ${
          isTrueBlack ? 'bg-black/95 border-zinc-900/90' : 'bg-[#06060a]/85 border-zinc-900/80'
        } backdrop-blur-xl border-b px-4 md:px-8 py-3.5 flex items-center justify-between transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        id="app-header-bar"
      >
        <div className="flex items-center space-x-3.5" id="brand-container">
          <div className="relative" id="logo-wrapper">
            <Moon className="w-6.5 h-6.5 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
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

        {/* Global Utilities (Theme Toggle, Lofi, Notifications, Quick Chats) */}
        <div className="flex items-center space-x-2.5" id="global-header-controls">
          {/* Theme Mode Toggle (True Black vs Deep Charcoal) */}
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
            <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-wider">
              {isTrueBlack ? 'True Black' : 'Deep Charcoal'}
            </span>
          </button>

          {/* Lofi Radio Stream */}
          <button
            id="lofi-toggle-btn"
            onClick={toggleLofi}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
              isLofiPlaying
                ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {isLofiPlaying ? (
              <>
                {/* Bouncing Audio visualizer bars */}
                <div className="flex space-x-0.5 items-end h-3" id="audio-bars">
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_0.8s_infinite_alternate]" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_0.6s_infinite_alternate]" style={{ animationDelay: '200ms' }}></span>
                  <span className="w-[2px] bg-cyan-400 animate-[bounce_1s_infinite_alternate]" style={{ animationDelay: '400ms' }}></span>
                </div>
                <span>Chill Chords</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-zinc-400 fill-zinc-400" />
                <span>Midnight Lofi</span>
              </>
            )}
          </button>

          {/* Quick Chats button */}
          <button
            id="top-header-chats-btn"
            onClick={() => setActiveTab('messages')}
            className={`p-2.5 rounded-xl border transition cursor-pointer relative ${
              activeTab === 'messages'
                ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
            title="View All Encrypted Chats"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>

          {/* Notifications bell with badge */}
          <div className="relative" id="notifications-wrapper">
            <button
              id="notifications-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl border transition cursor-pointer relative ${
                showNotifications
                  ? 'bg-purple-950/20 border-purple-500/50 text-purple-300'
                  : 'bg-[#121218]/40 border-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-fuchsia-500 text-black font-extrabold text-[9px] flex items-center justify-center border-2 border-[#030305]">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notifications panel dropdown list */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  id="notifications-dropdown-card"
                  className="absolute right-0 mt-3 w-80 bg-[#09090f] border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50"
                >
                  <div className="p-3.5 border-b border-zinc-900/60 flex items-center justify-between bg-[#0e0e16]/50">
                    <span className="text-xs font-bold text-zinc-300">Nocturnal Alerts</span>
                    {unreadNotifsCount > 0 && (
                      <button
                        id="mark-all-read-btn"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] text-cyan-400 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Filter tab bar */}
                  <div className="px-3 py-1.5 border-b border-zinc-900/80 bg-[#07070d] flex items-center space-x-1" id="notifications-filter-tab-bar">
                    <button
                      id="notif-tab-all"
                      onClick={() => {
                        triggerVibration(10);
                        setNotifFilterTab('all');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        notifFilterTab === 'all'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      id="notif-tab-unread"
                      onClick={() => {
                        triggerVibration(10);
                        setNotifFilterTab('unread');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                        notifFilterTab === 'unread'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                      }`}
                    >
                      <span>Unread</span>
                      {unreadNotifsCount > 0 && (
                        <span className="px-1 py-0.2 rounded-full bg-fuchsia-500/30 text-fuchsia-300 text-[8px] font-extrabold">
                          {unreadNotifsCount}
                        </span>
                      )}
                    </button>
                    <button
                      id="notif-tab-mentions"
                      onClick={() => {
                        triggerVibration(10);
                        setNotifFilterTab('mentions');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        notifFilterTab === 'mentions'
                          ? 'bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_8px_rgba(217,70,239,0.2)]'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                      }`}
                    >
                      Mentions
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-900/40 p-1" id="notifications-list-container">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          id={`notif-row-${notif.id}`}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`group p-3 rounded-xl flex items-start space-x-3 transition-all duration-200 ease-out cursor-pointer ${
                            notif.unread
                              ? 'bg-[#12121c]/70 hover:bg-[#18182b]/95 border border-cyan-950/40 hover:border-cyan-500/40 shadow-sm hover:shadow-[0_0_16px_rgba(6,182,212,0.15)]'
                              : 'bg-transparent hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800/60'
                          }`}
                        >
                          <img
                            src={notif.userAvatar}
                            alt={notif.username}
                            className="w-8 h-8 object-cover rounded-full border border-zinc-800 group-hover:border-zinc-600 group-hover:scale-105 transition-all duration-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 text-[11px] leading-relaxed" id={`notif-meta-${notif.id}`}>
                            <p className="text-zinc-400 group-hover:text-zinc-200 transition-colors duration-200">
                              <span className="font-bold text-zinc-200 group-hover:text-white mr-1 transition-colors duration-200">
                                {notif.username}
                              </span>
                              {notif.action}
                              {notif.target && (
                                <span className="italic ml-1 text-zinc-400 group-hover:text-cyan-300 transition-colors duration-200">{notif.target}</span>
                              )}
                            </p>
                            <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 block mt-1 font-mono transition-colors duration-200">
                              {notif.time}
                            </span>
                          </div>
                          {notif.unread && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 group-hover:scale-125 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-200"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-xs text-zinc-600 font-mono">
                        {notifFilterTab === 'unread'
                          ? 'No unread notifications'
                          : notifFilterTab === 'mentions'
                          ? 'No mentions or comments found'
                          : 'The night is completely peaceful.'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

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
                <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 space-y-6 flex-1 overflow-y-auto" id="feed-tab-pane">
                  {/* Neon Stories list */}
                  <StoriesSection
                    stories={stories}
                    currentUser={currentUser}
                    onOpenCreateStory={() => setShowCreateStoryModal(true)}
                  />

                  {/* Filterable feed list */}
                  <FeedSection
                    posts={posts}
                    currentUser={currentUser}
                    onLike={handleLikePost}
                    onSave={handleSavePost}
                    onAddComment={handleAddComment}
                    selectedMood={selectedMood}
                    setSelectedMood={setSelectedMood}
                    onOpenChatWithUser={handleOpenChatWithUser}
                  />
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="w-full flex-1 flex flex-col min-h-0" id="messages-tab-pane">
                  <MessagesSection
                    currentUser={currentUser}
                    targetChatUser={targetChatUser}
                    onClearTargetChatUser={() => setTargetChatUser(null)}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 flex-1 overflow-y-auto" id="profile-tab-pane">
                  <ProfileSection
                    userProfile={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                    posts={posts}
                    onLike={handleLikePost}
                    onSignOut={handleSignOut}
                  />
                </div>
              )}

              {activeTab === 'hub' && (
                <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-5 flex-1 overflow-y-auto" id="hub-tab-pane">
                  <ExperienceHub currentUser={currentUser} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Universal Bottom Navigation Footer */}
      <footer
        className="sticky bottom-0 z-40 bg-[#06060a]/95 backdrop-blur-xl border-t border-zinc-900/80 px-2 sm:px-4 py-2.5 sm:py-3 flex items-center justify-around w-full shadow-[0_-5px_25px_rgba(0,0,0,0.5)]"
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

        <button
          id="nav-hub-btn"
          onClick={() => setActiveTab('hub')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'hub'
              ? 'text-purple-300 bg-purple-950/40 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="Lifetime Experience Hub"
        >
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Hub</span>
        </button>

        {/* Floating gradient '+' creator button */}
        <button
          id="nav-create-btn"
          onClick={() => setShowCreateModal(true)}
          className="p-3.5 rounded-full bg-gradient-to-tr from-cyan-400 via-cyan-500 to-purple-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.45)] active:scale-95 transition cursor-pointer -mt-5 border-4 border-[#030305] hover:scale-105"
          title="Illuminate Post"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          id="nav-messages-btn"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
          }`}
          title="Nightgram Chats"
        >
          <MessageSquare className="w-5 h-5" />
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
          <img
            src={currentUser.avatar}
            alt={currentUser.displayName}
            className="w-5 h-5 rounded-full object-cover border border-cyan-400/60"
            referrerPolicy="no-referrer"
          />
          <span className="hidden sm:inline text-xs font-bold tracking-wide font-sans">Profile</span>
        </button>
      </footer>

      {/* Create post & story modal dialogs */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            currentUser={currentUser}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePostSubmit}
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
    </div>
  );
}
