import React, { useCallback, useEffect, useState } from 'react';
import { Camera, Clock3, ImagePlus, LoaderCircle, LockKeyhole, Play, Trash2, UploadCloud, Video, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MomentsVerticalFeed from './MomentsVerticalFeed';

type Moment = {
  id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  caption: string;
  visibility: 'public' | 'private';
  created_at: string;
  expires_at: string;
  signedUrl?: string;
};

type Props = { currentUser: { uid?: string; id?: string; username?: string; displayName?: string } | null };
const BUCKET = 'nightgram-moments';
const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.max(1, Math.floor((ms % 3600000) / 60000));
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function NightgramMomentsSection({ currentUser }: Props) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showVerticalFeed, setShowVerticalFeed] = useState(true);

  const loadMoments = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authenticatedUserId = authData.user?.id || '';
    setUserId(authenticatedUserId);
    if (authError || !authenticatedUserId) {
      setMoments([]);
      setLoading(false);
      setError('Please sign in to view and share Moments.');
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
      setMoments([]);
      setError('Moments could not be loaded. Check the database migration and sign-in session.');
      setLoading(false);
      return;
    }

    const rows = (data || []) as Moment[];
    const signedRows = await Promise.all(rows.map(async (moment) => {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(moment.storage_path, 300);
      return { ...moment, signedUrl: signed?.signedUrl || '' };
    }));
    setMoments(signedRows);
    setLoading(false);
  }, []);

  useEffect(() => { void loadMoments(); }, [loadMoments, currentUser?.uid, currentUser?.id]);

  const shareMoment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!userId) { setError('Please sign in first.'); return; }
    if (!selectedFile) { setError('Choose a photo or video first.'); return; }
    if (!ALLOWED_TYPES.includes(selectedFile.type)) { setError('Use a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.'); return; }
    if (selectedFile.size > MAX_SIZE) { setError('The file must be 50 MB or smaller.'); return; }
    setUploading(true);
    const extension = selectedFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (selectedFile.type.startsWith('video/') ? 'mp4' : 'jpg');
    const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, selectedFile, {
      contentType: selectedFile.type,
      cacheControl: '60',
      upsert: false,
    });
    if (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from('nightgram_moments').insert({
      user_id: userId,
      storage_path: storagePath,
      media_type: mediaType,
      caption: caption.trim().slice(0, 300),
      visibility,
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
    const input = document.getElementById('nightgram-moment-file') as HTMLInputElement | null;
    if (input) input.value = '';
    setNotice('Moment shared. It will disappear from the feed after 24 hours.');
    await loadMoments();
    setUploading(false);
    setShowVerticalFeed(true);
  };

  const deleteMoment = async (moment: Moment) => {
    setError('');
    setNotice('');
    if (moment.user_id !== userId) return;
    const { error: deleteRowError } = await supabase.from('nightgram_moments').delete().eq('id', moment.id).eq('user_id', userId);
    if (deleteRowError) { setError('Could not delete this Moment. Please try again.'); return; }
    const { error: deleteFileError } = await supabase.storage.from(BUCKET).remove([moment.storage_path]);
    if (deleteFileError) setNotice('Moment removed from the feed. Its media file could not be removed, so it may need storage cleanup.');
    await loadMoments();
  };

  if (showVerticalFeed) return <MomentsVerticalFeed onClose={() => setShowVerticalFeed(false)} onAddMoment={() => setShowVerticalFeed(false)} currentUserId={userId} />;

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6">
      <header className="mb-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 via-[#10101a] to-violet-950/40 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-200"><Camera className="h-6 w-6" /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Nightgram · 24-hour updates</p><h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Moments</h1></div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Share a photo or short video from your day. Choose whether everyone signed in can see it or keep it private. Active Moments leave the feed after 24 hours.</p>
      </header>

      <form onSubmit={shareMoment} className="mb-7 rounded-2xl border border-zinc-800 bg-[#0b0b12] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold text-white"><UploadCloud className="h-5 w-5 text-cyan-300" /> Share a Moment</h2><button type="button" onClick={() => setShowVerticalFeed(true)} aria-label="Cancel and return to Moments feed" title="Back to Moments" className="grid h-9 w-9 place-items-center rounded-full border border-zinc-700 text-zinc-300 transition hover:border-cyan-400 hover:text-white"><X className="h-4 w-4" /></button></div>
        <label htmlFor="nightgram-moment-file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-black/20 px-4 py-6 text-center transition hover:border-cyan-500/50">
          {selectedFile?.type.startsWith('video/') ? <Video className="h-7 w-7 text-cyan-300" /> : <ImagePlus className="h-7 w-7 text-cyan-300" />}
          <span className="text-sm font-semibold text-zinc-200">{selectedFile ? selectedFile.name : 'Choose a photo or video'}</span>
          <span className="text-xs text-zinc-500">JPG, PNG, WebP, GIF, MP4, WebM, MOV · max 50 MB</span>
          <input id="nightgram-moment-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        </label>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 300))} placeholder="Add a caption (optional)..." rows={2} className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500/50" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-300"><LockKeyhole className="h-4 w-4 text-zinc-400" /> Audience
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')} className="rounded-lg border border-zinc-700 bg-[#15151f] px-2 py-2 text-sm text-white">
              <option value="public">Everyone signed in</option><option value="private">Only me</option>
            </select>
          </label>
          <button type="submit" disabled={uploading || loading || !userId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{uploading ? 'Sharing…' : 'Share Moment'}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-600">Moments are hidden automatically after 24 hours. Expired media files may remain in private storage until a cleanup job is configured.</p>
      </form>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-200">{notice}</p>}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold text-white">Active Moments</h2><div className="flex items-center gap-2"><button onClick={() => setShowVerticalFeed(true)} type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"><Play className="h-3.5 w-3.5" /> Full-screen feed</button><button onClick={() => void loadMoments()} type="button" className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-cyan-500/40">Refresh</button></div></div>
        {loading ? <div className="flex items-center gap-2 py-10 text-sm text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading Moments…</div> : moments.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 px-5 py-12 text-center"><Camera className="mx-auto h-8 w-8 text-zinc-600" /><p className="mt-3 font-semibold text-zinc-300">No active Moments yet</p><p className="mt-1 text-sm text-zinc-500">Share the first one above.</p></div> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((moment) => <article key={moment.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0b0b12]">
              <div className="relative aspect-[4/5] bg-black/40">
                {moment.signedUrl ? (moment.media_type === 'video' ? <video src={moment.signedUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" /> : <a href={moment.signedUrl} target="_blank" rel="noreferrer"><img src={moment.signedUrl} alt={moment.caption || 'Nightgram Moment'} loading="lazy" className="h-full w-full object-contain" /></a>) : <div className="flex h-full items-center justify-center text-sm text-zinc-500">Media unavailable</div>}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white"><Clock3 className="h-3.5 w-3.5" />{timeLeft(moment.expires_at)}</span>
                {moment.visibility === 'private' && <span className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-zinc-200" title="Private Moment"><LockKeyhole className="h-3.5 w-3.5" /></span>}
              </div>
              <div className="p-4"><p className="whitespace-pre-wrap break-words text-sm text-zinc-200">{moment.caption || 'A moment in time.'}</p><p className="mt-2 text-xs text-zinc-600">{moment.user_id === userId ? 'Your Moment' : 'Community Moment'} · {new Date(moment.created_at).toLocaleString()}</p>
                {moment.user_id === userId && <button type="button" onClick={() => void deleteMoment(moment)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:border-rose-500/40 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
              </div>
            </article>)}
          </div>
        )}
      </section>
    </main>
  );
}
