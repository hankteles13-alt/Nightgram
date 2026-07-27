import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatRoom, ChatMessage, UserProfile, Message } from '../types';
import {
  Send,
  Moon,
  Circle,
  Compass,
  Sparkles,
  Volume2,
  Plus,
  Search,
  MessageSquare,
  X,
  UserPlus,
  Bot,
  Users,
  CheckCheck,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Image as ImageIcon,
  Pencil,
  Eye,
  CheckCircle2,
  Heart,
  ChevronRight,
  Bell,
  Star,
  Palette,
  Download,
  Clock,
  DollarSign,
  Ban,
  Flag,
  Edit2,
  Folder,
  Check,
  Trash2,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { db } from '../lib/firebase';
import {
  encryptMessageText,
  decryptMessageText,
  isEncryptedMessage
} from '../lib/e2ee';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';

interface MessagesSectionProps {
  currentUser?: UserProfile | null;
  targetChatUser?: { uid?: string; username: string; displayName?: string; avatar?: string } | null;
  onClearTargetChatUser?: () => void;
  // Fallbacks for simulated messages if logged out or testing
  messages?: Message[];
  onSendMessage?: (sender: 'me' | 'luna' | 'neon_wanderer' | 'night_owl', text: string) => void;
}

const AI_COMPANIONS = [
  {
    id: 'luna',
    name: 'Luna AI',
    username: 'luna_ai',
    tagline: 'AI Midnight Guide',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Always awake. Here to accompany your late-night thoughts, code loops, and quiet coffee breaks.',
    online: true,
    icon: Sparkles,
    color: 'text-cyan-400 border-cyan-400',
    isAI: true,
  },
  {
    id: 'neon_wanderer',
    name: 'neon_wanderer',
    username: 'neon_wanderer',
    tagline: 'Street Photographer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Chasing neon glows, reflections on wet concrete, and high-contrast night frames.',
    online: true,
    icon: Compass,
    color: 'text-purple-400 border-purple-400',
    isAI: true,
  },
  {
    id: 'night_owl',
    name: 'night_owl',
    username: 'night_owl',
    tagline: 'Soundscape Curator',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Spinning ambient jazz, lo-fi beats, and dark-ambient pads for late productivity.',
    online: false,
    icon: Volume2,
    color: 'text-zinc-500 border-zinc-700',
    isAI: true,
  },
];

export interface StatusItem {
  id: string;
  name: string;
  avatar: string;
  time: string;
  caption: string;
  gradient: string;
  isViewed?: boolean;
}

const INITIAL_STATUSES: StatusItem[] = [
  {
    id: 's1',
    name: '- S A N U 💖',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    time: 'Today at 09:00 AM',
    caption: 'Haa ❤️✨ Enjoying the stellar vibe on Nightgram!',
    gradient: 'from-pink-950 via-purple-900 to-indigo-950',
    isViewed: false,
  },
  {
    id: 's2',
    name: '- J E S S O 🍧💖',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    time: 'Today at 08:30 AM',
    caption: 'Good night everyone! Designing new cyber sounds 🌟',
    gradient: 'from-cyan-950 via-blue-900 to-zinc-950',
    isViewed: false,
  },
  {
    id: 's3',
    name: 'Nadiya ❤️',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    time: 'Today at 08:19 AM',
    caption: 'Everything happening at the right time ✨🌸',
    gradient: 'from-purple-950 via-pink-900 to-slate-950',
    isViewed: false,
  },
  {
    id: 's4',
    name: '4 idiots 😆',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    time: 'Today at 03:10 AM',
    caption: 'Late night coding with lo-fi beats ☕👻',
    gradient: 'from-emerald-950 via-teal-900 to-zinc-950',
    isViewed: false,
  },
  {
    id: 's5',
    name: '- S A B A 🍧🖤',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    time: 'Today at 01:00 AM',
    caption: 'What an incredible night with my friends! 🥰',
    gradient: 'from-purple-950 via-indigo-900 to-zinc-950',
    isViewed: true,
  },
  {
    id: 's6',
    name: '- N A I N A 🖤🐼',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    time: 'Yesterday at 11:40 PM',
    caption: 'New stellar design published! 🚀💫',
    gradient: 'from-blue-950 via-cyan-900 to-zinc-950',
    isViewed: true,
  },
];

const NIGHTGRAM_STORIES_GALLERY = [
  {
    id: 'st-1',
    title: 'Galactic Vibes in Shibuya',
    author: 'Luna AI',
    username: 'luna_ai',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    caption: 'Tokyo lights in the late night 🌃✨',
    time: '2h ago',
    category: "Luna's Story",
  },
  {
    id: 'st-2',
    title: 'Neon Shadow & Rain',
    author: 'neon_wanderer',
    username: 'neon_wanderer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80',
    caption: 'Reflections on wet asphalt 📸💧',
    time: '4h ago',
    category: "neon_wanderer's Story",
  },
  {
    id: 'st-3',
    title: 'Aurora Sky & Galaxies',
    author: 'night_owl',
    username: 'night_owl',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    caption: 'Northern lights under the quiet night 🌌',
    time: '5h ago',
    category: "night_owl's Story",
  },
  {
    id: 'st-4',
    title: 'Arcade Cyberpunk 1988',
    author: '- S A N U 💖',
    username: 'sanu_star',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    caption: 'Retro nostalgia in stellar games 🕹️💜',
    time: '6h ago',
    category: "SANU's Story",
  },
  {
    id: 'st-5',
    title: 'Stellar Mountains',
    author: '- J E S S O 🍧💖',
    username: 'jesso_night',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80',
    caption: 'Peaks lit by billions of stars 🏔️✨',
    time: '8h ago',
    category: "JESSO's Story",
  },
  {
    id: 'st-6',
    title: 'Violet Synth Night',
    author: 'Nadiya ❤️',
    username: 'nadiya_space',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=600&auto=format&fit=crop&q=80',
    caption: 'Purple glow and beats in headphones 🎵💜',
    time: '12h ago',
    category: "Nadiya's Story",
  },
];

const NIGHTGRAM_POSTS_GALLERY = [
  {
    id: 'p-1',
    title: 'Cyberspace Concert',
    author: 'Nightgram Official',
    username: 'nightgram',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    caption: 'Late night special on the main stage 🎸💥',
    likes: 1420,
  },
  {
    id: 'p-2',
    title: 'Midnight Coffee',
    author: 'Luna AI',
    username: 'luna_ai',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    caption: 'Espresso and lines of code under neon glow ☕💻',
    likes: 890,
  },
  {
    id: 'p-3',
    title: 'Sunset Neon Skyline',
    author: 'neon_wanderer',
    username: 'neon_wanderer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
    caption: 'Golden transition to the cyber night 🌅🌆',
    likes: 2150,
  },
  {
    id: 'p-4',
    title: 'City Lights',
    author: '4 idiots 😆',
    username: 'idiots_quad',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    caption: 'Festive lights and endless laughter 🎆✨',
    likes: 1040,
  },
];

function VoiceNotePlayer({
  audioUrl,
  duration = '0:07',
  isMe = false,
}: {
  audioUrl?: string;
  duration?: string;
  isMe?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
            setIsPlaying(false);
            setProgress(0);
          };
          audioRef.current.ontimeupdate = () => {
            if (audioRef.current) {
              const p = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
              setProgress(p);
            }
          };
        }
        audioRef.current.play().catch(() => {
          playSynthVoiceTone();
        });
      } else {
        playSynthVoiceTone();
      }
    }
  };

  const playSynthVoiceTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);

      let count = 0;
      const interval = setInterval(() => {
        count += 10;
        setProgress(count);
        if (count >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          setProgress(0);
        }
      }, 80);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  const barHeights = [14, 28, 18, 36, 22, 12, 32, 24, 16, 38, 20, 26, 14, 30, 18, 22];

  return (
    <div className="py-1 px-1 min-w-[200px] sm:min-w-[230px] space-y-1.5">
      <div className="flex items-center space-x-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-black font-bold transition shadow-md cursor-pointer flex-shrink-0 ${
            isMe
              ? 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              : 'bg-purple-500 hover:bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black translate-x-0.5" />}
        </button>

        <div className="flex-1 flex items-center space-x-1 h-8">
          {barHeights.map((h, idx) => {
            const barProgress = (idx / barHeights.length) * 100;
            const isPlayed = progress >= barProgress;
            return (
              <div
                key={idx}
                style={{ height: `${h}px` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isMe ? 'bg-cyan-300' : 'bg-purple-300'
                    : 'bg-zinc-700/80'
                }`}
              />
            );
          })}
        </div>

        <span className="text-[10px] font-mono text-zinc-300 flex-shrink-0">{duration}</span>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-0.5 border-t border-white/10">
        <span className="flex items-center space-x-1 text-cyan-300">
          <Mic className="w-2.5 h-2.5" />
          <span>Voice Note</span>
        </span>
        <span className="text-zinc-500">Audio Recorded</span>
      </div>
    </div>
  );
}

export default function MessagesSection({
  currentUser,
  targetChatUser,
  onClearTargetChatUser,
  messages = [],
  onSendMessage,
}: MessagesSectionProps) {
  // Direct Chats from Firestore
  const [directChats, setDirectChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('luna');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Responsive navigation state for mobile ('list' shows all chats page, 'chat' shows active conversation)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  // Category filter for chat list
  const [chatCategoryFilter, setChatCategoryFilter] = useState<'all' | 'direct' | 'ai'>('all');
  // Active WhatsApp top tab ('chats' | 'status' | 'calls')
  const [activeListTab, setActiveListTab] = useState<'chats' | 'status' | 'calls'>('chats');

  // Registered Users for New Chat modal
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Local Chat state
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const startVoiceRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0);
    audioChunksRef.current = [];

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
          finishAndSendVoiceNote(url, recordingTime);
        };

        recorder.start();
      }
    } catch (err) {
      console.warn('Microphone stream error, fallback mode active:', err);
    }
  };

  const stopAndSendVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      finishAndSendVoiceNote('', recordingTime || 3);
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const finishAndSendVoiceNote = async (audioUrl: string, durationSecs: number) => {
    const durationFormatted = formatTime(durationSecs > 0 ? durationSecs : 3);
    const voiceNoteLabel = `🎤 Voice Note (${durationFormatted})`;

    if (currentDirectChat && currentUser?.uid) {
      try {
        const messagesRef = collection(db, 'chats', currentDirectChat.id, 'messages');
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const encryptedText = await encryptMessageText(voiceNoteLabel, currentDirectChat.id);

        const msgPayload: any = {
          chatId: currentDirectChat.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.username,
          senderAvatar: currentUser.avatar,
          text: encryptedText,
          createdAt: new Date().toISOString(),
          audioUrl: audioUrl || '',
          audioDuration: durationFormatted,
        };

        await addDoc(messagesRef, msgPayload);
        await updateDoc(doc(db, 'chats', currentDirectChat.id), {
          lastMessage: `🎤 Voice Note (${durationFormatted})`,
          lastMessageTime: nowFormatted,
          updatedAt: new Date().toISOString(),
        });

        if (activePartner) {
          setTimeout(() => {
            setIsPartnerTyping(true);
            setTimeout(async () => {
              setIsPartnerTyping(false);
              const partnerVoiceReplies = [
                'Listened to your voice note! Clear and awesome vibe! 🎧✨',
                'Loved your voice note! Thanks for sharing. 💖',
                'Got your voice message! Speaks louder than words! 🔥',
              ];
              const replyText = partnerVoiceReplies[Math.floor(Math.random() * partnerVoiceReplies.length)];
              const partnerEncrypted = await encryptMessageText(replyText, currentDirectChat.id);
              await addDoc(messagesRef, {
                chatId: currentDirectChat.id,
                senderId: activePartner.uid,
                senderName: activePartner.displayName || activePartner.username,
                senderAvatar: activePartner.avatar,
                text: partnerEncrypted,
                createdAt: new Date().toISOString(),
              });
            }, 2200);
          }, 600);
        }
      } catch (err) {
        console.error('Error sending voice note in direct chat:', err);
      }
      return;
    }

    if (currentAiCompanion) {
      if (onSendMessage) {
        onSendMessage('me', voiceNoteLabel);
      }
      setIsAiTyping(true);
      setTimeout(() => {
        setIsAiTyping(false);
        const aiVoiceResponses = [
          `I listened to your voice note (${durationFormatted})! Your voice sounds calm and inspiring. How are you feeling tonight? 🌌`,
          `Got your voice message! Your tone is so warm. Thanks for sharing this moment with Nightgram AI! ✨🎧`,
        ];
        const reply = aiVoiceResponses[Math.floor(Math.random() * aiVoiceResponses.length)];
        if (onSendMessage) {
          onSendMessage(currentAiCompanion.id as any, reply);
        }
      }, 1800);
    }
  };

  // Media Attachment & Library Modal state
  const [selectedImageToAttach, setSelectedImageToAttach] = useState<string | null>(null);
  const [showMediaLibraryModal, setShowMediaLibraryModal] = useState(false);
  const [mediaLibraryTab, setMediaLibraryTab] = useState<'stories' | 'posts' | 'upload'>('stories');
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');

  // Contact Info & Chat Settings Modal State
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [contactNotificationsMuted, setContactNotificationsMuted] = useState(false);
  const [chatLockEnabled, setChatLockEnabled] = useState(false);
  const [disappearingMessagesSetting, setDisappearingMessagesSetting] = useState<'Off' | '24 hours' | '7 days' | '90 days'>('Off');
  const [chatWallpaper, setChatWallpaper] = useState<'Default' | 'Cyber Glow' | 'Midnight Neon' | 'Dark Minimal'>('Default');
  const [saveToPhotos, setSaveToPhotos] = useState<'Default' | 'Always' | 'Never'>('Default');
  const [customQuoteNote, setCustomQuoteNote] = useState<string>('');
  const [isEditingQuoteNote, setIsEditingQuoteNote] = useState(false);
  const [showMediaDocsModal, setShowMediaDocsModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showSaveToPhotosModal, setShowSaveToPhotosModal] = useState(false);

  // Status tab state
  const [allStatuses, setAllStatuses] = useState<StatusItem[]>(INITIAL_STATUSES);
  const [userStatuses, setUserStatuses] = useState<StatusItem[]>([]);
  const [viewingStatus, setViewingStatus] = useState<StatusItem | null>(null);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusBg, setNewStatusBg] = useState('from-cyan-950 via-purple-950 to-zinc-950');
  const [statusReplyText, setStatusReplyText] = useState('');

  const handleViewStatus = (status: StatusItem) => {
    setViewingStatus(status);
    setAllStatuses((prev) =>
      prev.map((s) => (s.id === status.id ? { ...s, isViewed: true } : s))
    );
  };

  // Helper to compute Last Seen status
  const getLastSeenText = () => {
    if (currentAiCompanion) {
      return currentAiCompanion.online ? 'Online now' : 'Last seen 12m ago';
    }
    if (currentDirectChat) {
      if (!currentDirectChat.updatedAt) return 'Active recently';
      const lastTime = new Date(currentDirectChat.updatedAt).getTime();
      const now = Date.now();
      const diffMins = Math.floor((now - lastTime) / (1000 * 60));
      if (diffMins < 2) return 'Online now';
      if (diffMins < 60) return `Last seen ${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Last seen ${diffHours}h ago`;
      return `Last seen ${Math.floor(diffHours / 24)}d ago`;
    }
    return 'Offline';
  };

  // 1. Listen to Real-Time Direct Chats for current user (with E2EE preview decryption)
  useEffect(() => {
    if (!currentUser?.uid) return;

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push({ id: docSnap.id, ...docSnap.data() } as ChatRoom);
        });

        // Decrypt lastMessage for room preview
        const decryptedRooms = await Promise.all(
          rooms.map(async (room) => {
            if (room.lastMessage && isEncryptedMessage(room.lastMessage)) {
              const plainPreview = await decryptMessageText(room.lastMessage, room.id);
              return { ...room, lastMessage: plainPreview };
            }
            return room;
          })
        );

        // Sort by updatedAt descending
        decryptedRooms.sort((a, b) => {
          const tA = new Date(a.updatedAt || 0).getTime();
          const tB = new Date(b.updatedAt || 0).getTime();
          return tB - tA;
        });

        setDirectChats(decryptedRooms);
      }, (err) => {
        console.error('Error fetching direct chats:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Chats snapshot error:', err);
    }
  }, [currentUser?.uid]);

  // 2. Listen to Messages for the Active Chat Room with E2EE AES-GCM Decryption
  useEffect(() => {
    // If activeChatId is an AI companion ID, do not query Firestore chat room
    const isAiCompanion = AI_COMPANIONS.some((c) => c.id === activeChatId);
    if (isAiCompanion || !activeChatId) {
      return;
    }

    try {
      const messagesRef = collection(db, 'chats', activeChatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const rawMsgs: {
          id: string;
          chatId: string;
          senderId: string;
          senderName: string;
          senderAvatar: string;
          rawText: string;
          imageUrl?: string;
          createdAt: any;
          formattedTime: string;
        }[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedTime = 'Just now';
          if (data.createdAt) {
            const d = new Date(data.createdAt);
            if (!isNaN(d.getTime())) {
              formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          }
          rawMsgs.push({
            id: docSnap.id,
            chatId: activeChatId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            rawText: data.text || '',
            imageUrl: data.imageUrl || undefined,
            createdAt: data.createdAt,
            formattedTime,
          });
        });

        const decryptedMsgs: ChatMessage[] = await Promise.all(
          rawMsgs.map(async (m) => {
            const decryptedText = await decryptMessageText(m.rawText, activeChatId);
            return {
              id: m.id,
              chatId: m.chatId,
              senderId: m.senderId,
              senderName: m.senderName,
              senderAvatar: m.senderAvatar,
              text: decryptedText,
              imageUrl: m.imageUrl,
              createdAt: m.createdAt,
              timestampFormatted: m.formattedTime,
            };
          })
        );

        setChatMessages(decryptedMsgs);
      }, (err) => {
        console.error('Error fetching chat messages:', err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Chat messages snapshot error:', err);
    }
  }, [activeChatId]);

  // 3. Handle Auto-Opening Chat from targetChatUser prop
  useEffect(() => {
    if (!targetChatUser?.username || !currentUser?.uid) return;

    const initiateTargetChat = async () => {
      let targetUid = targetChatUser.uid;

      // If uid not directly passed, query user by username
      if (!targetUid) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', targetChatUser.username));
          const snap = await getDocs(q);
          if (!snap.empty) {
            targetUid = snap.docs[0].id;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (targetUid && targetUid !== currentUser.uid) {
        const chatId = [currentUser.uid, targetUid].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            id: chatId,
            participants: [currentUser.uid, targetUid],
            participantProfiles: {
              [currentUser.uid]: {
                uid: currentUser.uid,
                username: currentUser.username,
                displayName: currentUser.displayName,
                avatar: currentUser.avatar,
              },
              [targetUid]: {
                uid: targetUid,
                username: targetChatUser.username,
                displayName: targetChatUser.displayName || targetChatUser.username,
                avatar: targetChatUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              },
            },
            lastMessage: 'Chat started',
            lastMessageTime: 'Just now',
            updatedAt: new Date().toISOString(),
          });
        }
        setActiveChatId(chatId);
        setMobileView('chat');
      }

      if (onClearTargetChatUser) {
        onClearTargetChatUser();
      }
    };

    initiateTargetChat();
  }, [targetChatUser, currentUser, onClearTargetChatUser]);

  // Auto Scroll down when message stream changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, messages, isAiTyping]);

  // Fetch all registered users for New Chat Modal
  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingUsers(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid !== currentUser?.uid) {
          list.push({
            uid: docSnap.id,
            username: data.username || 'dreamer',
            displayName: data.displayName || 'A Midnight Dreamer',
            avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: data.bio || '',
            followers: data.followers || 0,
            following: data.following || 0,
            stars: data.stars || 0,
          });
        }
      });
      setAllUsers(list);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Start chat with a selected user
  const handleStartChatWithUser = async (user: UserProfile) => {
    if (!currentUser?.uid || !user.uid) return;

    const chatId = [currentUser.uid, user.uid].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        id: chatId,
        participants: [currentUser.uid, user.uid],
        participantProfiles: {
          [currentUser.uid]: {
            uid: currentUser.uid,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
          },
          [user.uid]: {
            uid: user.uid,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          },
        },
        lastMessage: 'Chat started',
        lastMessageTime: 'Just now',
        updatedAt: new Date().toISOString(),
      });
    }

    setActiveChatId(chatId);
    setMobileView('chat');
    setShowNewChatModal(false);
  };

  // Select a chat room and switch view
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setMobileView('chat');
  };

  // Identify active chat details
  const currentAiCompanion = AI_COMPANIONS.find((c) => c.id === activeChatId);
  const currentDirectChat = directChats.find((c) => c.id === activeChatId);

  // Helper to get partner profile in direct chat
  const getPartnerProfile = (chat: ChatRoom) => {
    if (!currentUser?.uid) return null;
    const partnerUid = chat.participants.find((id) => id !== currentUser.uid);
    if (!partnerUid || !chat.participantProfiles) return null;
    return chat.participantProfiles[partnerUid];
  };

  const activePartner = currentDirectChat ? getPartnerProfile(currentDirectChat) : null;

  const activeContactInfo = activePartner
    ? {
        name: activePartner.displayName || activePartner.username || 'Nightgram Contact',
        handle: `@${activePartner.username || 'user'}`,
        avatar: activePartner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: (activePartner as any).bio || '"A positive mindset brings positive things!" 💐💐',
        date: 'Nov 13, 2023',
        phone: '+1 (555) 019-2834',
        isAI: false,
      }
    : currentAiCompanion
    ? {
        name: currentAiCompanion.name,
        handle: `@${currentAiCompanion.username}`,
        avatar: currentAiCompanion.avatar,
        bio: currentAiCompanion.bio || '"Always awake. Here to accompany your late-night thoughts and quiet coffee breaks."',
        date: 'Active AI Companion',
        phone: 'Nightgram AI Bot',
        isAI: true,
      }
    : null;

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImageToAttach) return;

    const textToSend = inputText.trim();
    const imageToSend = selectedImageToAttach;

    setInputText('');
    setSelectedImageToAttach(null);

    // If active chat is Direct Chat with a real user
    if (currentDirectChat && currentUser?.uid) {
      try {
        const messagesRef = collection(db, 'chats', currentDirectChat.id, 'messages');
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Encrypt message text using Web Crypto AES-256-GCM before database write
        const encryptedText = await encryptMessageText(textToSend, currentDirectChat.id);

        const msgPayload: any = {
          chatId: currentDirectChat.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.username,
          senderAvatar: currentUser.avatar,
          text: encryptedText,
          createdAt: new Date().toISOString(),
        };

        if (imageToSend) {
          msgPayload.imageUrl = imageToSend;
        }

        await addDoc(messagesRef, msgPayload);

        const lastMsgPreview = imageToSend
          ? `🖼️ [Image] ${textToSend || 'Nightgram Photo'}`
          : encryptedText;

        // Update room metadata with encrypted text for database storage
        await updateDoc(doc(db, 'chats', currentDirectChat.id), {
          lastMessage: lastMsgPreview,
          lastMessageTime: nowFormatted,
          updatedAt: new Date().toISOString(),
        });

        // Trigger real-time partner "is typing..." feedback
        if (activePartner) {
          setTimeout(() => {
            setIsPartnerTyping(true);
            setTimeout(async () => {
              setIsPartnerTyping(false);
              const partnerReplies = imageToSend ? [
                'Wow, what an awesome Nightgram photo! Loved the neon tones. ✨📸',
                'Incredible image! Saved it to my favorites. 💖',
                'Awesome vibe in this Nightgram photo! Fits our conversation perfectly.',
              ] : [
                'Definitely! Great idea. 👍✨',
                'So cool! Let\'s keep chatting here.',
                'Awesome! I\'ll check it out soon. 🌟',
                'Perfect! Loved your message.',
              ];
              const reply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];
              try {
                const partnerEncrypted = await encryptMessageText(reply, currentDirectChat.id);
                await addDoc(messagesRef, {
                  chatId: currentDirectChat.id,
                  senderId: activePartner.uid,
                  senderName: activePartner.displayName || activePartner.username,
                  senderAvatar: activePartner.avatar,
                  text: partnerEncrypted,
                  createdAt: new Date().toISOString(),
                });
                await updateDoc(doc(db, 'chats', currentDirectChat.id), {
                  lastMessage: partnerEncrypted,
                  lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  updatedAt: new Date().toISOString(),
                });
              } catch (err) {
                console.error('Error generating partner reply:', err);
              }
            }, 2000);
          }, 600);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
      return;
    }

    // If active chat is AI Companion
    if (currentAiCompanion) {
      const fullAiMessageText = imageToSend
        ? (textToSend ? textToSend + ' ' : '') + `[IMAGE: ${imageToSend}]`
        : textToSend;

      if (onSendMessage) {
        onSendMessage('me', fullAiMessageText);
      }
      setIsAiTyping(true);

      setTimeout(() => {
        setIsAiTyping(false);
        let reply = '';
        if (imageToSend) {
          reply = `Wow! That Nightgram photo you sent has a stellar aesthetic! The neon colors and nocturnal vibe fit our conversation perfectly. 🌌✨`;
        } else if (currentAiCompanion.id === 'luna') {
          const responses = [
            'That is a fascinating perspective. The quiet hours of the night have a way of opening up our thoughts, free from the chatter of the daytime. 🌌',
            'I completely agree! When the rest of the world falls asleep, there is a special focus created just for us.',
            'Your energy feels wonderfully reflective tonight. Remember to rest your eyes occasionally. A hot cup of chamomile tea works wonders. ☕',
            'Night is a world lit by itself. What music or lo-fi beat is keeping you company right now?',
          ];
          reply = responses[Math.floor(Math.random() * responses.length)];
        } else if (currentAiCompanion.id === 'neon_wanderer') {
          const responses = [
            'Just got back from shooting near Shibuya Crossing! The rain was light, so the puddles were creating a perfect mirror. Let me edit a few frames and post them. 📸⚡',
            'High contrast shadows and rich cyan highlights are my absolute sweet spot. What camera settings do you run at night?',
          ];
          reply = responses[Math.floor(Math.random() * responses.length)];
        } else {
          const responses = [
            'Just uploaded a new 1-hour lofi mix called "Wet Pavement & Warm Lamps". Perfect for late-night coding. 🎧',
            'Sleep patterns have been completely nocturnal lately, but the music coming out of it is some of my favorite!',
          ];
          reply = responses[Math.floor(Math.random() * responses.length)];
        }

        if (onSendMessage) {
          onSendMessage(currentAiCompanion.id as any, reply);
        }
      }, 1200);
    }
  };

  // Filtered direct chats by search
  const filteredDirectChats = directChats.filter((chat) => {
    const partner = getPartnerProfile(chat);
    if (!partner) return true;
    const queryStr = sidebarSearch.toLowerCase();
    return (
      partner.displayName.toLowerCase().includes(queryStr) ||
      partner.username.toLowerCase().includes(queryStr) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(queryStr))
    );
  });

  // Filtered AI companions by search
  const filteredAiCompanions = AI_COMPANIONS.filter((ai) => {
    const queryStr = sidebarSearch.toLowerCase();
    return (
      ai.name.toLowerCase().includes(queryStr) ||
      ai.username.toLowerCase().includes(queryStr) ||
      ai.tagline.toLowerCase().includes(queryStr)
    );
  });

  // Filtered user list for modal search
  const filteredModalUsers = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div
      className="bg-[#0a0a0f] border-t border-b border-zinc-800/80 w-full h-[calc(100vh-115px)] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 relative"
      id="messages-section-root"
    >
      {/* SIDEBAR / CHATS PAGE OVERVIEW PANE */}
      <div
        className={`md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-900/80 flex flex-col h-full bg-[#0b0b12] transition-all relative overflow-hidden ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
        id="messages-sidebar"
      >
        {/* Nightgram Top Header Bar */}
        <div className="bg-[#0e0e16]/95 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100 flex flex-col z-10 shadow-lg" id="whatsapp-sidebar-header">
          {/* Main Title Row */}
          <div className="p-3 px-3.5 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 tracking-wide flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span>Nightgram Chats</span>
            </h3>
            <div className="flex items-center space-x-2 text-zinc-400">
              <button
                type="button"
                onClick={() => alert('Câmera ativada')}
                className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                title="Camera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sidebarSearch) setSidebarSearch('');
                }}
                className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleOpenNewChatModal}
                className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                title="More Options / New Chat"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-zinc-800/80 text-xs font-medium text-zinc-400">
            {/* Community Icon Tab */}
            <button
              type="button"
              onClick={() => setActiveListTab('chats')}
              className="p-2.5 hover:text-cyan-300 transition cursor-pointer"
              title="Communities"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Chats Tab */}
            <button
              type="button"
              onClick={() => setActiveListTab('chats')}
              className={`flex-1 py-2 text-center flex items-center justify-center space-x-1.5 cursor-pointer transition border-b-2 ${
                activeListTab === 'chats'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Chats</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold font-mono px-1.5 py-0.2 rounded-full shadow-sm">
                {filteredDirectChats.length + filteredAiCompanions.length}
              </span>
            </button>

            {/* Status Tab */}
            <button
              type="button"
              onClick={() => setActiveListTab('status')}
              className={`flex-1 py-2 text-center flex items-center justify-center space-x-1 cursor-pointer transition border-b-2 ${
                activeListTab === 'status'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Status</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] inline-block ml-0.5"></span>
            </button>

            {/* Calls Tab */}
            <button
              type="button"
              onClick={() => setActiveListTab('calls')}
              className={`flex-1 py-2 text-center flex items-center justify-center space-x-1 cursor-pointer transition border-b-2 ${
                activeListTab === 'calls'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Calls</span>
            </button>
          </div>
        </div>

        {/* CHATS TAB CONTENT */}
        {activeListTab === 'chats' && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Search Input & Category Filters */}
            <div className="p-2.5 bg-[#0b0b14] border-b border-zinc-800/80 space-y-2" id="sidebar-search-container">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="sidebar-chat-search-input"
                  type="text"
                  placeholder="Search conversations..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-[#12121c] border border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center space-x-1.5" id="chat-category-filter-pills">
                <button
                  type="button"
                  onClick={() => setChatCategoryFilter('all')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    chatCategoryFilter === 'all'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setChatCategoryFilter('direct')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    chatCategoryFilter === 'direct'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={() => setChatCategoryFilter('ai')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    chatCategoryFilter === 'ai'
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  AI Companions
                </button>
              </div>
            </div>

            {/* Chats & Companions List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80 scrollbar-thin" id="chats-sidebar-list">
              {/* Direct User Chats */}
              {(chatCategoryFilter === 'all' || chatCategoryFilter === 'direct') &&
                filteredDirectChats.map((chat, idx) => {
                  const partner = getPartnerProfile(chat);
                  if (!partner) return null;
                  const isSelected = activeChatId === chat.id;

                  return (
                    <button
                      key={chat.id}
                      id={`chat-row-${chat.id}`}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`w-full flex items-center space-x-3 p-3 transition cursor-pointer text-left hover:bg-zinc-900/60 ${
                        isSelected ? 'bg-[#12121f] border-l-4 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.08)]' : 'bg-transparent'
                      }`}
                    >
                      {/* Avatar with Status Story Ring */}
                      <div className="relative flex-shrink-0">
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500">
                          <img
                            src={partner.avatar}
                            alt={partner.displayName}
                            className="w-11 h-11 object-cover rounded-full border border-black"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-100 truncate">
                            {partner.displayName}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono flex-shrink-0">
                            {chat.lastMessageTime || '9:00 am'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs truncate font-sans pr-2">
                            {isPartnerTyping && activeChatId === chat.id ? (
                              <span className="text-cyan-400 font-medium animate-pulse">typing...</span>
                            ) : (
                              <span className="text-zinc-400">{chat.lastMessage || 'Chat started'}</span>
                            )}
                          </p>
                          {/* Cyan Unread Badge */}
                          <span className="w-4 h-4 rounded-full bg-cyan-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                            {(idx % 3) + 1}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

              {/* AI Companions */}
              {(chatCategoryFilter === 'all' || chatCategoryFilter === 'ai') &&
                filteredAiCompanions.map((ai, idx) => {
                  const isSelected = activeChatId === ai.id;

                  return (
                    <button
                      key={ai.id}
                      id={`ai-row-${ai.id}`}
                      onClick={() => handleSelectChat(ai.id)}
                      className={`w-full flex items-center space-x-3 p-3 transition cursor-pointer text-left hover:bg-zinc-900/60 ${
                        isSelected ? 'bg-[#151224] border-l-4 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.08)]' : 'bg-transparent'
                      }`}
                    >
                      {/* Avatar with Status Story Ring */}
                      <div className="relative flex-shrink-0">
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400">
                          <img
                            src={ai.avatar}
                            alt={ai.name}
                            className="w-11 h-11 object-cover rounded-full border border-black"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-100 truncate flex items-center space-x-1">
                            <span>{ai.name}</span>
                            <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800/60 px-1 rounded font-mono">
                              AI
                            </span>
                          </span>
                          <span className="text-[10px] text-purple-400 font-mono flex-shrink-0">
                            {idx === 0 ? '8:30 am' : idx === 1 ? '1:00 am' : 'Yesterday'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs truncate font-sans pr-2">
                            {isAiTyping && activeChatId === ai.id ? (
                              <span className="text-purple-400 font-medium animate-pulse">typing...</span>
                            ) : (
                              <span className="text-zinc-400">{ai.tagline}</span>
                            )}
                          </p>
                          <span className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                            {idx + 1}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Nightgram Floating Action Button (FAB) */}
            <button
              type="button"
              onClick={handleOpenNewChatModal}
              className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all transform hover:scale-105 cursor-pointer z-20"
              title="New conversation"
            >
              <MessageSquare className="w-5 h-5 text-white fill-white" />
            </button>
          </div>
        )}

        {/* STATUS TAB CONTENT (WhatsApp Format in Nightgram Palette) */}
        {activeListTab === 'status' && (
          <div className="flex-1 flex flex-col min-h-0 relative bg-[#090910]">
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80 scrollbar-thin">
              
              {/* My Status Row */}
              <div
                onClick={() => setShowStatusCreator(true)}
                className="p-3.5 flex items-center space-x-3.5 hover:bg-zinc-900/60 transition cursor-pointer"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="My status"
                    className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                  />
                  <div className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs border-2 border-[#090910] shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-100">My status</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {userStatuses.length > 0
                      ? `${userStatuses.length} recent update(s)`
                      : 'Tap to add status update'}
                  </p>
                </div>
              </div>

              {/* Recent Updates Section Banner */}
              <div className="bg-[#0e0e18] px-4 py-2 border-y border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Recent updates
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {allStatuses.filter((s) => !s.isViewed).length} new
                </span>
              </div>

              {/* Recent Updates List */}
              <div className="divide-y divide-zinc-900/50">
                {allStatuses
                  .filter((s) => !s.isViewed)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleViewStatus(item)}
                      className="p-3 px-3.5 flex items-center justify-between hover:bg-zinc-900/60 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          {/* Vibrant Status Story Ring */}
                          <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-11 h-11 rounded-full object-cover border border-black"
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-zinc-100 truncate flex items-center space-x-1">
                            <span>{item.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 inline ml-1" />
                          </h4>
                          <p className="text-xs text-zinc-400 truncate mt-0.5 font-sans">{item.time}</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-zinc-600 hover:text-cyan-400 transition" />
                    </div>
                  ))}
              </div>

              {/* Viewed Updates Section Banner */}
              <div className="bg-[#0e0e18] px-4 py-2 border-y border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Viewed updates
                </span>
              </div>

              {/* Viewed Updates List */}
              <div className="divide-y divide-zinc-900/50">
                {allStatuses
                  .filter((s) => s.isViewed)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleViewStatus(item)}
                      className="p-3 px-3.5 flex items-center justify-between hover:bg-zinc-900/60 transition cursor-pointer opacity-75 hover:opacity-100"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="p-[2.5px] rounded-full bg-zinc-700">
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-11 h-11 rounded-full object-cover border border-black"
                            />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-zinc-300 truncate">{item.name}</h4>
                          <p className="text-xs text-zinc-500 truncate mt-0.5 font-sans">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Dual Floating Action Buttons (FABs) in WhatsApp Format */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-3 items-center z-20">
              {/* Upper Small FAB: Pencil for text status */}
              <button
                type="button"
                onClick={() => setShowStatusCreator(true)}
                className="w-10 h-10 rounded-full bg-[#161622] border border-zinc-700/80 text-zinc-300 hover:text-cyan-400 hover:border-cyan-500/60 flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                title="Text Status"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Lower Main FAB: Camera for media status */}
              <button
                type="button"
                onClick={() => setShowStatusCreator(true)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 cursor-pointer"
                title="Camera Status"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* CALLS TAB CONTENT */}
        {activeListTab === 'calls' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-zinc-200">
            <h5 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Recent Calls</h5>
            <div className="space-y-1 divide-y divide-zinc-900">
              {AI_COMPANIONS.map((ai, index) => (
                <div key={ai.id} className="pt-2 flex items-center justify-between p-2 hover:bg-zinc-900/40 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <img src={ai.avatar} alt={ai.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100">{ai.name}</h4>
                      <div className="flex items-center space-x-1 text-[10px] text-cyan-400">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>Today, 11:{20 - index * 5} (Incoming)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Calling ${ai.name}...`)}
                    className="p-2 text-cyan-400 hover:bg-cyan-950/40 rounded-full cursor-pointer"
                  >
                    {index % 2 === 0 ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CHAT CONVERSATION PANE */}
      <div
        className={`md:col-span-8 flex flex-col h-full bg-[#09090f] transition-all relative overflow-hidden ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
        id="messages-chat-pane"
      >
        {/* Nocturnal Doodle Pattern Overlay Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2338384a' stroke-width='1.2' opacity='0.8'%3E%3Cpath d='M20 20 h12 v12 h-12 z M60 30 l6 -10 l6 10 z M120 20 c6 0 12 6 12 12 c0 6 -6 12 -12 12 z M150 50 h10 v10 h-10 z M30 80 a8 8 0 1 0 0.1 0 M90 80 h14 v14 h-14 z M140 100 l10 -6 l3 12 z M20 140 c4 0 8 4 8 8 s-4 8 -8 8 z M70 140 h12 v12 h-12 z M120 150 a7 7 0 1 0 0.1 0'/%3E%3Cpath d='M45 110 c3 -8 12 -8 15 0 M100 120 h8 v-8 h-8 z M160 140 l-8 -8 l8 0 z M80 45 a5 5 0 1 1 -0.1 0 M10 65 h12 M160 15 a6 6 0 0 1 0 12'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '180px 180px',
          }}
        />

        {/* Top Header Bar */}
        <div className="p-2.5 px-3.5 bg-[#0e0e16]/95 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100 flex items-center justify-between shadow-lg z-10" id="chat-pane-header-bar">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {/* Back button to return to all chats view on mobile */}
            <button
              type="button"
              id="back-to-chats-list-btn"
              onClick={() => setMobileView('list')}
              className="md:hidden p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition flex-shrink-0"
              title="Back to All Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {activePartner ? (
              <div className="flex items-center justify-between w-full min-w-0 pr-1" id="active-partner-header">
                <div
                  className="flex items-center space-x-2.5 min-w-0 cursor-pointer hover:opacity-90 transition"
                  onClick={() => setShowContactInfoModal(true)}
                  title="View Contact Info"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={activePartner.avatar}
                      alt={activePartner.displayName}
                      className="w-10 h-10 object-cover rounded-full border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <h4 className="text-sm font-semibold text-zinc-100 truncate">
                      {activePartner.displayName}
                    </h4>
                    <p className="text-[11px] font-mono truncate mt-0.5">
                      {isPartnerTyping ? (
                        <span className="text-[#00a884] font-medium animate-pulse flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-ping" />
                          <span>typing...</span>
                        </span>
                      ) : (
                        <span className="text-cyan-400">online</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => alert(`Starting video call with ${activePartner.displayName}...`)}
                    className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Calling ${activePartner.displayName}...`)}
                    className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Voice Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactInfoModal(true)}
                    className="p-1.5 hover:text-cyan-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Contact Info & Chat Settings"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : currentAiCompanion ? (
              <div className="flex items-center justify-between w-full min-w-0 pr-1" id="active-ai-header">
                <div
                  className="flex items-center space-x-2.5 min-w-0 cursor-pointer hover:opacity-90 transition"
                  onClick={() => setShowContactInfoModal(true)}
                  title="View Contact Info"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentAiCompanion.avatar}
                      alt={currentAiCompanion.name}
                      className="w-10 h-10 object-cover rounded-full border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <h4 className="text-sm font-semibold text-zinc-100 truncate flex items-center space-x-1.5">
                      <span>{currentAiCompanion.name}</span>
                      <span className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded font-mono">
                        AI
                      </span>
                    </h4>
                    <p className="text-[11px] font-mono truncate mt-0.5">
                      {isAiTyping ? (
                        <span className="text-purple-400 font-medium animate-pulse flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                          <span>typing...</span>
                        </span>
                      ) : (
                        <span className="text-purple-400">online</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => alert(`Starting video call with ${currentAiCompanion.name}...`)}
                    className="p-1.5 hover:text-purple-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Calling ${currentAiCompanion.name}...`)}
                    className="p-1.5 hover:text-purple-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Voice Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactInfoModal(true)}
                    className="p-1.5 hover:text-purple-300 hover:bg-zinc-800/80 rounded-full transition cursor-pointer"
                    title="Contact Info & Chat Settings"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-zinc-300">Select a chat to begin</div>
            )}
          </div>
        </div>

        {/* Expandable In-Chat Search Bar */}
        {showInChatSearch && (
          <div className="px-3.5 py-2 bg-[#12121a] text-zinc-100 flex items-center space-x-2 z-10 border-b border-zinc-800/80 shadow-md" id="in-chat-search-bar">
            <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search in conversation..."
              value={inChatSearch}
              onChange={(e) => setInChatSearch(e.target.value)}
              className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
            {inChatSearch.trim() && (
              <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 flex-shrink-0">
                {(currentDirectChat
                  ? chatMessages.filter((m) => m.text.toLowerCase().includes(inChatSearch.toLowerCase())).length
                  : messages.filter((m) => m.text.toLowerCase().includes(inChatSearch.toLowerCase())).length)} matches
              </span>
            )}
            <button
              onClick={() => {
                setInChatSearch('');
                setShowInChatSearch(false);
              }}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer flex-shrink-0"
              title="Close Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 scrollbar-thin z-10 relative" id="message-stream-scroll-area">
          {/* End-to-End Encryption Banner */}
          <div className="mx-auto max-w-sm p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200/90 text-[11px] text-center shadow-[0_0_15px_rgba(245,158,11,0.08)] mb-3 cursor-pointer hover:bg-amber-950/60 transition" id="whatsapp-e2ee-banner">
            <div className="flex items-start justify-center space-x-1.5 leading-snug">
              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Messages and calls in this conversation are end-to-end encrypted. Tap for more info.
              </span>
            </div>
          </div>

          {/* Direct Chat Messages */}
          {currentDirectChat ? (
            (() => {
              const displayDirectMsgs = inChatSearch.trim()
                ? chatMessages.filter((m) => m.text.toLowerCase().includes(inChatSearch.toLowerCase()))
                : chatMessages;

              return displayDirectMsgs.length > 0 ? (
                displayDirectMsgs.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div
                      key={msg.id}
                      id={`chat-msg-${msg.id}`}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end my-1`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[70%] rounded-lg px-3 py-1.5 text-xs text-zinc-100 leading-relaxed relative shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-900/60 to-purple-900/60 border border-cyan-500/40 rounded-tr-none shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                            : 'bg-[#13131c] border border-zinc-800/80 rounded-tl-none'
                        } ${inChatSearch.trim() ? 'ring-2 ring-amber-400' : ''}`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-cyan-500/30 group relative bg-black/40">
                            <img
                              src={msg.imageUrl}
                              alt="Nightgram Image"
                              className="w-full max-h-64 object-cover cursor-pointer hover:scale-[1.02] transition duration-200"
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                            <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] text-cyan-300 font-mono flex items-center space-x-1 border border-cyan-500/30">
                              <ImageIcon className="w-3 h-3" />
                              <span>Nightgram Media</span>
                            </div>
                          </div>
                        )}
                        {(msg.audioUrl || (msg.text && (msg.text.includes('🎤 Voice Note') || msg.text.includes('[AUDIO:')))) ? (
                          <VoiceNotePlayer
                            audioUrl={msg.audioUrl}
                            duration={msg.audioDuration || (msg.text?.match(/\(([^)]+)\)/)?.[1]) || '0:07'}
                            isMe={isMe}
                          />
                        ) : (
                          msg.text && <p className="whitespace-pre-wrap font-sans text-[13px]">{msg.text}</p>
                        )}
                        <div className="flex items-center justify-end space-x-1 mt-0.5 text-[9.5px] text-zinc-400 float-right ml-3 font-mono">
                          <span>{msg.timestampFormatted || '12:00'}</span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-400 inline ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3" id="empty-chat-state">
                  <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">
                      {inChatSearch.trim() ? 'No Matching Messages' : 'No Messages Yet'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                      {inChatSearch.trim()
                        ? `No messages matching "${inChatSearch}" were found in this chat.`
                        : `Send a message to start conversation with @${activePartner?.username}.`}
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            /* AI Companion Fallback Stream */
            (() => {
              const displayAiMsgs = inChatSearch.trim()
                ? messages.filter((m) => m.text.toLowerCase().includes(inChatSearch.toLowerCase()))
                : messages;

              return displayAiMsgs.map((msg) => {
                const isMe = msg.sender === 'me';
                let displayImg = msg.imageUrl;
                let displayText = msg.text;
                if (displayText && displayText.includes('[IMAGE: ')) {
                  const match = displayText.match(/\[IMAGE:\s*([^\]]+)\]/);
                  if (match) {
                    displayImg = match[1].trim();
                    displayText = displayText.replace(/\[IMAGE:\s*[^\]]+\]/, '').trim();
                  }
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-1`}>
                    <div
                      className={`max-w-[82%] sm:max-w-[70%] rounded-lg px-3 py-1.5 text-xs text-zinc-100 leading-relaxed shadow-sm relative ${
                        isMe
                          ? 'bg-gradient-to-r from-cyan-900/60 to-purple-900/60 border border-cyan-500/40 rounded-tr-none shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                          : 'bg-[#13131c] border border-zinc-800/80 rounded-tl-none'
                      } ${inChatSearch.trim() ? 'ring-2 ring-amber-400' : ''}`}
                    >
                      {displayImg && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-cyan-500/30 group relative bg-black/40">
                          <img
                            src={displayImg}
                            alt="Nightgram Image"
                            className="w-full max-h-64 object-cover cursor-pointer hover:scale-[1.02] transition duration-200"
                            onClick={() => window.open(displayImg, '_blank')}
                          />
                          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] text-cyan-300 font-mono flex items-center space-x-1 border border-cyan-500/30">
                            <ImageIcon className="w-3 h-3" />
                            <span>Nightgram Story</span>
                          </div>
                        </div>
                      )}
                      {(msg.audioUrl || (displayText && (displayText.includes('🎤 Voice Note') || displayText.includes('[AUDIO:')))) ? (
                        <VoiceNotePlayer
                          audioUrl={msg.audioUrl}
                          duration={msg.audioDuration || (displayText?.match(/\(([^)]+)\)/)?.[1]) || '0:07'}
                          isMe={isMe}
                        />
                      ) : (
                        displayText && <p className="whitespace-pre-wrap font-sans text-[13px]">{displayText}</p>
                      )}
                      <div className="flex items-center justify-end space-x-1 mt-0.5 text-[9.5px] text-zinc-400 float-right ml-3 font-mono">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400 inline ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}

          {/* Real-time Typing Indicator for Direct Chat Partner or AI Companion */}
          <AnimatePresence>
            {(isPartnerTyping || isAiTyping) && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start items-end space-x-2 my-2"
                id="chat-typing-indicator"
              >
                <img
                  src={
                    isPartnerTyping
                      ? activePartner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      : currentAiCompanion?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt="Typing..."
                  className="w-7 h-7 rounded-full object-cover border border-zinc-700 shadow-sm"
                />
                <div className="bg-[#13131c] border border-zinc-800/90 text-zinc-300 rounded-2xl rounded-bl-none px-3.5 py-2 text-xs flex items-center space-x-2.5 shadow-md">
                  <span className="text-cyan-400 text-[11px] font-semibold font-sans">
                    {isPartnerTyping ? activePartner?.displayName : currentAiCompanion?.name} is typing...
                  </span>
                  <div className="flex space-x-1 items-center pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview Banner above Input Form */}
        {selectedImageToAttach && (
          <div className="px-3 py-2 bg-[#0c0c16] border-t border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative">
                <img
                  src={selectedImageToAttach}
                  alt="Selected image"
                  className="w-10 h-10 rounded-lg object-cover border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                />
                <div className="absolute -top-1 -right-1 bg-cyan-500 text-zinc-950 rounded-full p-0.5">
                  <ImageIcon className="w-2.5 h-2.5" />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Nightgram Image Attached</span>
                </span>
                <p className="text-[10px] text-zinc-400 truncate">Ready to send in chat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImageToAttach(null)}
              className="p-1 text-zinc-400 hover:text-red-400 transition cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat Input Footer */}
        <form onSubmit={handleSend} className="p-2.5 bg-[#0a0a10]/95 backdrop-blur-md border-t border-zinc-900/90 flex items-center space-x-2 z-10" id="chat-send-input-form">
          {isRecording ? (
            <div className="flex-1 bg-[#181224] border border-purple-500/50 rounded-full px-4 py-2 flex items-center justify-between shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-pulse">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                <Mic className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-xs font-bold text-purple-200 font-mono tracking-wider">
                  Recording... {formatTime(recordingTime)}
                </span>
              </div>

              <div className="hidden sm:flex items-center space-x-1">
                <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="w-1 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                  title="Cancel Voice Recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={stopAndSendVoiceRecording}
                  className="p-1.5 px-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition cursor-pointer flex items-center space-x-1 shadow-md"
                  title="Send Voice Note"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Rounded Input Pill */
            <div className="flex-1 bg-[#14141f] border border-zinc-800/90 rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-inner focus-within:border-cyan-500/50">
              <button
                type="button"
                onClick={() => setInputText((prev) => prev + ' 😊')}
                className="text-zinc-400 hover:text-cyan-300 p-1 cursor-pointer transition"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                id="chat-message-text-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message or tap mic to record..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setShowMediaLibraryModal(true)}
                className={`p-1 cursor-pointer transition relative ${
                  selectedImageToAttach ? 'text-cyan-400' : 'text-zinc-400 hover:text-cyan-300'
                }`}
                title="Nightgram Stories & Posts Gallery"
              >
                <ImageIcon className="w-5 h-5" />
                {selectedImageToAttach && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowMediaLibraryModal(true)}
                className="text-zinc-400 hover:text-cyan-300 p-1 cursor-pointer transition"
                title="Attach from Nightgram"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowMediaLibraryModal(true)}
                className="text-zinc-400 hover:text-cyan-300 p-1 cursor-pointer transition"
                title="Nightgram Photos"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Circular Action Floating Button (Mic or Send) */}
          {!isRecording && (
            <button
              id="chat-submit-btn"
              type={inputText.trim() || selectedImageToAttach ? "submit" : "button"}
              onClick={(e) => {
                if (!inputText.trim() && !selectedImageToAttach) {
                  e.preventDefault();
                  startVoiceRecording();
                }
              }}
              disabled={isAiTyping}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all duration-200 cursor-pointer flex-shrink-0"
              title={(inputText.trim() || selectedImageToAttach) ? 'Send message' : 'Record Voice Note'}
            >
              {(inputText.trim() || selectedImageToAttach) ? (
                <Send className="w-4 h-4 translate-x-0.5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}
        </form>
      </div>

      {/* NEW CHAT MODAL (Selecting Other Registered Users) */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" id="new-chat-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              id="new-chat-modal-card"
              className="w-full max-w-md bg-[#0d0d14] border border-zinc-800 rounded-2xl p-5 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900/80 pb-3" id="modal-header">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Start a Direct Conversation</h3>
                </div>
                <button
                  id="close-new-chat-modal-btn"
                  onClick={() => setShowNewChatModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search user input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="modal-search-user-input"
                  type="text"
                  placeholder="Search registered members by name or @username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-[#141420] border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Registered Users List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 p-1 scrollbar-thin" id="modal-users-scroll-list">
                {loadingUsers ? (
                  <div className="p-8 text-center text-xs text-zinc-500">Loading Nightgram members...</div>
                ) : filteredModalUsers.length > 0 ? (
                  filteredModalUsers.map((user) => (
                    <div
                      key={user.uid}
                      id={`modal-user-row-${user.uid}`}
                      onClick={() => handleStartChatWithUser(user)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#12121a] hover:bg-[#181826] border border-zinc-800/60 hover:border-cyan-500/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-200 truncate">{user.displayName}</h4>
                          <p className="text-[10px] text-cyan-400 font-mono truncate">@{user.username}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex-shrink-0"
                      >
                        Chat
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No matching members found in the community.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* STATUS STORY VIEWER MODAL */}
        {viewingStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" id="status-viewer-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#0a0a12] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-[520px]"
            >
              {/* Animated Story Progress Bar */}
              <div className="w-full bg-zinc-800/80 h-1 relative overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  onAnimationComplete={() => setViewingStatus(null)}
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                />
              </div>

              {/* Status Header Bar */}
              <div className="p-3.5 bg-[#0f0f18]/90 backdrop-blur-md flex items-center justify-between border-b border-zinc-800/60">
                <div className="flex items-center space-x-3">
                  <img
                    src={viewingStatus.avatar}
                    alt={viewingStatus.name}
                    className="w-9 h-9 rounded-full object-cover border border-cyan-500/50"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 flex items-center space-x-1">
                      <span>{viewingStatus.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 inline ml-0.5" />
                    </h4>
                    <p className="text-[10px] text-zinc-400">{viewingStatus.time}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingStatus(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Card Body */}
              <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br ${viewingStatus.gradient} relative overflow-hidden space-y-3`}>
                <Sparkles className="w-8 h-8 text-cyan-300 opacity-80 animate-pulse" />
                <p className="text-base font-bold text-white leading-relaxed drop-shadow-md font-sans px-2">
                  "{viewingStatus.caption}"
                </p>
                <span className="text-[10px] bg-black/40 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  Nightgram Status
                </span>
              </div>

              {/* Reply Input Bar */}
              <div className="p-3 bg-[#0d0d16] border-t border-zinc-800/80 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Reply to status..."
                  value={statusReplyText}
                  onChange={(e) => setStatusReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && statusReplyText.trim()) {
                      alert(`Reply sent to ${viewingStatus.name}!`);
                      setStatusReplyText('');
                      setViewingStatus(null);
                    }
                  }}
                  className="flex-1 bg-[#161622] border border-zinc-700/80 rounded-full py-2 px-4 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (statusReplyText.trim()) {
                      alert(`Reply sent to ${viewingStatus.name}!`);
                      setStatusReplyText('');
                      setViewingStatus(null);
                    }
                  }}
                  className="p-2.5 rounded-full bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold transition cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CREATE STATUS MODAL */}
        {showStatusCreator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" id="create-status-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0e0e18] border border-zinc-800 rounded-2xl p-5 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">New Nightgram Status</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatusCreator(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Text Caption Input */}
              <textarea
                rows={3}
                placeholder="Write something special for your friends..."
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                className="w-full bg-[#141422] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
              />

              {/* Background Gradient Palette Picker */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Background Style</span>
                <div className="flex items-center space-x-2.5">
                  {[
                    { label: 'Cyan-Purple', val: 'from-cyan-950 via-purple-950 to-zinc-950' },
                    { label: 'Pink-Magenta', val: 'from-pink-950 via-purple-900 to-indigo-950' },
                    { label: 'Blue-Emerald', val: 'from-blue-950 via-teal-900 to-zinc-950' },
                    { label: 'Night-Dark', val: 'from-zinc-950 via-slate-900 to-black' },
                  ].map((bg) => (
                    <button
                      key={bg.val}
                      type="button"
                      onClick={() => setNewStatusBg(bg.val)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${bg.val} border-2 transition ${
                        newStatusBg === bg.val ? 'border-cyan-400 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'border-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (!newStatusText.trim()) return;
                  const newSt: StatusItem = {
                    id: 'user-' + Date.now(),
                    name: currentUser?.displayName || 'Me',
                    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    time: 'Just now',
                    caption: newStatusText,
                    gradient: newStatusBg,
                    isViewed: false,
                  };
                  setUserStatuses((prev) => [newSt, ...prev]);
                  setAllStatuses((prev) => [newSt, ...prev]);
                  setNewStatusText('');
                  setShowStatusCreator(false);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                Post Status
              </button>
            </motion.div>
          </div>
        )}

        {/* MEDIA LIBRARY MODAL (Stories & Recent Posts) */}
        {showMediaLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" id="media-library-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-[#0e0e18] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[540px]"
            >
              {/* Modal Header */}
              <div className="p-4 bg-[#121220] border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-1">
                      <span>Nightgram Gallery (Stories & Posts)</span>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 inline" />
                    </h3>
                    <p className="text-[11px] text-zinc-400">Select an image to send directly in this conversation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMediaLibraryModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Header */}
              <div className="flex items-center space-x-2 px-4 py-2.5 bg-[#090912] border-b border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setMediaLibraryTab('stories')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    mediaLibraryTab === 'stories'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Community Stories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaLibraryTab('posts')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    mediaLibraryTab === 'posts'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Recent Posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaLibraryTab('upload')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    mediaLibraryTab === 'upload'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Image Link</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {mediaLibraryTab === 'stories' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {NIGHTGRAM_STORIES_GALLERY.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => {
                          setSelectedImageToAttach(story.imageUrl);
                          setShowMediaLibraryModal(false);
                        }}
                        className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-cyan-400/80 cursor-pointer transition-all duration-200 shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-zinc-900"
                      >
                        <img
                          src={story.imageUrl}
                          alt={story.title}
                          className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                              {story.category}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight drop-shadow">{story.title}</h4>
                            <p className="text-[10px] text-zinc-300 line-clamp-1 mt-0.5">{story.caption}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="bg-cyan-500 text-zinc-950 text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                            Attach to Chat
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mediaLibraryTab === 'posts' && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    {NIGHTGRAM_POSTS_GALLERY.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setSelectedImageToAttach(post.imageUrl);
                          setShowMediaLibraryModal(false);
                        }}
                        className="group relative rounded-xl overflow-hidden border border-zinc-800 hover:border-cyan-400/80 cursor-pointer transition-all duration-200 shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-zinc-900"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-between">
                          <div className="flex items-center space-x-2">
                            <img src={post.avatar} alt={post.author} className="w-5 h-5 rounded-full border border-cyan-400 object-cover" />
                            <span className="text-[10px] font-semibold text-zinc-200">{post.author}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white drop-shadow">{post.title}</h4>
                            <p className="text-[10px] text-zinc-300 line-clamp-1">{post.caption}</p>
                            <div className="flex items-center space-x-1 mt-1 text-[10px] text-pink-400">
                              <Heart className="w-3 h-3 fill-pink-400" />
                              <span>{post.likes} likes</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="bg-cyan-500 text-zinc-950 text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                            Attach to Chat
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mediaLibraryTab === 'upload' && (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Paperclip className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">Insert Direct Image Link</h4>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xs">Paste the URL of any image from the web to attach it to the message.</p>
                    </div>
                    <div className="w-full max-w-md space-y-3">
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={customImageUrlInput}
                        onChange={(e) => setCustomImageUrlInput(e.target.value)}
                        className="w-full bg-[#141422] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customImageUrlInput.trim()) {
                            setSelectedImageToAttach(customImageUrlInput.trim());
                            setCustomImageUrlInput('');
                            setShowMediaLibraryModal(false);
                          }
                        }}
                        disabled={!customImageUrlInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
                      >
                        Attach Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* CONTACT INFO & CHAT SETTINGS MODAL */}
        {showContactInfoModal && activeContactInfo && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0a0a12] border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[88vh] text-zinc-100 my-auto"
            >
              {/* Top Navigation Header Bar */}
              <div className="p-3.5 px-4 bg-[#0e0e18] border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowContactInfoModal(false)}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-full transition cursor-pointer flex items-center space-x-1"
                  title="Back to Chat"
                >
                  <ArrowLeft className="w-5 h-5 text-cyan-400" />
                </button>
                <h2 className="text-sm font-bold text-zinc-100 tracking-wide font-sans">
                  Contact Info & Chat Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingQuoteNote(!isEditingQuoteNote)}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg hover:bg-cyan-950/40 transition cursor-pointer"
                >
                  {isEditingQuoteNote ? 'Done' : 'Edit'}
                </button>
              </div>

              {/* Scrollable Main Settings Area */}
              <div className="flex-1 overflow-y-auto pb-10 space-y-4">
                {/* Profile Header Card */}
                <div className="flex flex-col items-center pt-6 px-4">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-cyan-400 to-purple-500 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                      <img
                        src={activeContactInfo.avatar}
                        alt={activeContactInfo.name}
                        className="w-full h-full object-cover rounded-full bg-black"
                      />
                    </div>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0a12] shadow-md" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mt-3 font-sans flex items-center space-x-1.5">
                    <span>{activeContactInfo.name}</span>
                    {activeContactInfo.isAI && (
                      <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded font-mono">
                        AI
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {activeContactInfo.handle} • {activeContactInfo.phone}
                  </p>
                </div>

                {/* Quick Actions Row (4 Pill Buttons) */}
                <div className="grid grid-cols-4 gap-2.5 px-4 pt-1">
                  <button
                    type="button"
                    onClick={() => alert(`Starting audio call with ${activeContactInfo.name}...`)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#141422] border border-zinc-800/90 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-zinc-200 transition cursor-pointer group shadow-sm"
                  >
                    <Phone className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-200" />
                    <span className="text-[11px] font-medium text-zinc-300 mt-1.5">Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(`Starting video call with ${activeContactInfo.name}...`)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#141422] border border-zinc-800/90 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-zinc-200 transition cursor-pointer group shadow-sm"
                  >
                    <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-200" />
                    <span className="text-[11px] font-medium text-zinc-300 mt-1.5">Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert(`Opening Nightgram Pay to send credits to ${activeContactInfo.name}...`)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#141422] border border-zinc-800/90 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-zinc-200 transition cursor-pointer group shadow-sm"
                  >
                    <DollarSign className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-200" />
                    <span className="text-[11px] font-medium text-zinc-300 mt-1.5">Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowContactInfoModal(false);
                      setShowInChatSearch(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#141422] border border-zinc-800/90 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-zinc-200 transition cursor-pointer group shadow-sm"
                  >
                    <Search className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-200" />
                    <span className="text-[11px] font-medium text-zinc-300 mt-1.5">Search</span>
                  </button>
                </div>

                {/* Status / Bio Quote Card */}
                <div className="px-4">
                  <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl p-4 shadow-sm relative">
                    {isEditingQuoteNote ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={customQuoteNote || activeContactInfo.bio}
                          onChange={(e) => setCustomQuoteNote(e.target.value)}
                          className="w-full bg-[#181828] border border-cyan-500/60 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none"
                          placeholder="Enter status quote..."
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingQuoteNote(false)}
                          className="px-3 py-1 bg-cyan-500 text-zinc-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Save Quote
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-zinc-200 font-sans italic leading-relaxed">
                          "{customQuoteNote || activeContactInfo.bio}"
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-2">{activeContactInfo.date}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Group 1: Media, Starred, Notifications, Wallpaper, Save to Photos */}
                <div className="px-4">
                  <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
                    {/* Media, links and docs */}
                    <button
                      type="button"
                      onClick={() => setShowMediaDocsModal(true)}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Media, links and docs</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                        <span>{chatMessages.filter(m => m.imageUrl).length || 3}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>

                    {/* Starred messages */}
                    <button
                      type="button"
                      onClick={() => alert('No starred messages found in this chat.')}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <Star className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Starred messages</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                        <span>None</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>

                    {/* Notifications */}
                    <button
                      type="button"
                      onClick={() => setContactNotificationsMuted(!contactNotificationsMuted)}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs font-mono">
                        <span className={contactNotificationsMuted ? 'text-amber-400' : 'text-zinc-400'}>
                          {contactNotificationsMuted ? 'Muted' : 'Default'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>

                    {/* Wallpaper */}
                    <button
                      type="button"
                      onClick={() => setShowWallpaperModal(true)}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <Palette className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Wallpaper</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                        <span>{chatWallpaper}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>

                    {/* Save to Photos */}
                    <button
                      type="button"
                      onClick={() => setShowSaveToPhotosModal(true)}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <Download className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Save to Photos</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                        <span>{saveToPhotos}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Group 2: Disappearing messages & Lock chat */}
                <div className="px-4">
                  <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
                    {/* Disappearing messages */}
                    <button
                      type="button"
                      onClick={() => setShowDisappearingModal(true)}
                      className="w-full p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-zinc-300" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">Disappearing messages</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono">
                        <span>{disappearingMessagesSetting}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </button>

                    {/* Lock chat */}
                    <div className="p-3.5 px-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 text-zinc-200 flex items-center justify-center flex-shrink-0">
                          <Lock className="w-4 h-4 text-zinc-300" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-200">Lock chat</h4>
                          <p className="text-[10px] text-zinc-400 leading-tight">
                            Lock and hide this chat on this device.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChatLockEnabled(!chatLockEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer flex-shrink-0 ${
                          chatLockEnabled ? 'bg-cyan-500 justify-end' : 'bg-zinc-700 justify-start'
                        }`}
                      >
                        <motion.div
                          layout
                          className="w-4 h-4 rounded-full bg-white shadow-md"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Encryption Banner & Management Actions */}
                <div className="px-4 space-y-3 pt-1">
                  <div className="p-3 rounded-2xl bg-[#0f0f18] border border-amber-500/20 flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
                    </p>
                  </div>

                  <div className="bg-[#12121e] border border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-zinc-800/60 shadow-sm">
                    <button
                      type="button"
                      onClick={() => alert('Chat messages cleared.')}
                      className="w-full p-3.5 px-4 text-left text-xs font-bold text-amber-400 hover:bg-amber-950/20 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-amber-400" />
                      <span>Clear Chat History</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Blocked ${activeContactInfo.name}.`)}
                      className="w-full p-3.5 px-4 text-left text-xs font-bold text-red-400 hover:bg-red-950/20 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <Ban className="w-4 h-4 text-red-400" />
                      <span>Block {activeContactInfo.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Reported ${activeContactInfo.name}.`)}
                      className="w-full p-3.5 px-4 text-left text-xs font-bold text-red-400 hover:bg-red-950/20 transition flex items-center space-x-2.5 cursor-pointer"
                    >
                      <Flag className="w-4 h-4 text-red-400" />
                      <span>Report {activeContactInfo.name}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* SUB-MODAL: WALLPAPER PICKER */}
        {showWallpaperModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#12121e] border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Choose Chat Wallpaper</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWallpaperModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'Default', label: 'Default Pattern', desc: 'Classic Nightgram doodle grid' },
                  { id: 'Cyber Glow', label: 'Cyber Glow', desc: 'Radial cyan & purple ambient mesh' },
                  { id: 'Midnight Neon', label: 'Midnight Neon', desc: 'Deep indigo gradient canvas' },
                  { id: 'Dark Minimal', label: 'Dark Minimal', desc: 'Clean pure dark slate' },
                ].map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => {
                      setChatWallpaper(wp.id as any);
                      setShowWallpaperModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      chatWallpaper === wp.id
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-zinc-800/80 bg-[#161626] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{wp.label}</h4>
                      <p className="text-[10px] text-zinc-400">{wp.desc}</p>
                    </div>
                    {chatWallpaper === wp.id && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* SUB-MODAL: DISAPPEARING MESSAGES */}
        {showDisappearingModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#12121e] border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Disappearing Messages Timer</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDisappearingModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                When enabled, new messages sent in this chat will disappear after the selected duration.
              </p>

              <div className="space-y-2">
                {['Off', '24 hours', '7 days', '90 days'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setDisappearingMessagesSetting(option as any);
                      setShowDisappearingModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      disappearingMessagesSetting === option
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-zinc-800/80 bg-[#161626] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">{option}</span>
                    {disappearingMessagesSetting === option && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* SUB-MODAL: SAVE TO PHOTOS */}
        {showSaveToPhotosModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#12121e] border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Save to Photos</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSaveToPhotosModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'Default', label: 'Default (Off)', desc: 'Do not automatically save media' },
                  { id: 'Always', label: 'Always', desc: 'Automatically save received media to device' },
                  { id: 'Never', label: 'Never', desc: 'Block saving media to device' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSaveToPhotos(opt.id as any);
                      setShowSaveToPhotosModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      saveToPhotos === opt.id
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-zinc-800/80 bg-[#161626] text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold">{opt.label}</h4>
                      <p className="text-[10px] text-zinc-400">{opt.desc}</p>
                    </div>
                    {saveToPhotos === opt.id && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* SUB-MODAL: MEDIA, LINKS AND DOCS */}
        {showMediaDocsModal && (
          <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0e0e18] border border-zinc-800 rounded-3xl p-5 shadow-2xl text-zinc-100 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Media, Links and Docs ({chatMessages.filter(m => m.imageUrl).length || 3})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMediaDocsModal(false)}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300',
                    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
                    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300',
                    ...chatMessages.filter((m) => m.imageUrl).map((m) => m.imageUrl!),
                  ].map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-800 group relative bg-black/40 cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <img
                        src={url}
                        alt={`Media item ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

