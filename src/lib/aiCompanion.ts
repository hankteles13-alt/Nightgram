import { supabase } from './supabase';

export interface ChatTurn { role: 'user' | 'assistant'; text: string; }
export interface CompanionReply { reply: string; companionId?: string; fallback?: boolean; }

export async function fetchAiCompanionReply(companionId: string, message: string, history: ChatTurn[] = []): Promise<CompanionReply> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-companion-chat', { body: { companionId, message, history } });
    if (error || !data || typeof data.reply !== 'string') return { reply: 'The signal flickered for a moment. Try sending that again? 🌌', fallback: true };
    return { reply: data.reply, companionId: data.companionId, fallback: data.fallback };
  } catch (err) {
    console.error('AI companion chat fetch error:', err);
    return { reply: 'A cosmic disruption occurred. The signal will return shortly. 🌌', fallback: true };
  }
}
