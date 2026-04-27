import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Generate a unique session encryption key — stored ONLY in memory/sessionStorage
const SESSION_KEY_NAME = 'saathi_session_key';

function getOrCreateSessionKey() {
  try {
    const storedKey = sessionStorage.getItem(SESSION_KEY_NAME);
    if (storedKey) {
      return decodeBase64(storedKey);
    }
  } catch (_) {}

  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  try {
    sessionStorage.setItem(SESSION_KEY_NAME, encodeBase64(key));
  } catch (_) {}
  return key;
}

const sessionKey = getOrCreateSessionKey();

/**
 * Encrypts a plaintext string using TweetNaCl secretbox.
 * Returns a Base64-encoded string: nonce + ciphertext.
 */
export function encryptMessage(plaintext) {
  try {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const messageUint8 = encodeUTF8(plaintext);
    const encrypted = nacl.secretbox(messageUint8, nonce, sessionKey);

    // Combine nonce + encrypted into one buffer
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);

    return encodeBase64(combined);
  } catch (err) {
    console.error('Encryption failed:', err);
    return plaintext; // graceful fallback
  }
}

/**
 * Decrypts a Base64-encoded nonce+ciphertext back to plaintext.
 */
export function decryptMessage(encryptedBase64) {
  try {
    const combined = decodeBase64(encryptedBase64);
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = combined.slice(nacl.secretbox.nonceLength);
    const decrypted = nacl.secretbox.open(ciphertext, nonce, sessionKey);

    if (!decrypted) throw new Error('Decryption failed');
    return decodeUTF8(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return encryptedBase64; // fallback
  }
}

/**
 * Clear session key from storage (call on session end)
 */
export function clearSessionKey() {
  try {
    sessionStorage.removeItem(SESSION_KEY_NAME);
  } catch (_) {}
}
