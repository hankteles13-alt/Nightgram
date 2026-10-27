import React, { useCallback, useEffect, useState } from 'react';
import { Ban, Clock3 } from 'lucide-react';
import { CHAT_PRIVACY_EVENT, getDisappearTimer, isBlockedByMe, timerLabel } from '../../lib/chatExtras';

type Props = { conversationId?: string; partnerUid?: string; partnerName: string };

/** Slim notice at the top of a chat: "You blocked X" and/or "Messages disappear after 1 day". */
export default function ChatStatusBanner({ conversationId, partnerUid, partnerName }: Props) {
  const [blocked, setBlocked] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (partnerUid) setBlocked(await isBlockedByMe(partnerUid));
    if (conversationId) setSeconds(await getDisappearTimer(conversationId));
  }, [conversationId, partnerUid]);

  useEffect(() => {
    void load();
    window.addEventListener(CHAT_PRIVACY_EVENT, load);
    return () => window.removeEventListener(CHAT_PRIVACY_EVENT, load);
  }, [load]);

  if (!blocked && seconds === null) return null;
  return (
    <div className="mb-2 space-y-1.5" id="chat-status-banner">
      {blocked && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-950/20 px-3 py-2 text-[11px] text-red-200">
          <Ban className="h-3.5 w-3.5 flex-none" /> You blocked {partnerName}. Messages to them won't be delivered. Unblock in Contact info.
        </p>
      )}
      {seconds !== null && (
        <p className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-200">
          <Clock3 className="h-3.5 w-3.5 flex-none" /> New messages disappear after {timerLabel(seconds)}.
        </p>
      )}
    </div>
  );
}
