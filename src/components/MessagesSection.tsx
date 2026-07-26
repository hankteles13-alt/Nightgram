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
  ShieldCheck
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

  // Registered Users for New Chat modal
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Local Chat state
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    // If active chat is Direct Chat with a real user
    if (currentDirectChat && currentUser?.uid) {
      try {
        const messagesRef = collection(db, 'chats', currentDirectChat.id, 'messages');
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Encrypt message text using Web Crypto AES-256-GCM before database write
        const encryptedText = await encryptMessageText(textToSend, currentDirectChat.id);

        await addDoc(messagesRef, {
          chatId: currentDirectChat.id,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.username,
          senderAvatar: currentUser.avatar,
          text: encryptedText,
          createdAt: new Date().toISOString(),
        });

        // Update room metadata with encrypted text for database storage
        await updateDoc(doc(db, 'chats', currentDirectChat.id), {
          lastMessage: encryptedText,
          lastMessageTime: nowFormatted,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error sending message:', err);
      }
      return;
    }

    // If active chat is AI Companion
    if (currentAiCompanion) {
      if (onSendMessage) {
        onSendMessage('me', textToSend);
      }
      setIsAiTyping(true);

      setTimeout(() => {
        setIsAiTyping(false);
        let reply = '';
        if (currentAiCompanion.id === 'luna') {
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
      className="bg-[#0a0a0f] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[78vh] relative"
      id="messages-section-root"
    >
      {/* SIDEBAR / CHATS PAGE OVERVIEW PANE */}
      <div
        className={`md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-900/80 flex flex-col h-full bg-[#07070b]/90 transition-all ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
        id="messages-sidebar"
      >
        {/* Chats Page Main Header Bar */}
        <div className="p-3.5 border-b border-zinc-900/80 flex items-center justify-between bg-[#0b0b12]" id="sidebar-header-bar">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">All Conversations</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
              {filteredDirectChats.length + filteredAiCompanions.length}
            </span>
          </div>
          {currentUser && (
            <button
              id="new-chat-trigger-btn"
              onClick={handleOpenNewChatModal}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 rounded-xl text-[11px] font-semibold cursor-pointer transition shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter Pills */}
        <div className="p-2.5 border-b border-zinc-900/60 space-y-2" id="sidebar-search-container">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sidebar-chat-search-input"
              type="text"
              placeholder="Search conversations..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-[#12121a] border border-zinc-800/80 rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          <div className="flex items-center space-x-1.5" id="chat-category-filter-pills">
            <button
              type="button"
              onClick={() => setChatCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                chatCategoryFilter === 'all'
                  ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/30'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChatCategoryFilter('direct')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                chatCategoryFilter === 'direct'
                  ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/30'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setChatCategoryFilter('ai')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                chatCategoryFilter === 'ai'
                  ? 'bg-zinc-800 text-purple-300 border border-purple-500/30'
                  : 'bg-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              AI Companions
            </button>
          </div>
        </div>

        {/* Chats & Companions Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin" id="chats-sidebar-list">
          {/* Direct User Chats Section */}
          {(chatCategoryFilter === 'all' || chatCategoryFilter === 'direct') && (
            <div id="direct-chats-section">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-bold text-cyan-400/90 uppercase tracking-wider flex items-center space-x-1">
                  <Users className="w-3 h-3 text-cyan-400 mr-1" />
                  Direct Messages
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">{filteredDirectChats.length}</span>
              </div>

              <div className="space-y-1">
                {filteredDirectChats.length > 0 ? (
                  filteredDirectChats.map((chat) => {
                    const partner = getPartnerProfile(chat);
                    if (!partner) return null;
                    const isSelected = activeChatId === chat.id;

                    return (
                      <button
                        key={chat.id}
                        id={`chat-row-${chat.id}`}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#141422] border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                            : 'bg-transparent border border-transparent hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={partner.avatar}
                            alt={partner.displayName}
                            className="w-9 h-9 object-cover rounded-full border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-0 right-0 p-0.5 bg-black rounded-full">
                            <Circle className="w-2 h-2 text-emerald-400 fill-emerald-400" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200 truncate">{partner.displayName}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{chat.lastMessageTime || 'Now'}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-[11px] text-zinc-600 italic">
                    {currentUser
                      ? 'No active direct messages. Click "+ New Chat" above to start one!'
                      : 'Sign in to send direct messages.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Companions Section */}
          {(chatCategoryFilter === 'all' || chatCategoryFilter === 'ai') && (
            <div id="ai-companions-section">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-bold text-purple-400/90 uppercase tracking-wider flex items-center space-x-1">
                  <Bot className="w-3 h-3 text-purple-400 mr-1" />
                  Nocturnal Companions
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">{filteredAiCompanions.length}</span>
              </div>

              <div className="space-y-1">
                {filteredAiCompanions.map((ai) => {
                  const isSelected = activeChatId === ai.id;
                  const AiIcon = ai.icon;

                  return (
                    <button
                      key={ai.id}
                      id={`ai-row-${ai.id}`}
                      onClick={() => handleSelectChat(ai.id)}
                      className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#141422] border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                          : 'bg-transparent border border-transparent hover:bg-zinc-900/40'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={ai.avatar}
                          alt={ai.name}
                          className="w-9 h-9 object-cover rounded-full border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-0 right-0 p-0.5 bg-black rounded-full">
                          <Circle
                            className={`w-2 h-2 ${
                              ai.online ? 'text-cyan-400 fill-cyan-400' : 'text-zinc-600 fill-zinc-600'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 truncate">{ai.name}</span>
                          <AiIcon className={`w-3.5 h-3.5 ${ai.color}`} />
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{ai.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT CONVERSATION PANE */}
      <div
        className={`md:col-span-8 flex flex-col h-full bg-[#0a0a0f] transition-all ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
        id="messages-chat-pane"
      >
        {/* Chat Pane Top Header */}
        <div className="p-3.5 border-b border-zinc-900/80 bg-[#0c0c14]/80 flex items-center justify-between" id="chat-pane-header-bar">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Back button to return to all chats view on mobile */}
            <button
              type="button"
              id="back-to-chats-list-btn"
              onClick={() => setMobileView('list')}
              className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 rounded-lg border border-zinc-800 transition flex-shrink-0"
              title="Back to All Chats"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {activePartner ? (
              <div className="flex items-center justify-between w-full min-w-0 pr-1" id="active-partner-header">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={activePartner.avatar}
                      alt={activePartner.displayName}
                      className="w-9 h-9 object-cover rounded-full border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 right-0 p-0.5 bg-black rounded-full">
                      <Circle className="w-2 h-2 text-emerald-400 fill-emerald-400" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-100 flex items-center space-x-1.5 truncate">
                      <span className="truncate">{activePartner.displayName}</span>
                      <span className="text-[10px] font-normal text-cyan-400 flex-shrink-0">@{activePartner.username}</span>
                    </h4>
                    <div className="flex items-center space-x-2 truncate mt-0.5">
                      <p className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1 truncate">
                        <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate font-semibold">E2EE AES-256</span>
                      </p>
                      <span className="text-zinc-600 text-[10px]">•</span>
                      <p className="text-[10px] text-zinc-400 flex items-center space-x-1 truncate font-sans">
                        <span>{getLastSeenText()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* In-Chat Search Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowInChatSearch(!showInChatSearch);
                      if (showInChatSearch) setInChatSearch('');
                    }}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      showInChatSearch || inChatSearch
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Search messages in this chat"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-full text-[10px] font-bold font-mono shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>E2EE Active</span>
                  </div>
                </div>
              </div>
            ) : currentAiCompanion ? (
              <div className="flex items-center justify-between w-full min-w-0 pr-1" id="active-ai-header">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentAiCompanion.avatar}
                      alt={currentAiCompanion.name}
                      className="w-9 h-9 object-cover rounded-full border border-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 right-0 p-0.5 bg-black rounded-full">
                      <Circle className="w-2 h-2 text-cyan-400 fill-cyan-400" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-100 flex items-center space-x-1.5 truncate">
                      <span className="truncate">{currentAiCompanion.name}</span>
                      <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-purple-950/60 rounded border border-purple-800/40 flex-shrink-0">
                        AI
                      </span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 flex items-center space-x-1 truncate mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-1"></span>
                      <span>{getLastSeenText()}</span>
                    </p>
                  </div>
                </div>

                {/* In-Chat Search Button for AI */}
                <button
                  type="button"
                  onClick={() => {
                    setShowInChatSearch(!showInChatSearch);
                    if (showInChatSearch) setInChatSearch('');
                  }}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    showInChatSearch || inChatSearch
                      ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Search messages in this chat"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-zinc-400">Select a chat to begin</div>
            )}
          </div>
        </div>

        {/* Expandable In-Chat Search Bar */}
        {showInChatSearch && (
          <div className="px-3.5 py-2 bg-[#0e0e18] border-b border-zinc-800/80 flex items-center space-x-2 animate-fadeIn" id="in-chat-search-bar">
            <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search in conversation..."
              value={inChatSearch}
              onChange={(e) => setInChatSearch(e.target.value)}
              className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
            {inChatSearch.trim() && (
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-950/80 rounded border border-cyan-800/60 flex-shrink-0">
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
              className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer flex-shrink-0"
              title="Close Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin" id="message-stream-scroll-area">
          {/* E2EE Security Callout Banner */}
          {currentDirectChat && (
            <div className="mx-auto max-w-md p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-emerald-300 text-[10px] flex items-center space-x-2.5 shadow-[0_0_12px_rgba(16,185,129,0.08)] mb-2" id="e2ee-security-banner">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>End-to-End Encrypted:</strong> Messages are secured client-side using 256-bit AES-GCM. No one outside of this chat can read them.
              </span>
            </div>
          )}

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
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                    >
                      {!isMe && (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-6 h-6 rounded-full object-cover border border-zinc-800 flex-shrink-0 mb-1"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed font-sans shadow-lg ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/40 text-zinc-100 rounded-tr-none'
                            : 'bg-[#13131c] border border-zinc-800/80 text-zinc-300 rounded-tl-none'
                        } ${inChatSearch.trim() ? 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className="flex items-center justify-between space-x-2 mt-1 text-[8.5px] font-mono">
                          <span className="text-emerald-400/90 font-bold flex items-center space-x-0.5">
                            <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                            E2EE
                          </span>
                          <span className="text-zinc-500">
                            {msg.timestampFormatted || 'Just now'}
                          </span>
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
                        : `Send a late-night whisper to start the conversation with @${activePartner?.username}.`}
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
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/40 text-zinc-100 rounded-tr-none'
                          : 'bg-[#13131c] border border-zinc-800/80 text-zinc-300 rounded-tl-none'
                      } ${inChatSearch.trim() ? 'border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : ''}`}
                    >
                      <p>{msg.text}</p>
                      <span className="block text-[8.5px] text-zinc-500 text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              });
            })()
          )}

          {/* AI Typing Indicator */}
          <AnimatePresence>
            {isAiTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex justify-start"
                id="ai-typing-indicator"
              >
                <div className="bg-[#13131c] border border-zinc-800/80 text-zinc-400 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center space-x-2">
                  <span className="text-zinc-500 text-[11px]">Companion is composing</span>
                  <div className="flex space-x-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-900/80 bg-[#08080d]/80 flex items-center space-x-2" id="chat-send-input-form">
          <input
            id="chat-message-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activePartner
                ? `Whisper to @${activePartner.username}...`
                : currentAiCompanion
                ? `Chat with ${currentAiCompanion.name}...`
                : 'Type a message...'
            }
            className="flex-1 bg-[#12121c] border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!inputText.trim() || isAiTyping}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              inputText.trim() && !isAiTyping
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 border-transparent text-white hover:opacity-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-zinc-900 border-zinc-800/80 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
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
      </AnimatePresence>
    </div>
  );
}

