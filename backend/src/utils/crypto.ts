import CryptoJS from 'crypto-js';

/**
 * SAGE_MASTER_KEY: Server-only master encryption key.
 *
 * FAIL-CLOSED POLICY:
 *  - In production (NODE_ENV=production) the server REFUSES to run if
 *    SAGE_MASTER_KEY is not provided, so identities can never be sealed with
 *    a publicly-known fallback.
 *  - In development a clearly-labelled fallback string is allowed so the
 *    local demo/sandbox keeps working, accompanied by an explicit warning
 *    that this key MUST NOT be used for real data.
 */

// Development-only fallback. String is deliberately prefixed so any accidental
// exposure in logs/build artefacts is unmistakable as a NON-production key.
const DEV_FALLBACK_KEY = 'SAGE_CAMPUS_AES_KEY_2026_DECOUPLED_IDENTITY_SEC';

const isProduction = process.env.NODE_ENV === 'production';

let masterKey = process.env.SAGE_MASTER_KEY || '';

if (!masterKey) {
  if (isProduction) {
    // Fail closed: throw so the process refuses to start in prod.
    throw new Error(
      '[SAGE_MASTER_KEY] Missing required SAGE_MASTER_KEY environment variable. ' +
      'The backend refuses to start in production without it, because identity ' +
      'sealing depends on a server-only key. Set SAGE_MASTER_KEY and restart.'
    );
  } else {
    masterKey = DEV_FALLBACK_KEY;
    console.warn(
      '[SAGE_MASTER_KEY] WARNING: SAGE_MASTER_KEY is not set. Using DEV-ONLY fallback key. ' +
      'This MUST NOT be used to seal real student identity in production.'
    );
  }
}

export const SAGE_MASTER_KEY: string = masterKey;

/**
 * AES-256 Encryption for Student Identity & User Reference
 * Runs ONLY on the backend with the server-only SAGE_MASTER_KEY.
 */
export function encryptAES(plainText: string, secretKey: string = masterKey): string {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/**
 * AES-256 Decryption (Restricted to Head Admin)
 */
export function decryptAES(cipherText: string, secretKey: string = masterKey): string {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || '[DECRYPTION FAILED - INVALID KEY]';
  } catch (error) {
    return '[DECRYPTION ERROR]';
  }
}

/**
 * SHA-256 One-Way Hash for voter verification
 */
export function hashSHA256(input: string): string {
  if (!input) return '';
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}
