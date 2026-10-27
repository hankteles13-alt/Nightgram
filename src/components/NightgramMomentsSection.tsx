import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, Clock3, Moon, ImagePlus, LoaderCircle, LockKeyhole, MessageCircle, Plus, RefreshCw,
  Trash2, UploadCloud, Users, Video, Volume2, VolumeX, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CirclesManager from './CirclesManager';

type Moment = {
  id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  caption: string;
  visibility: 'public' | 'private' | 'circle';
  created_at: string;
  expires_at: string;
  duration_ms: number | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_mine: boolean;
  seen: boolean;
  signedUrl?: string;
};

type Circle = { id: string; name: string };

type ChatUser = { uid?: string; username: string; displayName?: string; avatar?: string };

type Props = {
  currentUser: { uid?: string; id?: string; username?: string; displayName?: string } | null;
  onOpenChatWithUser?: (user: ChatUser) => void;
};

const BUCKET = 'nightgram-moments';
const MAX_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_MS = 60_000;
const PAGE_SIZE = 8;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
const HIDE_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Ending now';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.max(1, Math.floor((ms % 3600000) / 60000));
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

function localDate() {
  // YYYY-MM-DD in the viewer's own timezone, so "tonight" and "on this day" match their clock.
  return new Date().toLocaleDateString('en-CA');
}

function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const finish = (value: number | null) => { URL.revokeObjectURL(url); resolve(value); };
    const timer = window.setTimeout(() => finish(null), 8000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null);
    };
    video.onerror = () => { window.clearTimeout(timer); finish(null); };
    video.src = url;
  });
}

function fitMedia(el: HTMLVideoElement | HTMLImageElement) {
  const w = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
  const h = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
  // Tall media fills the screen; wide media is shown whole instead of being cropped.
  el.style.objectFit = w > h ? 'contain' : 'cover';
}

