import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen, Plus, LockKeyhole, Globe2, Trash2, X, Sparkles, Clock3, History,
  LoaderCircle, ImagePlus, Video, UploadCloud, PlayCircle, CalendarDays
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type LifeChapter = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  visibility: 'private' | 'public';
  created_at: string;
  updated_at: string;
};

type ChapterMemory = {
  id: string;
  chapter_id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  caption: string;
  memory_date: string;
  created_at: string;
  signedUrl?: string;
};

type Props = { currentUser: { uid?: string; id?: string; username?: string; displayName?: string } | null };

const MEDIA_BUCKET = 'life-chapter-media';
const localToday = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

export default function LifeChaptersSection({ currentUser }: Props) {
  const userId = currentUser?.uid || currentUser?.id || '';
  const [chapters, setChapters] = useState<LifeChapter[]>([]);
  const [memories, setMemories] = useState<ChapterMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingChapterId, setUploadingChapterId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [memoryDate, setMemoryDate] = useState(localToday);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadChapters = useCallback(async () => {
    if (!userId) { setChapters([]); setMemories([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('life_chapters')
      .select('*')
      .or(`user_id.eq.${userId},visibility.eq.public`)
      .order('created_at', { ascending: false });
    if (queryError) {
      setError('Could not load Life Chapters. Please try again.');
      setLoading(false);
      return;
    }
    const chapterRows = (data || []) as LifeChapter[];
    setChapters(chapterRows);

    const { data: memoryRows, error: memoryError } = await supabase
      .from('life_chapter_memories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!memoryError && memoryRows) {
      const withUrls = await Promise.all((memoryRows as ChapterMemory[]).map(async (memory) => {
        const { data: signed } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(memory.storage_path, 60 * 60);
        return { ...memory, signedUrl: signed?.signedUrl };
      }));
      setMemories(withUrls);
    } else if (memoryError && !memoryError.message.toLowerCase().includes('life_chapter_memories')) {
      setError('Your chapters loaded, but their photos and videos could not be loaded.');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void loadChapters(); }, [loadChapters]);

  const createChapter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !title.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    const { error: insertError } = await supabase.from('life_chapters').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      visibility,
    });
    setSaving(false);
    if (insertError) {
      setError('Could not save this chapter. Make sure you are signed in, then try again.');
      return;
    }
    setTitle('');
    setDescription('');
    setVisibility('private');
    setShowForm(false);
    setNotice('Your chapter has been saved.');
    await loadChapters();
  };

  const uploadMemory = async (chapter: LifeChapter, file?: File) => {
    if (!file) return;
    setError('');
    setNotice('');
    if (chapter.user_id !== userId) {
      setError('You can only add memories to your own chapters.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('That file is larger than 50 MB. Please choose a smaller file.');
      return;
    }

    setUploadingChapterId(chapter.id);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'memory';
    const storagePath = `${userId}/${chapter.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) {
      setUploadingChapterId('');
      setError('Could not upload this file. Check your connection and try again.');
      return;
    }

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const { error: rowError } = await supabase.from('life_chapter_memories').insert({
      chapter_id: chapter.id,
      user_id: userId,
      storage_path: storagePath,
      media_type: mediaType,
      caption: '',
      memory_date: memoryDate,
    });
    if (rowError) {
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      setUploadingChapterId('');
      setError('The file uploaded, but its memory record could not be saved. Please try again.');
      return;
    }
    setUploadingChapterId('');
    setNotice(`${mediaType === 'video' ? 'Video' : 'Photo'} memory added to ${chapter.title} for ${new Date(`${memoryDate}T12:00:00`).toLocaleDateString()}.`);
    await loadChapters();
  };

  const deleteMemory = async (memory: ChapterMemory) => {
    if (memory.user_id !== userId) return;
    if (!window.confirm('Delete this photo or video memory?')) return;
    setError('');
    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([memory.storage_path]);
    if (storageError) {
      setError('Could not delete this file. Please try again.');
      return;
    }
    const { error: rowError } = await supabase.from('life_chapter_memories').delete().eq('id', memory.id).eq('user_id', userId);
    if (rowError) {
      setError('The file was removed, but its record could not be deleted. Refresh the page.');
      return;
    }
    setMemories((items) => items.filter((item) => item.id !== memory.id));
    setNotice('Memory deleted.');
  };

  const deleteChapter = async (chapter: LifeChapter) => {
    if (chapter.user_id !== userId) return;
    if (!window.confirm(`Delete “${chapter.title}”? This cannot be undone.`)) return;
    const chapterMemories = memories.filter((memory) => memory.chapter_id === chapter.id);
    if (chapterMemories.length) {
      const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove(chapterMemories.map((memory) => memory.storage_path));
      if (storageError) { setError('Could not remove this chapter’s media. Please try again.'); return; }
    }
    const { error: deleteError } = await supabase.from('life_chapters').delete().eq('id', chapter.id).eq('user_id', userId);
    if (deleteError) { setError('Could not delete this chapter. Please try again.'); return; }
    setChapters((items) => items.filter((item) => item.id !== chapter.id));
    setMemories((items) => items.filter((item) => item.chapter_id !== chapter.id));
    setNotice('Chapter deleted.');
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#111425] via-[#10101b] to-[#1a1025] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" /> Your story, your way
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Life Chapters</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-300">
              Keep your journey in one place. Create chapters and add the photos and videos you want to remember.
            </p>
          </div>
          <button onClick={() => { setShowForm((value) => !value); setError(''); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:brightness-110">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Create a chapter'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createChapter} className="mb-6 rounded-2xl border border-zinc-800 bg-[#0d0d15] p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Start a new chapter</h3>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="chapter-title">Chapter title</label>
          <input id="chapter-title" required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. My School Memories" className="mb-4 w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400" />
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="chapter-description">What is this chapter about?</label>
          <textarea id="chapter-description" maxLength={2000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Write about the memories, people, or goals you want to collect here..." className="mb-4 w-full resize-y rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400" />
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="chapter-privacy">Who can see this chapter?</label>
          <select id="chapter-privacy" value={visibility} onChange={(event) => setVisibility(event.target.value as 'private' | 'public')} className="mb-5 w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400">
            <option value="private">Private — only me</option>
            <option value="public">Public — visible to Nightgram users</option>
          </select>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">New chapters are private by default. Each file can be up to 50 MB.</p>
            <button disabled={saving || !title.trim()} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} {saving ? 'Saving…' : 'Save chapter'}
            </button>
          </div>
        </form>
      )}

      {error && <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-400"><LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" /> Loading your chapters…</div>
      ) : chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-white/[0.02] px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><BookOpen className="h-7 w-7 text-cyan-300" /></div>
          <h3 className="text-lg font-bold text-white">Your story starts here</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">Create your first Life Chapter, then add photos or videos. Keep it private or share it publicly.</p>
          <button onClick={() => setShowForm(true)} className="mt-5 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10">Create your first chapter</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter) => {
            const ownChapter = chapter.user_id === userId;
            const chapterMemories = memories.filter((memory) => memory.chapter_id === chapter.id);
            return (
              <article key={chapter.id} className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c13] transition hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20">
                <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15"><BookOpen className="h-5 w-5 text-cyan-300" /></div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${chapter.visibility === 'public' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-zinc-800 text-zinc-300'}`}>
                        {chapter.visibility === 'public' ? <Globe2 className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
                        {chapter.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                      {ownChapter && <button aria-label={`Delete ${chapter.title}`} title="Delete chapter" onClick={() => void deleteChapter(chapter)} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </div>
                  <h3 className="break-words text-lg font-bold text-white">{chapter.title}</h3>
                  <p className="mt-2 min-h-12 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">{chapter.description || 'A new chapter in the story of your life.'}</p>

                  {chapterMemories.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {chapterMemories.map((memory) => (
                        <div key={memory.id} className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
                          {memory.signedUrl ? (memory.media_type === 'video' ? (
                            <video src={memory.signedUrl} controls preload="metadata" className="aspect-square w-full object-cover" aria-label="Video memory" />
                          ) : (
                            <a href={memory.signedUrl} target="_blank" rel="noreferrer" aria-label="Open photo memory">
                              <img src={memory.signedUrl} alt="Life Chapter memory" loading="lazy" className="aspect-square w-full object-cover" />
                            </a>
                          )) : <div className="flex aspect-square items-center justify-center text-zinc-500"><ImagePlus className="h-5 w-5" /></div>}
                          {ownChapter && <button onClick={() => void deleteMemory(memory)} aria-label="Delete memory" title="Delete memory" className="absolute right-1 top-1 rounded-lg bg-black/75 p-1.5 text-white hover:bg-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                          {memory.media_type === 'video' && <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[10px] text-white"><PlayCircle className="h-3 w-3" /> Video</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {ownChapter && (
                    <div className="mt-4">

                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500" htmlFor={`memory-date-${chapter.id}`}>Memory date</label>
                      <input id={`memory-date-${chapter.id}`} type="date" value={memoryDate} max={localToday()} onChange={(event) => setMemoryDate(event.target.value || localToday())} className="mb-3 w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-cyan-400" />
                      <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-400/[0.04] px-3 py-3 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10 ${uploadingChapterId === chapter.id ? 'pointer-events-none opacity-60' : ''}`}>
                        {uploadingChapterId === chapter.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {uploadingChapterId === chapter.id ? 'Uploading…' : 'Add photo or video'}
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="sr-only" disabled={!!uploadingChapterId} onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          void uploadMemory(chapter, file);
                        }} />
                      </label>
                      <p className="mt-1.5 text-center text-[10px] text-zinc-600"><ImagePlus className="mr-1 inline h-3 w-3" /><Video className="mr-1 inline h-3 w-3" /> Images and videos up to 50 MB</p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
                    <span>{ownChapter ? 'Your chapter' : 'Shared by a Nightgram member'}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{new Date(chapter.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && memories.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10"><History className="h-5 w-5 text-violet-300" /></div>
            <div>
              <h3 className="text-xl font-black text-white">Your Life Timeline</h3>
              <p className="text-xs text-zinc-500">Your photos and videos, arranged by the date you choose.</p>
            </div>
          </div>
          <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-gradient-to-b before:from-cyan-400/60 before:to-violet-500/10">
            {[...memories].sort((a, b) => (b.memory_date || b.created_at.slice(0, 10)).localeCompare(a.memory_date || a.created_at.slice(0, 10))).map((memory) => {
              const chapter = chapters.find((item) => item.id === memory.chapter_id);
              if (!chapter) return null;
              return (
                <article key={memory.id} className="relative pl-10">
                  <span className="absolute left-[9px] top-5 h-3.5 w-3.5 rounded-full border-2 border-cyan-300 bg-[#10101b] shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
                  <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-[#0c0c13] p-4 sm:flex-row sm:items-center">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-black/40 sm:w-32">
                      {memory.signedUrl && (memory.media_type === 'video' ? (
                        <video src={memory.signedUrl} controls preload="metadata" className="h-full max-h-32 w-full object-cover" aria-label="Timeline video memory" />
                      ) : (
                        <a href={memory.signedUrl} target="_blank" rel="noreferrer" aria-label="Open timeline photo">
                          <img src={memory.signedUrl} alt="Timeline memory" loading="lazy" className="h-24 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${memory.memory_date || memory.created_at.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <h4 className="mt-1 break-words font-bold text-white">{chapter.title}</h4>
                      <p className="mt-1 text-xs text-zinc-500">{memory.media_type === 'video' ? 'Video memory' : 'Photo memory'} · Added {new Date(memory.created_at).toLocaleDateString()}</p>
                    </div>
                    {memory.user_id === userId && <button onClick={() => void deleteMemory(memory)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-rose-500/40 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-[11px] leading-5 text-zinc-600">Your memories belong to you. Private chapter media is stored in a private bucket and requires authorization to view.</p>
    </div>
  );
}
