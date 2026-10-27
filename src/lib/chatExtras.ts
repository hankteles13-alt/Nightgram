import { supabase } from './supabase';

// Small helpers for the newer chat features. Everything here talks to Supabase directly;
// the older Firestore-shaped adapter is only used for the basic send/receive flow.

export const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '🙏'];

export const TIMER_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: 'Off', seconds: null },
  { label: '1 hour', seconds: 3600 },
  { label: '1 day', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
];

export const timerLabel = (seconds: number | null | undefined) =>
  TIMER_OPTIONS.find((o) => o.seconds === (seconds ?? null))?.label ?? 'Off';

export const isUuid = (value: string | undefined | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function myId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || '';
}

/** Blocks are private: you can only ever see your own, so this tells you whether *you* blocked them. */
export async function isBlockedByMe(otherUid: string): Promise<boolean> {
  const me = await myId();
  if (!me || !isUuid(otherUid)) return false;
  const { data } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', me).eq('blocked_id', otherUid).maybeSingle();
  return !!data;
}

export async function setBlocked(otherUid: string, blocked: boolean): Promise<void> {
  const me = await myId();
  if (!me || !isUuid(otherUid)) throw new Error('Not signed in');
  if (blocked) {
    const { error } = await supabase.from('user_blocks').upsert({ blocker_id: me, blocked_id: otherUid }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', me).eq('blocked_id', otherUid);
    if (error) throw error;
  }
}

export async function getDisappearTimer(conversationId: string): Promise<number | null> {
  if (!isUuid(conversationId)) return null;
  const { data } = await supabase.from('conversations').select('disappear_after_seconds').eq('id', conversationId).maybeSingle();
  return (data?.disappear_after_seconds as number | null | undefined) ?? null;
}

export async function setDisappearTimer(conversationId: string, seconds: number | null): Promise<void> {
  const { error } = await supabase.from('conversations').update({ disappear_after_seconds: seconds }).eq('id', conversationId);
  if (error) throw error;
}

export async function setReaction(messageId: string, emoji: string, on: boolean): Promise<void> {
  const me = await myId();
  if (!me || !isUuid(messageId)) throw new Error('Not signed in');
  if (on) {
    const { error } = await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: me, emoji }, { onConflict: 'message_id,user_id,emoji', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', me).eq('emoji', emoji);
    if (error) throw error;
  }
}

/** Owner opens (or re-opens) the group chat for one of their circles. Returns the conversation id. */
export async function openCircleChat(circleId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_circle_conversation', { p_circle: circleId });
  if (error) throw error;
  return data as string;
}

export const CHAT_PRIVACY_EVENT = 'nightgram-chat-privacy-changed';
export const notifyChatPrivacyChanged = () => window.dispatchEvent(new Event(CHAT_PRIVACY_EVENT));
