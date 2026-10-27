import React, { useEffect, useState } from 'react';
import { Ban, Clock3 } from 'lucide-react';
import {
  TIMER_OPTIONS, getDisappearTimer, isBlockedByMe, isUuid, notifyChatPrivacyChanged, setBlocked, setDisappearTimer,
} from '../../lib/chatExtras';

type Props = { conversationId?: string; partnerUid?: string; partnerName: string };

/** Real Block / Unblock and the disappearing-messages timer, shown inside Contact info. */
export default function ChatPrivacyControls({ conversationId, partnerUid, partnerName }: Props) {
  const [blocked, setBlockedState] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (partnerUid) { const b = await isBlockedByMe(partnerUid); if (!cancelled) setBlockedState(b); }
      if (conversationId) { const s = await getDisappearTimer(conversationId); if (!cancelled) setSeconds(s); }
    })();
    return () => { cancelled = true; };
  }, [conversationId, partnerUid]);

  const toggleBlock = async () => {
    if (!partnerUid || busy) return;
    if (!blocked && !window.confirm(`Block ${partnerName}? They won't be able to message you.`)) return;
    setBusy(true); setMessage('');
    try {
      await setBlocked(partnerUid, !blocked);
      setBlockedState(!blocked);
      notifyChatPrivacyChanged();
    } catch { setMessage('Could not update. Please try again.'); }
    setBusy(false);
  };

  const changeTimer = async (value: string) => {
    if (!conversationId || busy) return;
    const next = value === '' ? null : Number(value);
    setBusy(true); setMessage('');
    try {
      await setDisappearTimer(conversationId, next);
      setSeconds(next);
      notifyChatPrivacyChanged();
    } catch { setMessage('Could not change the timer. Please try again.'); }
    setBusy(false);
  };

  return (
    <>
      {isUuid(conversationId) && (
        <div className="w-full p-3.5 px-4 text-xs font-bold text-zinc-200 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Clock3 className="w-4 h-4 text-cyan-300" />
            <span>Disappearing messages</span>
          </div>
          <select
            value={seconds === null ? '' : String(seconds)}
            onChange={(e) => void changeTimer(e.target.value)}
            disabled={busy}
            aria-label="Disappearing messages timer"
            className="rounded-lg border border-zinc-700 bg-[#15151f] px-2 py-1.5 text-xs text-white"
          >
            {TIMER_OPTIONS.map((o) => <option key={o.label} value={o.seconds === null ? '' : String(o.seconds)}>{o.label}</option>)}
          </select>
        </div>
      )}
      {partnerUid && (
        <button
          type="button"
          onClick={() => void toggleBlock()}
          disabled={busy}
          className="w-full p-3.5 px-4 text-left text-xs font-bold text-red-400 hover:bg-red-950/20 transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-60"
        >
          <Ban className="w-4 h-4 text-red-400" />
          <span>{blocked ? `Unblock ${partnerName}` : `Block ${partnerName}`}</span>
        </button>
      )}
      {message && <p role="alert" className="px-4 py-2 text-[11px] text-rose-300">{message}</p>}
    </>
  );
}
