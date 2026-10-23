import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft, CheckCheck, MessageCircle, MoreHorizontal,
  Paperclip, Search, Send, ShieldCheck, Smile, Sparkles, UserPlus, X
} from 'lucide-react';
import type { ChatMessage, ChatRoom, UserProfile, Message } from '../types';
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, onSnapshot, query, where, orderBy, arrayRemove, arrayUnion } from '../lib/supabaseFirestore';
import { encryptMessageText, decryptMessageText, isEncryptedMessage } from '../lib/e2ee';
import { optimizeImageForFirestore } from '../lib/imageOptimizer';
import { fetchAiCompanionReply, type ChatTurn } from '../lib/aiCompanion';

type TargetUser = { uid?: string; username: string; displayName?: string; avatar?: string };
type Props = {
  currentUser?: UserProfile | null;
  targetChatUser?: TargetUser | null;
  onClearTargetChatUser?: () => void;
  messages?: Message[];
  onSendMessage?: (sender: 'me' | 'luna' | 'neon_wanderer' | 'night_owl', text: string) => void;
  onClearMessages?: () => void;
  onOpenAppSettings?: () => void;
  onClose?: () => void;
};

const AI_ID = 'luna';
const AI_PROFILE = {
  uid: AI_ID, username: 'teles_ai', displayName: 'Teles AI',
  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  bio: 'Your Nightgram companion'
};
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80';

