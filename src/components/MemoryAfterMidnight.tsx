import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, LockOpen, Plus, Trash2, Clock3, Sparkles, CalendarClock, LoaderCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Capsule = {
  id: string;
  title: string;
  open_at: string;
  created_at: string;
  opened_at: string | null;
  is_ready: boolean;
};
type OpenCapsule = { id: string; title: string; message: string; open_at: string };
type Props = { currentUser: { uid?: string; id?: string } | null };

function localDateTimeMin() {
  const date = new Date(Date.now() + 60_000);
  date.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatDate(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MemoryAfterMidnight({ currentUser }: Props) {
  const userId = currentUser?.uid || currentUser?.id || '';
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [openAt, setOpenAt] = useState('');
  const [openedCapsule, setOpenedCapsule] = useState<OpenCapsule | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCapsules = useCallback(async () => {
    if (!userId) { setCapsules([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: loadError } = await supabase.rpc('list_my_memory_capsules');
    if (loadError) setError('Could not load your time capsules. Please refresh and try again.');
    else setCapsules((data || []) as Capsule[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void loadCapsules(); }, [loadCapsules]);

  const createCapsule = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (!userId) { setError('Sign in to create a private time capsule.'); return; }
    if (!openAt || new Date(openAt).getTime() <= Date.now()) {
      setError('Choose a future date and time to unlock your capsule.');
      return;
    }
    setSaving(true);
    const { error: saveError } = await supabase.rpc('create_memory_capsule', {
      p_title: title.trim(),
      p_message: message,
      p_open_at: new Date(openAt).toISOString(),
    });
    setSaving(false);
    if (saveError) { setError(saveError.message.includes('future') ? 'Choose a future opening date and time.' : 'Could not save your capsule. Check your details and try again.'); return; }
    setTitle(''); setMessage(''); setOpenAt(''); setShowForm(false);
    setNotice('Your capsule is sealed. Its message will only be returned after the opening time.');
    await loadCapsules();
  };

  const openCapsule = async (capsule: Capsule) => {
    setError('');
    if (!capsule.is_ready) { setError(`This capsule unlocks on ${formatDate(capsule.open_at)}.`); return; }
    const { data, error: openError } = await supabase.rpc('open_memory_capsule', { p_capsule_id: capsule.id });
    if (openError || !data?.[0]) { setError('This capsule is not ready to open yet. Refresh and try again when it unlocks.'); return; }
    setOpenedCapsule(data[0] as OpenCapsule);
    await loadCapsules();
  };

  const deleteCapsule = async (capsule: Capsule) => {
    if (!window.confirm(`Delete the time capsule “${capsule.title}”? This cannot be undone.`)) return;
    setError('');
    const { data, error: deleteError } = await supabase.rpc('delete_memory_capsule', { p_capsule_id: capsule.id });
    if (deleteError || !data) { setError('Could not delete this capsule. Please try again.'); return; }
    setCapsules(items => items.filter(item => item.id !== capsule.id));
    if (openedCapsule?.id === capsule.id) setOpenedCapsule(null);
    setNotice('Time capsule deleted.');
  };

  const readyCount = useMemo(() => capsules.filter(c => c.is_ready).length, [capsules]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-900/60 bg-gradient-to-br from-zinc-950 via-slate-950 to-indigo-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-cyan-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.24em]">Memory After Midnight</span></div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">A message for your future self.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">Save a thought, a goal, or a memory. Your capsule stays sealed until the date you choose.</p>
            <p className="mt-3 text-xs text-zinc-400">{capsules.length} capsule{capsules.length === 1 ? '' : 's'} · {readyCount} ready to open</p>
          </div>
          <button onClick={() => { setShowForm(v => !v); setError(''); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? 'Cancel' : 'Create a capsule'}
          </button>
        </div>
      </div>

      {showForm && <form onSubmit={createCapsule} className="mt-5 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div><label className="mb-2 block text-sm font-semibold text-zinc-200">Capsule title</label><input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Open when I finish school…" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" /></div>
        <div><label className="mb-2 block text-sm font-semibold text-zinc-200">Your message</label><textarea required maxLength={5000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a note to your future self…" className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" /><div className="mt-1 text-right text-xs text-zinc-500">{message.length}/5000</div></div>
        <div><label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200"><CalendarClock className="h-4 w-4 text-cyan-300" />Unlock date and time</label><input required type="datetime-local" min={localDateTimeMin()} value={openAt} onChange={e => setOpenAt(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" /><p className="mt-1 text-xs text-zinc-500">Use your device’s local time. Only the capsule title and unlock date appear before it opens.</p></div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Sealing capsule…' : 'Seal time capsule'}</button>
      </form>}

      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-900/70 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="mt-4 rounded-xl border border-emerald-900/70 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

      {openedCapsule && <div className="mt-5 rounded-2xl border border-cyan-700/60 bg-cyan-950/20 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Capsule opened</p><h2 className="text-2xl font-bold text-white">{openedCapsule.title}</h2><p className="mt-1 text-xs text-zinc-400">Scheduled for {formatDate(openedCapsule.open_at)}</p></div><button onClick={() => setOpenedCapsule(null)} aria-label="Close opened capsule" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="h-5 w-5" /></button></div>
        <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">{openedCapsule.message}</p>
      </div>}

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-white">Your capsules</h2>
        {loading ? <div className="flex items-center gap-2 py-10 text-sm text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your capsules…</div>
          : capsules.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-zinc-600" /><p className="mt-3 font-semibold text-zinc-300">Your future is waiting.</p><p className="mt-1 text-sm text-zinc-500">Create your first private time capsule above.</p></div>
          : <div className="grid gap-3 md:grid-cols-2">{capsules.map(capsule => <article key={capsule.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-start gap-3"><div className={`rounded-xl p-3 ${capsule.is_ready ? 'bg-cyan-950 text-cyan-300' : 'bg-zinc-900 text-zinc-500'}`}>{capsule.is_ready ? <LockOpen className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><h3 className="break-words font-bold text-white">{capsule.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400"><Clock3 className="h-3.5 w-3.5" />{capsule.is_ready ? 'Ready to open' : `Opens ${formatDate(capsule.open_at)}`}</p><p className="mt-2 text-xs text-zinc-500">{capsule.opened_at ? `Opened ${formatDate(capsule.opened_at)}` : capsule.is_ready ? 'Your message is ready.' : 'Message sealed until the unlock time.'}</p></div></div>
            <div className="mt-4 flex gap-2"><button onClick={() => void openCapsule(capsule)} disabled={!capsule.is_ready} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-900/70 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-40">{capsule.is_ready ? <LockOpen className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}{capsule.is_ready ? 'Open capsule' : 'Still sealed'}</button><button onClick={() => void deleteCapsule(capsule)} aria-label={`Delete ${capsule.title}`} className="rounded-lg border border-zinc-800 px-3 py-2 text-zinc-500 hover:border-rose-900 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
          </article>)}</div>}
      </div>
    </section>
  );
}
