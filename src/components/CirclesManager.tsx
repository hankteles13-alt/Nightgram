import React, { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Circle = { id: string; name: string; owner_id: string };
type Person = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };

type Props = { userId: string; onClose: () => void; onChanged?: () => void };

const personName = (p?: Person) => p?.display_name || p?.username || 'Nightgram user';

/** Close circles: small private groups you can share Moments and Life Chapters with. */
export default function CirclesManager({ userId, onClose, onChanged }: Props) {
  const [mine, setMine] = useState<Circle[]>([]);
  const [joined, setJoined] = useState<Circle[]>([]);
  const [members, setMembers] = useState<Record<string, Person[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [addInputs, setAddInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError('');
    const { data: circles, error: circleError } = await supabase.from('circles').select('id,name,owner_id').order('created_at', { ascending: true });
    if (circleError) { setError('Could not load your circles. Please try again.'); setLoading(false); return; }
    const all = (circles || []) as Circle[];
    const own = all.filter((c) => c.owner_id === userId);
    setMine(own);
    setJoined(all.filter((c) => c.owner_id !== userId));

    const byCircle: Record<string, string[]> = {};
    if (own.length) {
      const { data: rows } = await supabase.from('circle_members').select('circle_id,user_id').in('circle_id', own.map((c) => c.id));
      (rows || []).forEach((r: { circle_id: string; user_id: string }) => { (byCircle[r.circle_id] ||= []).push(r.user_id); });
    }
    const ids = [...new Set(Object.values(byCircle).flat())];
    const lookup: Record<string, Person> = {};
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
      (profiles || []).forEach((p: Person) => { lookup[p.id] = p; });
    }
    setMembers(Object.fromEntries(own.map((c) => [c.id, (byCircle[c.id] || []).map((id) => lookup[id]).filter(Boolean)])));
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const changed = async () => { await load(); onChanged?.(); };

  const createCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true); setError('');
    const { error: insertError } = await supabase.from('circles').insert({ owner_id: userId, name: name.slice(0, 40) });
    setBusy(false);
    if (insertError) { setError('Could not create the circle. Please try again.'); return; }
    setNewName('');
    await changed();
  };

  const deleteCircle = async (circle: Circle) => {
    if (!window.confirm(`Delete the circle “${circle.name}”? Moments and chapters shared only with it will no longer be visible to its members.`)) return;
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.from('circles').delete().eq('id', circle.id).eq('owner_id', userId);
    setBusy(false);
    if (deleteError) { setError('Could not delete the circle. Please try again.'); return; }
    await changed();
  };

  const addMember = async (circle: Circle) => {
    const raw = (addInputs[circle.id] || '').trim().replace(/^@/, '');
    const handle = raw.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!handle || busy) return;
    setBusy(true); setError('');
    const { data: found } = await supabase.from('profiles').select('id,username,display_name,avatar_url').ilike('username', handle).limit(1);
    const person = (found || [])[0] as Person | undefined;
    if (!person) { setBusy(false); setError(`No one found with the username “${handle}”.`); return; }
    if (person.id === userId) { setBusy(false); setError('You are already in your own circle.'); return; }
    if ((members[circle.id] || []).some((m) => m.id === person.id)) { setBusy(false); setError(`${personName(person)} is already in this circle.`); return; }
    const { error: insertError } = await supabase.from('circle_members').insert({ circle_id: circle.id, user_id: person.id });
    setBusy(false);
    if (insertError) { setError('Could not add that person. Please try again.'); return; }
    setAddInputs((s) => ({ ...s, [circle.id]: '' }));
    await changed();
  };

  const removeMember = async (circle: Circle, person: Person) => {
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.from('circle_members').delete().eq('circle_id', circle.id).eq('user_id', person.id);
    setBusy(false);
    if (deleteError) { setError('Could not remove that person. Please try again.'); return; }
    await changed();
  };

  const leaveCircle = async (circle: Circle) => {
    if (!window.confirm(`Leave “${circle.name}”?`)) return;
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.from('circle_members').delete().eq('circle_id', circle.id).eq('user_id', userId);
    setBusy(false);
    if (deleteError) { setError('Could not leave the circle. Please try again.'); return; }
    await changed();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center" role="dialog" aria-modal="true" aria-label="Close circles" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-[#0b0b12] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="flex items-center gap-2 font-bold text-white"><Users className="h-5 w-5 text-cyan-300" /> Close circles</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <p className="text-xs leading-5 text-zinc-400">A circle is a small private group — close friends, family, a team. Share a Moment or a Life Chapter with just that circle. People you add can see what you share with it; they are not told who else is in it.</p>

          <form onSubmit={createCircle} className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 40))} placeholder="New circle name, e.g. Close friends" aria-label="New circle name" className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400" />
            <button type="submit" disabled={busy || !newName.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"><Plus className="h-4 w-4" /> Create</button>
          </form>

          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : mine.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">You have no circles yet. Create your first one above.</p>
          ) : mine.map((circle) => (
            <section key={circle.id} className="rounded-2xl border border-zinc-800 bg-[#10101a] p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="min-w-0 truncate font-semibold text-white">{circle.name} <span className="text-xs font-normal text-zinc-500">· {(members[circle.id] || []).length} {(members[circle.id] || []).length === 1 ? 'person' : 'people'}</span></h3>
                <button type="button" onClick={() => void deleteCircle(circle)} disabled={busy} aria-label={`Delete circle ${circle.name}`} className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
              </div>
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {(members[circle.id] || []).map((person) => (
                  <li key={person.id} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-black/30 py-1 pl-2.5 pr-1 text-xs text-zinc-200">
                    {personName(person)}
                    <button type="button" onClick={() => void removeMember(circle, person)} disabled={busy} aria-label={`Remove ${personName(person)}`} className="grid h-5 w-5 place-items-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-white"><X className="h-3 w-3" /></button>
                  </li>
                ))}
                {(members[circle.id] || []).length === 0 && <li className="text-xs text-zinc-600">No one yet.</li>}
              </ul>
              <form onSubmit={(e) => { e.preventDefault(); void addMember(circle); }} className="flex gap-2">
                <input value={addInputs[circle.id] || ''} onChange={(e) => setAddInputs((s) => ({ ...s, [circle.id]: e.target.value }))} placeholder="Add by username" aria-label={`Add someone to ${circle.name} by username`} className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400" />
                <button type="submit" disabled={busy || !(addInputs[circle.id] || '').trim()} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" /> Add</button>
              </form>
            </section>
          ))}

          {joined.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Circles you're in</h3>
              <ul className="space-y-1.5">
                {joined.map((circle) => (
                  <li key={circle.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#10101a] px-3 py-2 text-sm text-zinc-200">
                    {circle.name}
                    <button type="button" onClick={() => void leaveCircle(circle)} disabled={busy} className="text-xs text-zinc-500 hover:text-rose-300">Leave</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