function timeLabel(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NightgramChatExperience({
  currentUser, targetChatUser, onClearTargetChatUser, messages = [], onSendMessage, onOpenAppSettings
}: Props) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeId, setActiveId] = useState(AI_ID);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!currentUser?.uid) { setRooms([]); return; }
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid));
    return onSnapshot(q, async snapshot => {
      const found = await Promise.all(snapshot.docs.map(async snap => {
        const room = { id: snap.id, ...snap.data() } as ChatRoom;
        if (room.lastMessage && isEncryptedMessage(room.lastMessage)) {
          const encryptedPreview = room.lastMessage;
          try {
            room.lastMessage = await decryptMessageText(encryptedPreview, room.id);
            // Support previews written by older builds that used participant IDs as the key.
            if (room.lastMessage.startsWith('🔒')) {
              const legacyId = [...(room.participants || [])].sort().join('_');
              if (legacyId) {
                const legacyPreview = await decryptMessageText(encryptedPreview, legacyId);
                if (!legacyPreview.startsWith('🔒')) room.lastMessage = legacyPreview;
              }
            }
            if (room.lastMessage.startsWith('🔒')) room.lastMessage = '🔒 Encrypted message';
          } catch { room.lastMessage = '🔒 Encrypted message'; }
        }
        return room;
      }));
      found.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setRooms(found);
    }, err => { console.error('Chat list error:', err); setError('Could not load chats. Check your connection and try again.'); });
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!activeId || activeId === AI_ID || !currentUser?.uid) { setChatMessages([]); return; }
    const q = query(collection(db, 'chats', activeId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, async snapshot => {
      const items = await Promise.all(snapshot.docs.map(async snap => {
        const data = snap.data();
        let body = data.text || '';
        if (body && isEncryptedMessage(body)) {
          try {
            body = await decryptMessageText(body, activeId);
            // Older builds encrypted new-chat messages with the sorted participant IDs
            // instead of the database conversation UUID. Try that legacy key for history.
            if (body.startsWith('🔒')) {
              const room = rooms.find(item => item.id === activeId);
              const legacyId = [...(room?.participants || [])].sort().join('_');
              if (legacyId) {
                const legacyBody = await decryptMessageText(data.text || '', legacyId);
                if (!legacyBody.startsWith('🔒')) body = legacyBody;
              }
            }
          } catch { body = '🔒 This message could not be decrypted on this device.'; }
        }
        return {
          ...data, id: snap.id, chatId: activeId, text: body,
          timestampFormatted: timeLabel(data.createdAt)
        } as ChatMessage;
      }));
      setChatMessages(items);
      updateDoc(doc(db, 'chats', activeId), { unreadBy: arrayRemove(currentUser.uid) }).catch(() => {});
    }, err => { console.error('Chat messages error:', err); setError('Messages could not be loaded. Please try again.'); });
  }, [activeId, currentUser?.uid]);

  useEffect(() => {
    if (!targetChatUser?.username || !currentUser?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        let targetUid = targetChatUser.uid;
        let profile: any = { username: targetChatUser.username, displayName: targetChatUser.displayName || targetChatUser.username, avatar: targetChatUser.avatar || FALLBACK_AVATAR };
        const found = await getDocs(query(collection(db, 'users'), where('username', '==', targetChatUser.username)));
        if (!found.empty) {
          targetUid = found.docs[0].id;
          const data = found.docs[0].data();
          profile = { username: data.username || profile.username, displayName: data.displayName || profile.displayName, avatar: data.avatar || profile.avatar };
        }
        if (!targetUid || targetUid === currentUser.uid || cancelled) return;
        await openRoom(targetUid, profile);
      } catch (e) {
        console.error(e); setError('Could not start that conversation.');
      } finally { onClearTargetChatUser?.(); }
    })();
    return () => { cancelled = true; };
  }, [targetChatUser?.username, targetChatUser?.uid, currentUser?.uid]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chatMessages, messages, aiTyping]);

  const openRoom = async (uid: string, profile: any) => {
    if (!currentUser?.uid || uid === currentUser.uid) return;
    const id = [currentUser.uid, uid].sort().join('_');
    const ref = doc(db, 'chats', id);
    const snap = await getDoc(ref);
    const me = { uid: currentUser.uid, username: currentUser.username, displayName: currentUser.displayName, avatar: currentUser.avatar || FALLBACK_AVATAR };
    const them = { uid, username: profile.username, displayName: profile.displayName || profile.username, avatar: profile.avatar || FALLBACK_AVATAR };
    if (!snap.exists()) {
      await setDoc(ref, {
        id, participants: [currentUser.uid, uid],
        participantProfiles: { [currentUser.uid]: me, [uid]: them },
        lastMessage: 'Conversation started', lastMessageTime: 'Just now',
        updatedAt: new Date().toISOString(), unreadBy: []
      });
    } else {
      await updateDoc(ref, {
        participants: Array.from(new Set([...(snap.data().participants || []), currentUser.uid, uid])),
        [`participantProfiles.${currentUser.uid}`]: me,
        [`participantProfiles.${uid}`]: them
      });
    }
    // Resolve the database conversation UUID before selecting the room.
    // Both users must encrypt/decrypt with this same ID or the recipient cannot read messages.
    const resolvedRoom = await getDoc(ref);
    const conversationId = resolvedRoom.data()?.id;
    setActiveId(conversationId || id); setMobileChatOpen(true); setShowNewChat(false); setError('');
  };

  const partnerFor = (room: ChatRoom) => {
    const otherId = room.participants?.find(id => id !== currentUser?.uid) || '';
    return room.participantProfiles?.[otherId] || { uid: otherId, username: 'nightgram_user', displayName: 'Nightgram user', avatar: FALLBACK_AVATAR };
  };

  const activeRoom = rooms.find(room => room.id === activeId);
  const activePartner: any = activeId === AI_ID ? AI_PROFILE : activeRoom ? partnerFor(activeRoom) : {
    username: activeId.split('_').find(id => id !== currentUser?.uid) || 'chat',
    displayName: 'Conversation', avatar: FALLBACK_AVATAR
  };
  // Collapse legacy/duplicate conversation documents so each person appears only once.
  // Prefer the most recently updated room for that person.
  const uniqueRooms = useMemo(() => {
    const newestFirst = [...rooms].sort((a, b) => {
      const aTime = new Date(a.updatedAt || 0).getTime() || 0;
      const bTime = new Date(b.updatedAt || 0).getTime() || 0;
      return bTime - aTime;
    });
    const seenPeople = new Set<string>();
    return newestFirst.filter(room => {
      const partner = partnerFor(room);
      const participantId = partner.uid || room.participants?.find(id => id !== currentUser?.uid) || '';
      const identity = participantId || partner.username?.trim().toLowerCase() || room.id;
      if (seenPeople.has(identity)) return false;
      seenPeople.add(identity);
      return true;
    });
  }, [rooms, currentUser?.uid]);

  const visibleRooms = useMemo(() => uniqueRooms.filter(room => {
    const p = partnerFor(room);
    const term = search.trim().toLowerCase();
    return !term || [p.displayName, p.username, room.lastMessage || ''].some(v => v.toLowerCase().includes(term));
  }), [uniqueRooms, search, currentUser?.uid]);

  const openNewChat = async () => {
    setShowNewChat(true); setLoadingUsers(true); setError('');
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.filter(d => d.id !== currentUser?.uid).map(d => {
        const u = d.data();
        return { uid: d.id, username: u.username || 'dreamer', displayName: u.displayName || u.username || 'Nightgram user', avatar: u.avatar || FALLBACK_AVATAR, bio: u.bio || '', followers: u.followers || 0, following: u.following || 0, stars: u.stars || 0 } as UserProfile;
      }));
    } catch (e) { console.error(e); setError('Could not load people right now.'); }
    finally { setLoadingUsers(false); }
  };

  const visibleUsers = users.filter(u => `${u.displayName} ${u.username}`.toLowerCase().includes(userSearch.toLowerCase()));

  const pickImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Please choose an image under 8 MB.'); return; }
    try {
      const optimized = await optimizeImageForFirestore(file);
      setAttachPreview(optimized);
      setError('');
    } catch { setError('That image could not be prepared. Try another one.'); }
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !attachPreview) || sending || !currentUser?.uid) return;
    const body = text.trim(); const image = attachPreview;
    setText(''); setAttachPreview(null); setShowEmoji(false); setSending(true); setError('');
    try {
      if (activeId === AI_ID) {
        const combined = image ? `${body}${body ? ' ' : ''}[Image attached]` : body;
        onSendMessage?.('me', combined);
        setAiTyping(true);
        const history: ChatTurn[] = messages.slice(-12).map(m => ({ role: m.sender === 'me' ? 'user' : 'model', text: m.text }));
        const answer = await fetchAiCompanionReply(combined || 'I shared an image.', history);
        onSendMessage?.('luna', answer);
        setAiTyping(false);
      } else {
        const encrypted = await encryptMessageText(body, activeId);
        const payload: any = {
          chatId: activeId, senderId: currentUser.uid,
          senderName: currentUser.displayName || currentUser.username,
          senderAvatar: currentUser.avatar || FALLBACK_AVATAR,
          text: encrypted, createdAt: new Date().toISOString()
        };
        if (image) payload.imageUrl = image;
        await addDoc(collection(db, 'chats', activeId, 'messages'), payload);
        const preview = image ? `🖼️ ${body || 'Photo'}` : encrypted;
        const other = activeRoom?.participants?.find(id => id !== currentUser.uid);
        await updateDoc(doc(db, 'chats', activeId), {
          lastMessage: preview, lastMessageTime: 'Just now', lastSenderId: currentUser.uid,
          updatedAt: new Date().toISOString(), unreadBy: other ? arrayUnion(other) : []
        });
      }
    } catch (e) { console.error('Send message failed:', e); setError('Message was not sent. Please try again.'); setText(body); setAttachPreview(image); setAiTyping(false); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const renderedMessages: ChatMessage[] = activeId === AI_ID
    ? messages.map((m, i) => ({
        id: m.id || `ai-${i}`, chatId: AI_ID, senderId: m.sender === 'me' ? 'me' : AI_ID,
        senderName: m.sender === 'me' ? 'You' : 'Teles AI', senderAvatar: m.sender === 'me' ? currentUser?.avatar || '' : AI_PROFILE.avatar,
        text: m.text, createdAt: m.timestamp, timestampFormatted: m.timestamp, imageUrl: m.imageUrl
      }))
    : chatMessages;

  const emojis = ['😊', '😂', '❤️', '✨', '🔥', '👍', '🙏', '🥹', '🎉', '🌙', '💜', '👀'];

  return (
    <div className="h-full min-h-0 w-full bg-[#080910] text-white flex overflow-hidden">
      <aside className={`w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-white/[0.08] bg-[#0b0d16] flex flex-col ${mobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300 font-bold">NIGHTGRAM / PRIVATE</p>
              <h1 className="text-2xl font-semibold tracking-tight mt-1">Messages<span className="text-cyan-300">.</span></h1>
              <p className="text-xs text-zinc-500 mt-1">Your people, one quiet space.</p>
            </div>
            <button onClick={openNewChat} title="Start a new chat" className="h-11 w-11 rounded-2xl bg-cyan-300 text-slate-950 flex items-center justify-center hover:bg-cyan-200 transition shadow-lg shadow-cyan-900/20"><UserPlus size={19}/></button>
          </div>
          <label className="mt-5 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 focus-within:border-cyan-300/50">
            <Search size={17} className="text-zinc-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" className="w-full bg-transparent outline-none text-sm placeholder:text-zinc-600"/>
            {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15}/></button>}
          </label>
          <button onClick={() => { setActiveId(AI_ID); setMobileChatOpen(true); }} className="mt-4 w-full flex items-center gap-3 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 to-cyan-400/5 p-3.5 text-left hover:border-purple-300/40 transition">
            <div className="relative"><img src={AI_PROFILE.avatar} className="w-11 h-11 rounded-2xl object-cover" alt="Teles AI"/><span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-400 border-2 border-[#0b0d16]"/></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><span className="font-semibold text-sm">Teles AI</span><Sparkles size={13} className="text-purple-300"/></div><p className="text-xs text-zinc-500 mt-1 truncate">Ask, create, plan, or just talk.</p></div>
            <span className="text-[10px] text-purple-200 border border-purple-300/20 rounded-full px-2 py-1">AI</span>
          </button>
        </div>
        <div className="px-5 pb-2 flex items-center justify-between"><span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-bold">Recent conversations</span><span className="text-[11px] text-zinc-600">{visibleRooms.length}</span></div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {visibleRooms.length === 0 ? <div className="mx-3 mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center"><MessageCircle className="mx-auto text-zinc-600" size={24}/><p className="text-sm text-zinc-400 mt-3">No conversations yet</p><p className="text-xs text-zinc-600 mt-1">Start a chat and your conversations will appear here.</p><button onClick={openNewChat} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/15">Find people</button></div> : visibleRooms.map(room => {
            const p: any = partnerFor(room); const unread = Boolean(room.unreadBy?.includes(currentUser?.uid || ''));
            return <button key={room.id} onClick={() => { setActiveId(room.id); setMobileChatOpen(true); setError(''); updateDoc(doc(db, 'chats', room.id), { unreadBy: arrayRemove(currentUser?.uid) }).catch(() => {}); }} className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition mb-1 ${activeId === room.id ? 'bg-cyan-300/[0.09] border border-cyan-200/15' : 'border border-transparent hover:bg-white/[0.035]'}`}>
              <div className="relative flex-shrink-0"><img src={p.avatar || FALLBACK_AVATAR} alt="" className="w-12 h-12 rounded-2xl object-cover bg-zinc-800"/><span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0b0d16]"/></div>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm truncate">{p.displayName || p.username}</span><span className={`text-[10px] flex-shrink-0 ${unread ? 'text-cyan-200' : 'text-zinc-600'}`}>{timeLabel(room.updatedAt)}</span></div><div className="flex items-center gap-1 mt-1 min-w-0"><p className={`text-xs truncate flex-1 ${unread ? 'text-cyan-200 font-medium' : 'text-zinc-500'}`}>{room.lastSenderId === currentUser?.uid ? 'You: ' : ''}{room.lastMessage || 'Say hello 👋'}</p>{room.lastSenderId === currentUser?.uid && <CheckCheck size={13} className={`flex-shrink-0 ${unread ? 'text-zinc-500' : 'text-cyan-300'}`} aria-label={unread ? 'Sent' : 'Delivered'} />}</div></div>
              {unread && <span className="w-2 h-2 rounded-full bg-cyan-300 flex-shrink-0"/>}
            </button>;
          })}
        </div>
        <div className="px-5 py-3 border-t border-white/[0.07] flex items-center gap-3"><img src={currentUser?.avatar || FALLBACK_AVATAR} alt="" className="w-8 h-8 rounded-full object-cover"/><div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{currentUser?.displayName || currentUser?.username || 'Nightgram member'}</p><p className="text-[10px] text-zinc-600">Private conversations</p></div><ShieldCheck size={17} className="text-emerald-400"/></div>
      </aside>

      <section className={`min-w-0 flex-1 flex-col relative ${mobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
        <header className="h-[76px] flex-shrink-0 border-b border-white/[0.08] px-4 sm:px-6 flex items-center gap-3 bg-[#0a0b13]/90 backdrop-blur-xl">
          <button onClick={() => setMobileChatOpen(false)} className="md:hidden p-2 rounded-xl hover:bg-white/10" aria-label="Back to conversations"><ArrowLeft size={19}/></button>
          <div className="relative"><img src={activePartner.avatar || FALLBACK_AVATAR} alt="" className="w-11 h-11 rounded-2xl object-cover"/><span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0b13]"/></div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-semibold text-sm sm:text-base truncate">{activePartner.displayName || activePartner.username}</h2>{activeId === AI_ID && <Sparkles size={14} className="text-purple-300"/>}</div><p className="text-[11px] text-emerald-300 mt-1">{activeId === AI_ID ? 'AI companion · ready to help' : 'Nightgram chat'}</p></div>
          <button onClick={onOpenAppSettings} className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5" title="Chat settings"><MoreHorizontal size={19}/></button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-4">
          <div className="mx-auto max-w-sm text-center mb-7"><div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-zinc-500"><ShieldCheck size={12} className="text-emerald-400"/> Messages stay in this conversation</div><p className="text-[11px] text-zinc-600 mt-3">A little space to connect, share, and be yourself.</p></div>
          {renderedMessages.length === 0 && !aiTyping && <div className="h-[35%] min-h-40 flex flex-col items-center justify-center text-center"><div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-300/15 to-purple-400/15 border border-white/10 flex items-center justify-center"><MessageCircle size={27} className="text-cyan-200"/></div><h3 className="font-semibold mt-4">Start with a hello</h3><p className="text-xs text-zinc-500 mt-2 max-w-xs">{activeId === AI_ID ? 'Ask Teles AI a question or share what you are working on.' : `Send a message to ${activePartner.displayName || activePartner.username}.`}</p><button onClick={() => { setText('Hey 👋'); inputRef.current?.focus(); }} className="mt-4 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-300/15">Say hello 👋</button></div>}
          {renderedMessages.map((msg, idx) => {
            const mine = msg.senderId === currentUser?.uid || msg.senderId === 'me' || (msg as any).sender === 'me';
            const prev = renderedMessages[idx - 1];
            const showName = !mine && (!prev || prev.senderId !== msg.senderId);
            return <motion.div key={msg.id} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}>
              {!mine && <img src={msg.senderAvatar || activePartner.avatar || FALLBACK_AVATAR} alt="" className={`w-7 h-7 rounded-xl object-cover self-end ${showName ? '' : 'invisible'}`}/>}
              <div className={`max-w-[84%] sm:max-w-[70%] min-w-0 ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && <span className="text-[10px] text-zinc-500 mb-1 px-1">{msg.senderName || activePartner.displayName}</span>}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${mine ? 'bg-gradient-to-br from-cyan-300 to-cyan-500 text-slate-950 rounded-br-md shadow-lg shadow-cyan-950/20' : 'bg-white/[0.07] border border-white/[0.06] text-zinc-100 rounded-bl-md'}`}>
                  {msg.imageUrl && <img src={msg.imageUrl} alt="Shared attachment" className="max-w-full max-h-72 rounded-xl mb-2 object-contain"/>}
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
                <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-zinc-600">{timeLabel(msg.createdAt) || msg.timestampFormatted || ''}{mine && <CheckCheck size={12} className="text-cyan-400"/>}</div>
              </div>
            </motion.div>;
          })}
          {aiTyping && <div className="flex items-center gap-2 text-xs text-zinc-500"><div className="flex gap-1 rounded-2xl bg-white/[0.06] px-4 py-3"><i className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce"/><i className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce [animation-delay:120ms]"/><i className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-bounce [animation-delay:240ms]"/></div>Teles AI is thinking…</div>}
          <div ref={endRef}/>
        </div>

        {error && <div className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 px-3 py-2 text-xs text-rose-200"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={14}/></button></div>}
        <form onSubmit={send} className="flex-shrink-0 p-3 sm:p-5 pt-2 border-t border-white/[0.07] bg-[#0a0b13]">
          {attachPreview && <div className="mb-3 inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-2"><img src={attachPreview} alt="Attachment preview" className="w-16 h-16 rounded-lg object-cover"/><button type="button" onClick={() => setAttachPreview(null)} className="p-1 rounded-full bg-black/60"><X size={13}/></button></div>}
          {showEmoji && <div className="mb-2 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#121420] p-2">{emojis.map(emoji => <button key={emoji} type="button" onClick={() => setText(t => t + emoji)} className="rounded-lg p-2 hover:bg-white/10 text-lg">{emoji}</button>)}</div>}
          <div className="flex items-end gap-2 rounded-[22px] border border-white/10 bg-white/[0.045] p-2 focus-within:border-cyan-300/35 transition">
            <button type="button" onClick={() => fileRef.current?.click()} title="Attach image" className="p-2.5 rounded-xl text-zinc-500 hover:text-cyan-200 hover:bg-white/5"><Paperclip size={18}/></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => pickImage(e.target.files?.[0])}/>
            <button type="button" onClick={() => setShowEmoji(v => !v)} title="Emoji" className="p-2.5 rounded-xl text-zinc-500 hover:text-cyan-200 hover:bg-white/5"><Smile size={18}/></button>
            <textarea ref={inputRef} rows={1} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message…" className="flex-1 resize-none max-h-32 min-h-[42px] py-3 bg-transparent outline-none text-sm placeholder:text-zinc-600" />
            <button type="submit" disabled={sending || (!text.trim() && !attachPreview)} className="h-11 w-11 flex-shrink-0 rounded-2xl bg-cyan-300 text-slate-950 flex items-center justify-center hover:bg-cyan-200 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-950/30" title="Send message">{sending ? <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin"/> : <Send size={18}/>}</button>
          </div>
          <div className="flex items-center justify-between px-2 mt-2"><span className="text-[10px] text-zinc-600">Enter to send · Shift + Enter for a new line</span><span className="text-[10px] text-zinc-700 flex items-center gap-1"><ShieldCheck size={11}/> Private chat</span></div>
        </form>
      </section>

      <AnimatePresence>
        {showNewChat && <motion.div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) setShowNewChat(false); }}>
          <motion.div initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10121d] shadow-2xl overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-white/[0.08]"><div><h3 className="font-semibold text-lg">Start a conversation</h3><p className="text-xs text-zinc-500 mt-1">Find someone on Nightgram.</p></div><button onClick={() => setShowNewChat(false)} className="p-2 rounded-xl hover:bg-white/10"><X size={18}/></button></div>
            <div className="p-4"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"><Search size={16} className="text-zinc-500"/><input autoFocus value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search name or username" className="flex-1 bg-transparent outline-none text-sm"/></div></div>
            <div className="max-h-[55vh] overflow-y-auto px-2 pb-3">{loadingUsers ? <div className="p-8 text-center text-sm text-zinc-500">Finding people…</div> : visibleUsers.length ? visibleUsers.map(user => <button key={user.uid} onClick={() => openRoom(user.uid!, user)} className="w-full p-3 rounded-2xl flex items-center gap-3 text-left hover:bg-white/5"><img src={user.avatar || FALLBACK_AVATAR} alt="" className="w-11 h-11 rounded-2xl object-cover"/><span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{user.displayName}</span><span className="block text-xs text-zinc-500 mt-1">@{user.username}</span></span><MessageCircle size={17} className="text-cyan-200"/></button>) : <p className="p-8 text-center text-sm text-zinc-500">{users.length ? 'No matching people found.' : 'No other users found yet.'}</p>}</div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
