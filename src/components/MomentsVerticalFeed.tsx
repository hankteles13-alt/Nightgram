import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock3, LoaderCircle, Pause, Play, Plus, Volume2, VolumeX } from 'lucide-react';
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      const { data, error: queryError } = await supabase
        .from('nightgram_moments')
        .select('id,user_id,storage_path,media_type,caption,visibility,created_at,expires_at')
        .gt('expires_at', new Date().toISOString())
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

  const scrollBySlide = (direction: number) => {
    const root = feedRef.current;
    if (root) root.scrollBy({ top: direction * root.clientHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#05060a] text-white" aria-label="Full-screen Moments feed">
      <button type="button" onClick={onClose} aria-label="Close Moments feed" className="absolute left-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 backdrop-blur"><ArrowLeft className="h-5 w-5" /></button>
      <button type="button" onClick={onAddMoment} aria-label="Add a Moment" title="Add a Moment" className="absolute right-4 top-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-lg shadow-cyan-950/40 ring-2 ring-white/20 transition hover:scale-105"><Plus className="h-7 w-7" /></button>
      {loading ? (
        <div className="grid h-full place-items-center text-zinc-300"><div className="flex items-center gap-2"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading Moments…</div></div>
      ) : error ? (
        <div className="grid h-full place-items-center px-6 text-center"><div><p className="text-lg font-semibold">{error}</p><button onClick={onClose} className="mt-4 rounded-xl border border-zinc-700 px-4 py-2">Back to Moments</button></div></div>
      ) : moments.length === 0 ? (
        <div className="grid h-full place-items-center px-6 text-center"><div><p className="text-xl font-bold">No active Moments yet</p><p className="mt-2 text-sm text-zinc-400">Share a photo or video to start the feed.</p><button onClick={onClose} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-black">Back to Moments</button></div></div>
      ) : (
        <div ref={feedRef} tabIndex={0} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); scrollBySlide(1); } if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); scrollBySlide(-1); } }} className="h-full overflow-y-auto snap-y snap-mandatory overscroll-contain [scrollbar-width:none]">
          {moments.map(moment => (
            <section key={moment.id} className="ngm-slide relative flex h-[100dvh] snap-start snap-always items-center justify-center overflow-hidden bg-[#05060a]">
              {moment.media_type === 'video' ? (
                <video ref={node => { if (node) videoRefs.current.set(moment.id, node); else videoRefs.current.delete(moment.id); }} src={moment.signedUrl} playsInline loop muted={muted} preload="metadata" onClick={() => togglePause(moment.id)} className="absolute inset-0 h-full w-full object-contain bg-black" />
              ) : <img src={moment.signedUrl} alt={moment.caption || 'Nightgram Moment'} loading="lazy" className="absolute inset-0 h-full w-full object-contain bg-black" />}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-8 left-4 right-20 z-10 space-y-2 pb-[env(safe-area-inset-bottom)]">
                <p className="text-sm font-semibold">{moment.user_id === currentUserId ? 'Your Moment' : 'Nightgram Moment'}</p>
                {moment.caption && <p className="max-h-24 overflow-hidden text-sm leading-5">{moment.caption}</p>}
                <p className="flex items-center gap-1 text-xs text-white/75"><Clock3 className="h-3.5 w-3.5" />{expiryLabel(moment.expires_at)}</p>
              </div>
              <div className="absolute bottom-8 right-3 z-10 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
                {moment.media_type === 'video' && <>
                  <button type="button" onClick={() => togglePause(moment.id)} aria-label={pausedIds.includes(moment.id) ? 'Play video' : 'Pause video'} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-xl backdrop-blur">{pausedIds.includes(moment.id) ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>
                  <button type="button" onClick={() => setMuted(value => !value)} aria-label={muted ? 'Unmute videos' : 'Mute videos'} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 backdrop-blur">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
                </>}
                <button type="button" onClick={() => scrollBySlide(1)} aria-label="Next Moment" className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-sm font-bold backdrop-blur">↓</button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
