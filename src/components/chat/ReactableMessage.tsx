import React, { useEffect, useMemo, useState } from 'react';
import { REACTION_EMOJIS, setReaction } from '../../lib/chatExtras';

type Reaction = { emoji: string; userId: string };
type Props = { messageId: string; reactions?: Reaction[]; isMe: boolean; currentUid?: string; children: React.ReactNode };

/** Wraps a message bubble with reaction chips underneath and a small picker. */
export default function ReactableMessage({ messageId, reactions, isMe, currentUid, children }: Props) {
  const [local, setLocal] = useState<Reaction[]>(reactions || []);
  const [pickerOpen, setPickerOpen] = useState(false);

  const signature = JSON.stringify(reactions || []);
  useEffect(() => { setLocal(reactions || []); }, [signature]);

  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    local.forEach((r) => {
      const entry = map.get(r.emoji) || { count: 0, mine: false };
      entry.count += 1;
      if (r.userId === currentUid) entry.mine = true;
      map.set(r.emoji, entry);
    });
    return [...map.entries()];
  }, [local, currentUid]);

  const toggle = async (emoji: string) => {
    if (!currentUid) return;
    const already = local.some((r) => r.emoji === emoji && r.userId === currentUid);
    const before = local;
    setLocal(already ? local.filter((r) => !(r.emoji === emoji && r.userId === currentUid)) : [...local, { emoji, userId: currentUid }]);
    setPickerOpen(false);
    try { await setReaction(messageId, emoji, !already); } catch { setLocal(before); }
  };

  return (
    <div className="w-full">
      {children}
      <div className={`-mt-1 mb-1 flex flex-wrap items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {grouped.map(([emoji, info]) => (
          <button
            key={emoji}
            type="button"
            onClick={() => void toggle(emoji)}
            aria-label={`${emoji} ${info.count}${info.mine ? ', you reacted' : ''}`}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition ${info.mine ? 'border-cyan-400/60 bg-cyan-950/50 text-cyan-100' : 'border-zinc-700 bg-zinc-900/80 text-zinc-200'}`}
          >
            {emoji} {info.count}
          </button>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="Add a reaction"
            aria-expanded={pickerOpen}
            className="rounded-full px-1.5 py-0.5 text-[11px] text-zinc-500 opacity-60 transition hover:bg-zinc-800 hover:opacity-100"
          >
            ☺ +
          </button>
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
              <div className={`absolute bottom-full z-40 mb-1 flex gap-1 rounded-full border border-zinc-700 bg-[#161622] px-2 py-1 shadow-xl ${isMe ? 'right-0' : 'left-0'}`}>
                {REACTION_EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => void toggle(emoji)} aria-label={`React ${emoji}`} className="rounded-full px-1 text-base transition hover:scale-125">{emoji}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
