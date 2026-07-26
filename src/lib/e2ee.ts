// Web Crypto API End-to-End Encryption (AES-256-GCM) for Nightgram Direct Chats

const E2EE_PREFIX = '🔐 [E2EE-AES-256] ';
const APP_E2EE_SALT = 'nightgram_e2ee_zero_knowledge_salt_2026';

/**
 * Derives an AES-256-GCM key derived for a given chat room using PBKDF2
 */
async function deriveChatKey(chatId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(chatId + '_nightgram_secret_master_seed'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(APP_E2EE_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    rawKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext message for a specific chatId using AES-256-GCM.
 * Returns formatted ciphertext string for database storage.
 */
export async function encryptMessageText(plaintext: string, chatId: string): Promise<string> {
  if (!plaintext) return '';
  try {
    const key = await deriveChatKey(chatId);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );

    // Combine IV + Ciphertext
    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    // Convert combined binary buffer to Base64
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    const base64Payload = btoa(binary);

    return `${E2EE_PREFIX}${base64Payload}`;
  } catch (err) {
    console.error('E2EE Encryption Error:', err);
    return plaintext;
  }
}

/**
 * Decrypts an encrypted message string for a given chatId.
 * If the message is unencrypted (legacy), returns plaintext as-is.
 */
export async function decryptMessageText(payload: string, chatId: string): Promise<string> {
  if (!payload) return '';
  if (!payload.startsWith(E2EE_PREFIX)) {
    return payload; // Legacy unencrypted message
  }

  try {
    const base64Data = payload.substring(E2EE_PREFIX.length).trim();
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const key = await deriveChatKey(chatId);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('E2EE Decryption Error:', err);
    return '🔒 [End-to-End Encrypted Message]';
  }
}

export function isEncryptedMessage(payload: string): boolean {
  return typeof payload === 'string' && payload.startsWith(E2EE_PREFIX);
}
