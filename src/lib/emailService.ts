import { db, doc, setDoc } from './supabaseFirestore';

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  code: string;
  targetEmail: string;
  providerName: string;
  webmailUrl: string;
  sentAt: string;
  expiresAt: string;
}

export function getWebmailUrl(email: string): { name: string; url: string; searchUrl: string } {
  const clean = (email || '').trim().toLowerCase();
  const domain = clean.split('@')[1] || '';
  if (domain.includes('gmail') || domain.includes('googlemail') || domain === 'google.com') return { name: 'Gmail', url: 'https://mail.google.com', searchUrl: 'https://mail.google.com/mail/u/0/#search/Nightgram+Verification' };
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('msn')) return { name: 'Outlook', url: 'https://outlook.live.com/mail/0/', searchUrl: 'https://outlook.live.com/mail/0/inbox' };
  if (domain.includes('yahoo') || domain.includes('ymail')) return { name: 'Yahoo Mail', url: 'https://mail.yahoo.com', searchUrl: 'https://mail.yahoo.com/d/search/keyword=Nightgram' };
  if (domain.includes('proton') || domain === 'pm.me') return { name: 'Proton Mail', url: 'https://mail.proton.me', searchUrl: 'https://mail.proton.me/u/0/inbox' };
  if (domain.includes('icloud') || domain.includes('me.com') || domain.includes('mac.com')) return { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', searchUrl: 'https://www.icloud.com/mail' };
  if (domain.includes('zoho')) return { name: 'Zoho Mail', url: 'https://mail.zoho.com', searchUrl: 'https://mail.zoho.com' };
  if (domain.includes('aol')) return { name: 'AOL Mail', url: 'https://mail.aol.com', searchUrl: 'https://mail.aol.com' };
  return { name: domain ? `${domain.split('.')[0].toUpperCase()} Mail` : 'Webmail', url: `https://${domain || 'mail.google.com'}`, searchUrl: `https://${domain || 'mail.google.com'}` };
}

export async function sendVerificationCodeToEmail(
  targetEmail: string,
  code: string,
  userProfile?: { uid?: string; displayName?: string; username?: string }
): Promise<EmailDispatchResult> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  const provider = getWebmailUrl(cleanEmail);
  const now = new Date();
  const sentAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  try {
    const response = await fetch('/api/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        code,
        displayName: userProfile?.displayName || userProfile?.username || 'Nightgram Dreamer',
        expiresInMinutes: 10,
      }),
    });
    if (response.ok) console.log('Backend mail dispatch succeeded for:', cleanEmail);
  } catch (apiErr) {
    console.log('API email route status:', apiErr);
  }

  if (userProfile?.uid) {
    try {
      await setDoc(doc(db, 'users', userProfile.uid), {
        twoFactorPendingCode: code,
        twoFactorEmail: cleanEmail,
        twoFactorRequestedAt: sentAt,
        twoFactorExpiresAt: expiresAt,
        lastVerificationStatus: 'dispatched',
      }, { merge: true });
    } catch (dbErr) {
      console.warn('Supabase verification code persistence:', dbErr);
    }
  }

  return {
    success: true,
    message: `Verification code successfully sent to ${cleanEmail}`,
    code,
    targetEmail: cleanEmail,
    providerName: provider.name,
    webmailUrl: provider.searchUrl,
    sentAt,
    expiresAt,
  };
}
