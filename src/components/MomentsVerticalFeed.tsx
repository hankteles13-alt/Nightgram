import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock3, LoaderCircle, MessageCircle, Pause, Play, Plus, Send, Volume2, VolumeX, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type MomentItem = {
  id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  caption: string;
  visibility: 'public' | 'private';
  created_at: string;
  expires_at: string;
  signedUrl: string;
};

type MomentComment = { id: string; moment_id: string; user_id: string; content: string; created_at: string };
type Props = { onClose: () => void; onAddMoment: () => void; currentUserId?: string };

function expiryLabel(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Ending now';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.max(1, Math.floor((ms % 3600000) / 60000));
  return hours > 0 ? `Disappears in ${hours}h ${minutes}m` : `Disappears in ${minutes}m`;
}

export default function MomentsVerticalFeed({ onClose, onAddMoment, currentUserId }: Props) {
  const [moments, setMoments] = useState<MomentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(true);
  const [pausedIds, setPausedIds] = useState<string[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const [commentsMomentId, setCommentsMomentId] = useState<string | null>(null);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authenticatedUserId = authData.user?.id || '';
      if (authError || !authenticatedUserId) {
        if (!cancelled) {
          setMoments([]);
          setError('Please sign in to view Moments.');
          setLoading(false);
        }
        return;
      }
      const { data, error: queryError } = await supabase
        .from('nightgram_moments')
        .select('id,user_id,storage_path,media_type,caption,visibility,created_at,expires_at')
        .gt('expires_at', new Date().toISOString())
        // Show public Moments and private Moments owned by the signed-in user.
        .or(`visibility.eq.public,user_id.eq.${authenticatedUserId}`)
        .order('created_at', { ascending: false })
        .limit(60);
      if (queryError) {
        if (!cancelled) { setError('Moments could not be loaded. Please check your connection and sign-in.'); setLoading(false); }
        return;
      }
      const rows = data || [];
      const signedRows = await Promise.all(rows.map(async (moment) => {
        const { data: signed } = await supabase.storage.from('nightgram-moments').createSignedUrl(moment.storage_path, 3600);
        return signed?.signedUrl ? { ...moment, signedUrl: signed.signedUrl } as MomentItem : null;
      }));
      if (!cancelled) {
        setMoments(signedRows.filter((item): item is MomentItem => item !== null));
        setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; videoRefs.current.forEach(video => video.pause()); videoRefs.current.clear(); };
  }, []);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || !moments.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!(video instanceof HTMLVideoElement)) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          video.muted = muted;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { root, threshold: [0, 0.7, 1] });
    root.querySelectorAll('.ngm-slide').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [moments, muted]);

  const togglePause = (id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
      setPausedIds(ids => ids.filter(value => value !== id));
    } else {
      video.pause();
      setPausedIds(ids => ids.includes(id) ? ids : [...ids, id]);
    }
  };

  const loadComments = async (momentId: string) => {
    setCommentsLoading(true);
    setCommentError('');
    const { data, error: queryError } = await supabase
      .from('moment_comments')
      .select('id,moment_id,user_id,content,created_at')
      .eq('moment_id', momentId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (queryError) {
      setCommentError('Comments could not be loaded. Please try again.');
      setComments([]);
    } else {
      setComments((data || []) as MomentComment[]);
    }
    setCommentsLoading(false);
  };

  const openComments = (momentId: string) => {
    setCommentsMomentId(momentId);
    setCommentDraft('');
    void loadComments(momentId);
  };

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = commentDraft.trim();
    const momentId = commentsMomentId;
    if (!momentId || !text || commentSending) return;
    if (text.length > 500) {
      setCommentError('Comments must be 500 characters or fewer.');
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    const authorId = authData.user?.id || currentUserId;
    if (!authorId) {
      setCommentError('Please sign in to comment.');
      return;
    }
    setCommentSending(true);
    setCommentError('');
    const { error: insertError } = await supabase.from('moment_comments').insert({
      moment_id: momentId,
      user_id: authorId,
      content: text,
    });
    if (insertError) {
      setCommentError('Your comment could not be sent. Please try again.');
    } else {
      setCommentDraft('');
      await loadComments(momentId);
    }
    setCommentSending(false);
  };

  const scrollBySlide = (direction: number) => {
    const root = feedRef.current;
    if (root) root.scrollBy({ top: direction * root.clientHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative isolate h-full min-h-0 w-full flex-1 overflow-hidden bg-gradient-to-br from-violet-950 via-slate-950 to-cyan-950 text-white" aria-label="Moments feed">
      <button type="button" onClick={onClose} aria-label="Close Moments feed" className="absolute left-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 backdrop-blur"><ArrowLeft className="h-5 w-5" /></button>
      <button type="button" onClick={onAddMoment} aria-label="Add a Moment" title="Add a Moment" className="absolute right-3 top-3 z-30 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-lg shadow-cyan-950/40 ring-2 ring-white/20 transition hover:scale-105"><Plus className="h-7 w-7" /></button>
      {loading ? (
        <div className="grid h-full min-h-0 place-items-center text-zinc-300"><div className="flex items-center gap-2"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading Moments…</div></div>
      ) : error ? (
        <div className="grid h-full min-h-0 place-items-center px-6 text-center"><div><p className="text-lg font-semibold">{error}</p><button onClick={onClose} className="mt-4 rounded-xl border border-zinc-700 px-4 py-2">Back to Moments</button></div></div>
      ) : moments.length === 0 ? (
        <div className="grid h-full place-items-center px-6 text-center"><div><p className="text-xl font-bold">No active Moments yet</p><p className="mt-2 text-sm text-zinc-400">Share a photo or video to start the feed.</p><button onClick={onClose} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-black">Back to Moments</button></div></div>
      ) : (
        <div ref={feedRef} tabIndex={0} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); scrollBySlide(1); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); scrollBySlide(-1); } }} className="h-full min-h-0 overflow-y-auto snap-y snap-mandatory overscroll-contain [scrollbar-width:none]">
          {moments.map(moment => (
            <section key={moment.id} className="ngm-slide relative flex h-full min-h-full snap-start snap-always items-center justify-center overflow-hidden bg-gradient-to-br from-violet-950 via-slate-950 to-cyan-950">
              {moment.media_type === 'video' ? (
                <video ref={node => { if (node) videoRefs.current.set(moment.id, node); else videoRefs.current.delete(moment.id); }} src={moment.signedUrl} playsInline loop muted={muted} preload="metadata" onClick={() => togglePause(moment.id)} className="absolute inset-0 h-full w-full object-contain" />
              ) : <img src={moment.signedUrl} alt={moment.caption || 'Nightgram Moment'} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-16 z-10 space-y-1.5 pb-[env(safe-area-inset-bottom)]">
                <p className="text-sm font-semibold">{moment.user_id === currentUserId ? 'Your Moment' : 'Nightgram Moment'}</p>
                {moment.caption && <p className="max-h-24 overflow-hidden text-sm leading-5">{moment.caption}</p>}
                <p className="flex items-center gap-1 text-xs text-white/75"><Clock3 className="h-3.5 w-3.5" />{expiryLabel(moment.expires_at)}</p>
              </div>
              <div className="absolute bottom-3 right-2 z-10 flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]">
                {moment.media_type === 'video' && <>
                  <button type="button" onClick={() => togglePause(moment.id)} aria-label={pausedIds.includes(moment.id) ? 'Play video' : 'Pause video'} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-xl backdrop-blur">{pausedIds.includes(moment.id) ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>
                  <button type="button" onClick={() => setMuted(value => !value)} aria-label={muted ? 'Unmute videos' : 'Mute videos'} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 backdrop-blur">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
                </>}
                <button type="button" onClick={() => openComments(moment.id)} aria-label="Comment on Moment" title="Comments" className="grid h-12 w-12 place-items-center rounded-full bg-black/65 backdrop-blur hover:bg-black/85"><MessageCircle className="h-5 w-5" /></button>
                <button type="button" onClick={() => scrollBySlide(1)} aria-label="Next Moment" className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-sm font-bold backdrop-blur">↓</button>
              </div>
              {commentsMomentId === moment.id && (
                <div className="absolute inset-x-2 bottom-2 z-20 mx-auto flex h-[min(58%,480px)] max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#101018]/95 text-white shadow-2xl backdrop-blur-xl" onClick={event => event.stopPropagation()}>
                  <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div><h2 className="font-bold">Comments</h2><p className="text-xs text-zinc-400">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p></div>
                    <button type="button" onClick={() => setCommentsMomentId(null)} aria-label="Close comments" className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><X className="h-4 w-4" /></button>
                  </header>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
                    {commentsLoading ? <p className="py-6 text-center text-sm text-zinc-400">Loading comments…</p> : comments.length === 0 ? <p className="py-6 text-center text-sm text-zinc-400">No comments yet. Start the conversation.</p> : comments.map(comment => (
                      <article key={comment.id} className="rounded-xl bg-white/[0.06] px-3 py-2">
                        <div className="mb-1 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-cyan-200">{comment.user_id === currentUserId ? 'You' : 'Nightgram member'}</p><time className="shrink-0 text-[10px] text-zinc-500">{new Date(comment.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>
                        <p className="whitespace-pre-wrap break-words text-sm text-zinc-100">{comment.content}</p>
                      </article>
                    ))}
                  </div>
                  {commentError && <p role="alert" className="px-4 pb-2 text-xs text-rose-300">{commentError}</p>}
                  <form onSubmit={submitComment} className="flex items-end gap-2 border-t border-white/10 p-3">
                    <textarea value={commentDraft} onChange={event => setCommentDraft(event.target.value.slice(0, 500))} placeholder="Write a comment…" rows={1} maxLength={500} className="max-h-24 min-h-10 flex-1 resize-y rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-cyan-400/60" />
                    <button type="submit" disabled={!commentDraft.trim() || commentSending} aria-label="Send comment" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 disabled:opacity-40">{commentSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                  </form>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
