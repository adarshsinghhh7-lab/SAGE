import CryptoJS from 'crypto-js';

const DEFAULT_KEY = process.env.SAGE_MASTER_KEY || 'SAGE_CAMPUS_AES_KEY_2026_DECOUPLED_IDENTITY_SEC';

/**
 * AES-256 Encryption for Student Identity & User Reference
 */
export function encryptAES(plainText: string, secretKey: string = DEFAULT_KEY): string {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/**
 * AES-256 Decryption (Restricted to Head Admin)
 */
export function decryptAES(cipherText: string, secretKey: string = DEFAULT_KEY): string {
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

/**
 * Generates an untraceable pseudo-identity token for the submitter
 * Encrypts an ephemeral timestamped identity blob with AES.
 */
export function generateEncryptedUserRef(prefix: string = 'ANON_STUDENT'): string {
  const randomEntropy = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const rawIdentity = `${prefix}_${Date.now()}_${randomEntropy}`;
  return encryptAES(rawIdentity);
}
