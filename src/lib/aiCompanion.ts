// Client helper for the AI companion chat edge function

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface CompanionReply {
  reply: string;
  companionId?: string;
  fallback?: boolean;
}

/**
 * Calls the ai-companion-chat Supabase edge function to get a real Gemini-powered
 * reply from an AI companion. Falls back gracefully if the function is unavailable.
 */
export async function fetchAiCompanionReply(
  companionId: string,
  message: string,
  history: ChatTurn[] = []
): Promise<CompanionReply> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      reply: "My connection to the night sky isn't configured yet. 🌙",
      fallback: true,
    };
  }

  const apiUrl = `${supabaseUrl}/functions/v1/ai-companion-chat`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ companionId, message, history }),
    });

    if (!response.ok) {
      return {
        reply: "The signal flickered for a moment. Try sending that again? 🌌",
        fallback: true,
      };
    }

    const data = await response.json();
    if (!data || typeof data.reply !== 'string') {
      return {
        reply: "The night holds its breath... say that again? 🌙",
        fallback: true,
      };
    }

    return { reply: data.reply, companionId: data.companionId, fallback: data.fallback };
  } catch (err) {
    console.error('AI companion chat fetch error:', err);
    return {
      reply: "A cosmic disruption occurred. The signal will return shortly. 🌌",
      fallback: true,
    };
  }
}
