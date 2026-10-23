import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Plus, LockKeyhole, Globe2, Trash2, X, Sparkles, Clock3, LoaderCircle } from 'lucide-react';
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

type Props = { currentUser: { uid?: string; id?: string; username?: string; displayName?: string } | null };

export default function LifeChaptersSection({ currentUser }: Props) {
  const userId = currentUser?.uid || currentUser?.id || '';
  const [chapters, setChapters] = useState<LifeChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadChapters = useCallback(async () => {
    if (!userId) { setChapters([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('life_chapters')
      .select('*')
      .or(`user_id.eq.${userId},visibility.eq.public`)
      .order('created_at', { ascending: false });
    if (queryError) setError('Could not load Life Chapters. Please try again.');
    else setChapters((data || []) as LifeChapter[]);
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
      setError(insertError.message.includes('life_chapters')
        ? 'Life Chapters are not available yet. Please refresh and try again.'
        : 'Could not save this chapter. Please try again.');
      return;
    }
    setTitle('');
    setDescription('');
    setVisibility('private');
    setShowForm(false);
    setNotice('Your chapter has been saved.');
    await loadChapters();
  };

  const deleteChapter = async (chapter: LifeChapter) => {
    if (chapter.user_id !== userId) return;
    if (!window.confirm(`Delete “${chapter.title}”? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from('life_chapters').delete().eq('id', chapter.id).eq('user_id', userId);
    if (deleteError) { setError('Could not delete this chapter. Please try again.'); return; }
    setChapters((items) => items.filter((item) => item.id !== chapter.id));
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
              Give your experiences a home. Create chapters for your journey, your people, your goals, and the moments you want to remember.
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
          <textarea id="chapter-description" maxLength={2000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Write a little about the memories, people, or goals you want to collect here..." className="mb-4 w-full resize-y rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400" />
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="chapter-privacy">Who can see this chapter?</label>
          <select id="chapter-privacy" value={visibility} onChange={(event) => setVisibility(event.target.value as 'private' | 'public')} className="mb-5 w-full rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400">
            <option value="private">Private — only me</option>
            <option value="public">Public — visible to Nightgram users</option>
          </select>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">New chapters are private by default. You can choose to share one publicly.</p>
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
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">Create your first Life Chapter. Keep it private as a personal journal, or make it public when you're ready to share.</p>
          <button onClick={() => setShowForm(true)} className="mt-5 rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-400/10">Create your first chapter</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter) => {
            const ownChapter = chapter.user_id === userId;
            return (
              <article key={chapter.id} className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c13] transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20">
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
      <p className="mt-8 text-center text-[11px] leading-5 text-zinc-600">Your memories belong to you. Private chapters are visible only to your account.</p>
    </div>
  );
}