export default function NightgramMomentsSection({ currentUser, onOpenChatWithUser }: Props) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [userId, setUserId] = useState('');
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedId, setPausedId] = useState<string | null>(null);
  const [lowData, setLowData] = useState(false);
  const [lang, setLang] = useState('en');

  const [composerOpen, setComposerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<string>('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [prompt, setPrompt] = useState('');
  const [showCircles, setShowCircles] = useState(false);
  const [awakeUntil, setAwakeUntil] = useState<number>(0);
  const [circlesTick, setCirclesTick] = useState(0);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const seenSent = useRef<Set<string>>(new Set());
  const cursorRef = useRef<Moment | null>(null);
  const loadingRef = useRef(false);
  const doneRef = useRef(false);
  const rafRef = useRef(0);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (loadingRef.current) return;
    if (!reset && doneRef.current) return;
    loadingRef.current = true;
    if (reset) { setLoading(true); } else { setLoadingMore(true); }
    setError('');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id || '';
      setUserId(uid);
      if (!uid) {
        setMoments([]);
        setError('Please sign in to view and share Moments.');
        return;
      }
      if (reset) { cursorRef.current = null; doneRef.current = false; setDone(false); }

      const args: Record<string, unknown> = { p_limit: PAGE_SIZE };
      if (!reset && cursorRef.current) {
        args.p_after_seen = cursorRef.current.seen;
        args.p_after_created = cursorRef.current.created_at;
        args.p_after_id = cursorRef.current.id;
      }
      const { data, error: rpcError } = await supabase.rpc('moments_feed', args);
      if (rpcError) throw rpcError;
      const rows = (data || []) as Moment[];

      let withUrls: Moment[] = [];
      if (rows.length) {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), 3600);
        const urlByPath = new Map<string, string>();
        (signed || []).forEach((s: { path: string | null; signedUrl: string }) => { if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl); });
        withUrls = rows.map((r) => ({ ...r, signedUrl: urlByPath.get(r.storage_path) || '' }));
        cursorRef.current = rows[rows.length - 1];
      }
      if (rows.length < PAGE_SIZE) { doneRef.current = true; setDone(true); }

      setMoments((prev) => {
        if (reset) return withUrls;
        const known = new Set(prev.map((m) => m.id));
        return [...prev, ...withUrls.filter((m) => !known.has(m.id))];
      });
    } catch (e) {
      console.error('[moments] load failed', e);
      setError('Moments could not be loaded. Check your connection and try again.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void fetchPage(true); }, [fetchPage, currentUser?.uid, currentUser?.id]);

  // Viewer preferences: data saver and language for tonight's prompt.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('preferred_language,low_data_mode').eq('id', userId).maybeSingle();
      if (cancelled || !data) return;
      setLowData(!!data.low_data_mode);
      if (data.preferred_language) setLang(String(data.preferred_language));
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Night presence: tell people who follow you that you're awake (auto-expires after 2 hours).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase.from('night_presence').select('awake_until').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (!cancelled && data?.awake_until) setAwakeUntil(new Date(data.awake_until).getTime());
    });
    return () => { cancelled = true; };
  }, [userId]);

  const isAwake = awakeUntil > Date.now();
  const toggleAwake = async () => {
    if (!userId) return;
    const now = new Date();
    const next = isAwake ? now : new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const { error: presenceError } = await supabase.from('night_presence').upsert({ user_id: userId, awake_until: next.toISOString(), updated_at: now.toISOString() });
    if (presenceError) { setError('Could not update your awake status.'); return; }
    setAwakeUntil(isAwake ? 0 : next.getTime());
    setNotice(isAwake ? 'You are no longer shown as awake.' : 'People who follow you can see you are awake for the next 2 hours.');
  };

  // When the share sheet opens: load my circles and tonight's prompt.
  useEffect(() => {
    if (!composerOpen || !userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: circleRows }, { data: promptText }] = await Promise.all([
        supabase.from('circles').select('id,name').eq('owner_id', userId).order('created_at', { ascending: true }),
        supabase.rpc('tonight_prompt', { p_lang: lang, p_today: localDate() }),
      ]);
      if (cancelled) return;
      setCircles((circleRows || []) as Circle[]);
      setPrompt(typeof promptText === 'string' ? promptText : '');
    })();
    return () => { cancelled = true; };
  }, [composerOpen, userId, lang, circlesTick]);

  // Which moment is on screen = how far the feed has scrolled, in whole screens.
  const handleScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = scrollerRef.current;
      if (!el || !el.clientHeight) return;
      const index = Math.round(el.scrollTop / el.clientHeight);
      setActiveIndex((prev) => (prev === index ? prev : index));
    });
  };

  // Play only the visible video; pause and rewind the rest.
  useEffect(() => {
    moments.forEach((m, i) => {
      const v = videoRefs.current.get(m.id);
      if (!v) return;
      v.muted = muted;
      if (i === activeIndex && !composerOpen && pausedId !== m.id) {
        void v.play().catch(() => {});
      } else {
        v.pause();
        if (i !== activeIndex && v.readyState > 0) v.currentTime = 0;
      }
    });
  }, [moments, activeIndex, muted, composerOpen, pausedId]);

  // Keep the next page coming before the viewer reaches the end.
  useEffect(() => {
    if (!loading && !done && moments.length > 0 && activeIndex >= moments.length - 3) void fetchPage(false);
  }, [activeIndex, moments.length, loading, done, fetchPage]);

  // A moment counts as seen after one second on screen.
  useEffect(() => {
    const m = moments[activeIndex];
    if (!m || m.is_mine || !userId || seenSent.current.has(m.id)) return;
    const timer = window.setTimeout(() => {
      seenSent.current.add(m.id);
      void supabase.from('moment_views').upsert(
        { moment_id: m.id, viewer_id: userId },
        { onConflict: 'moment_id,viewer_id', ignoreDuplicates: true },
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, moments, userId]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: 'smooth' }); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' }); }
    else if (e.key === ' ') {
      const m = moments[activeIndex];
      if (m?.media_type === 'video') { e.preventDefault(); setPausedId((p) => (p === m.id ? null : m.id)); }
    }
  };

  const refresh = async () => {
    scrollerRef.current?.scrollTo({ top: 0 });
    setActiveIndex(0);
    setPausedId(null);
    await fetchPage(true);
  };

  const openChat = (m: Moment) => {
    if (!onOpenChatWithUser || !m.username) return;
    onOpenChatWithUser({ uid: m.user_id, username: m.username, displayName: m.display_name || m.username, avatar: m.avatar_url || undefined });
  };

  const deleteMoment = async (m: Moment) => {
    if (!m.is_mine || !window.confirm('Delete this Moment?')) return;
    const { error: delErr } = await supabase.from('nightgram_moments').delete().eq('id', m.id).eq('user_id', userId);
    if (delErr) { setNotice('Could not delete this Moment. Please try again.'); return; }
    await supabase.storage.from(BUCKET).remove([m.storage_path]);
    setMoments((prev) => prev.filter((x) => x.id !== m.id));
    setNotice('Moment deleted.');
  };

  const closeComposer = () => { if (!uploading) setComposerOpen(false); };

  const onPickFile = async (file: File | null) => {
    setError('');
    setSelectedFile(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setError('Use a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.'); return; }
    if (file.size > MAX_SIZE) { setError('The file must be 50 MB or smaller.'); return; }
    if (file.type.startsWith('video/')) {
      const ms = await readVideoDuration(file);
      if (ms !== null && ms > MAX_VIDEO_MS) { setError('Videos can be up to 60 seconds. Trim it and try again.'); return; }
    }
    setSelectedFile(file);
  };

  const shareMoment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!userId) { setError('Please sign in first.'); return; }
    if (!selectedFile) { setError('Choose a photo or video first.'); return; }
    setUploading(true);
    const isVideo = selectedFile.type.startsWith('video/');
    const extension = selectedFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (isVideo ? 'mp4' : 'jpg');
    const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const durationMs = isVideo ? await readVideoDuration(selectedFile) : null;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, selectedFile, {
      contentType: selectedFile.type, cacheControl: '60', upsert: false,
    });
    if (uploadError) { setError(uploadError.message || 'Upload failed. Please try again.'); setUploading(false); return; }

    const isCircle = audience.startsWith('circle:');
    const { error: insertError } = await supabase.from('nightgram_moments').insert({
      user_id: userId,
      storage_path: storagePath,
      media_type: isVideo ? 'video' : 'image',
      caption: caption.trim().slice(0, 300),
      visibility: isCircle ? 'circle' : audience,
      circle_id: isCircle ? audience.slice('circle:'.length) : null,
      duration_ms: durationMs !== null ? Math.min(durationMs, 90_000) : null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (insertError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      setError(insertError.message || 'Could not save the Moment.');
      setUploading(false);
      return;
    }
    setCaption('');
    setSelectedFile(null);
    setComposerOpen(false);
    setUploading(false);
    setNotice('Moment shared. It disappears after 24 hours.');
    await refresh();
  };

  const audienceIcon = (m: Moment) => (m.visibility === 'private'
    ? <span className="inline-flex items-center gap-1"><LockKeyhole className="h-3 w-3" />Only you</span>
    : m.visibility === 'circle'
      ? <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />Circle</span>
      : null);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-black" id="nightgram-moments-feed">
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-200"><Camera className="h-4 w-4" /></div>
          <h1 className="text-base font-black text-white">Moments</h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" onClick={() => void toggleAwake()} aria-pressed={isAwake} aria-label={isAwake ? 'Stop showing me as awake' : 'Show that I am awake tonight'} title={isAwake ? 'You show as awake' : 'Show that you are awake'} className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur ${isAwake ? 'bg-violet-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}><Moon className="h-4 w-4" /></button>
          <button type="button" onClick={() => void refresh()} aria-label="Refresh Moments" className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"><RefreshCw className="h-4 w-4" /></button>
          <button type="button" onClick={() => setComposerOpen(true)} aria-label="Share a Moment" className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg hover:brightness-110"><Plus className="h-5 w-5" /></button>
        </div>
      </div>

      {notice && <p role="status" className="absolute left-1/2 top-16 z-30 max-w-[90%] -translate-x-1/2 rounded-full bg-emerald-950/90 px-4 py-2 text-center text-xs text-emerald-100 shadow-lg">{notice}</p>}

      {loading && moments.length === 0 ? (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading Moments…</div>
      ) : error && moments.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <p role="alert" className="max-w-sm text-sm text-rose-200">{error}</p>
          <button type="button" onClick={() => void refresh()} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-white hover:border-cyan-500/50">Try again</button>
        </div>
      ) : moments.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <Camera className="h-10 w-10 text-zinc-600" />
          <p className="font-semibold text-zinc-200">No Moments right now</p>
          <p className="max-w-xs text-sm text-zinc-500">Be the first to share something tonight. It disappears after 24 hours.</p>
          <button type="button" onClick={() => setComposerOpen(true)} className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110">Share a Moment</button>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="feed"
          aria-label="Moments"
          className={`h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none ${HIDE_SCROLLBAR}`}
        >
          {moments.map((m, i) => {
            const shouldLoad = Math.abs(i - activeIndex) <= (lowData ? 0 : 1);
            const isPaused = pausedId === m.id;
            const name = m.display_name || m.username || 'Nightgram user';
            return (
              <section
                key={m.id}
                role="article"
                aria-label={`Moment by ${name}`}
                onClick={m.media_type === 'video' ? () => setPausedId((p) => (p === m.id ? null : m.id)) : undefined}
                className="relative h-full w-full flex-none snap-start snap-always overflow-hidden bg-[#05060a]"
              >
                {!m.signedUrl ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">Media unavailable</div>
                ) : m.media_type === 'video' ? (
                  <video
                    ref={(el) => { if (el) videoRefs.current.set(m.id, el); else videoRefs.current.delete(m.id); }}
                    src={shouldLoad ? m.signedUrl : undefined}
                    loop
                    playsInline
                    muted={muted}
                    preload={i === activeIndex ? 'auto' : 'metadata'}
                    onLoadedMetadata={(e) => fitMedia(e.currentTarget)}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      const bar = v.parentElement?.querySelector('[data-progress]') as HTMLElement | null;
                      if (bar && v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={shouldLoad ? m.signedUrl : undefined}
                    alt={m.caption || 'Nightgram Moment'}
                    onLoad={(e) => fitMedia(e.currentTarget)}
                    className="h-full w-full object-cover"
                  />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                {isPaused && <div className="pointer-events-none absolute inset-0 grid place-items-center text-6xl text-white/90 drop-shadow-lg" aria-hidden="true">⏸</div>}

                <div className="pointer-events-none absolute bottom-5 left-4 right-20 flex flex-col gap-2 text-white">
                  <div className="flex items-center gap-2.5">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full bg-zinc-800 object-cover" />
                      : <div className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-sm font-bold">{name.slice(0, 1).toUpperCase()}</div>}
                    <span className="text-sm font-semibold drop-shadow">{m.is_mine ? 'You' : name}</span>
                  </div>
                  {m.caption && <p className="max-h-[5.4em] overflow-hidden whitespace-pre-wrap break-words text-sm leading-snug drop-shadow">{m.caption}</p>}
                  <p className="flex items-center gap-2 text-xs text-white/75">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{timeLeft(m.expires_at)}</span>
                    {audienceIcon(m)}
                  </p>
                </div>

                <div className="absolute bottom-5 right-3 flex flex-col gap-3">
                  {m.media_type === 'video' && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setMuted((v) => !v); }} aria-label={muted ? 'Unmute' : 'Mute'} className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75">
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  )}
                  {!m.is_mine && onOpenChatWithUser && m.username && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); openChat(m); }} aria-label={`Message ${name}`} className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"><MessageCircle className="h-5 w-5" /></button>
                  )}
                  {m.is_mine && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); void deleteMoment(m); }} aria-label="Delete this Moment" className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-rose-600/80"><Trash2 className="h-5 w-5" /></button>
                  )}
                </div>

                {m.media_type === 'video' && <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20"><div data-progress className="h-full w-0 bg-white" /></div>}
              </section>
            );
          })}
          {loadingMore && <div className="flex h-16 snap-start items-center justify-center gap-2 text-xs text-zinc-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading more…</div>}
          {done && moments.length > 0 && (
            <section className="flex h-full w-full flex-none snap-start flex-col items-center justify-center gap-3 bg-[#05060a] px-6 text-center">
              <p className="text-lg font-bold text-white">You're all caught up</p>
              <p className="max-w-xs text-sm text-zinc-500">New Moments show up here as people share them tonight.</p>
              <button type="button" onClick={() => void refresh()} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-white hover:border-cyan-500/50">Back to the top</button>
            </section>
          )}
        </div>
      )}

      {/* share sheet */}
      {composerOpen && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" role="dialog" aria-modal="true" aria-label="Share a Moment" onClick={closeComposer}>
          <form onSubmit={shareMoment} onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#0b0b12] p-4 sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-white"><UploadCloud className="h-5 w-5 text-cyan-300" /> Share a Moment</h2>
              <button type="button" onClick={closeComposer} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <label htmlFor="nightgram-moment-file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-black/20 px-4 py-6 text-center transition hover:border-cyan-500/50">
              {selectedFile?.type.startsWith('video/') ? <Video className="h-7 w-7 text-cyan-300" /> : <ImagePlus className="h-7 w-7 text-cyan-300" />}
              <span className="text-sm font-semibold text-zinc-200">{selectedFile ? selectedFile.name : 'Choose a photo or short video'}</span>
              <span className="text-xs text-zinc-500">Videos up to 60 seconds · max 50 MB</span>
              <input id="nightgram-moment-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => void onPickFile(e.target.files?.[0] || null)} />
            </label>
            {prompt && (
              <button type="button" onClick={() => setCaption(prompt.slice(0, 300))} className="mt-3 w-full rounded-xl border border-violet-500/25 bg-violet-950/20 px-3 py-2 text-left text-xs text-violet-200 hover:border-violet-400/50">
                <span className="font-bold uppercase tracking-wider text-violet-300">Tonight · </span>{prompt}<span className="ml-1 text-violet-400">(tap to use)</span>
              </button>
            )}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 300))} placeholder="Add a caption (optional)…" rows={2} className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500/50" />
            <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300"><Users className="h-4 w-4 text-zinc-400" /> Who can see it
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-[#15151f] px-2 py-2 text-sm text-white">
                <option value="public">Everyone signed in</option>
                <option value="private">Only me</option>
                {circles.map((c) => <option key={c.id} value={`circle:${c.id}`}>Circle: {c.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setShowCircles(true)} className="mt-2 text-xs font-semibold text-cyan-300 underline">Manage circles</button>
            {error && <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-sm text-rose-200">{error}</p>}
            <button type="submit" disabled={uploading || !userId || !selectedFile} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{uploading ? 'Sharing…' : 'Share Moment'}
            </button>
            <p className="mt-2 text-center text-xs text-zinc-600">Moments disappear after 24 hours.</p>
          </form>
        </div>
      )}
      {showCircles && userId && <CirclesManager userId={userId} onClose={() => setShowCircles(false)} onChanged={() => setCirclesTick((n) => n + 1)} />}
    </div>
  );
}
