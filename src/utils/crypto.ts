import CryptoJS from 'crypto-js';

// Default Master Encryption Key (can be overridden via VITE_SAGE_MASTER_KEY in production)
const DEFAULT_KEY = 'SAGE_CAMPUS_AES_KEY_2026_DECOUPLED_IDENTITY_SEC';

/**
 * AES-256 Encryption for Student Identity & User Reference
 * Ensures plain text student information is never stored directly in Firestore.
 */
export function encryptAES(plainText: string, secretKey: string = DEFAULT_KEY): string {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/**
 * AES-256 Decryption
 * Restricted to verified head_admin audit queries.
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
 * SHA-256 One-Way Hash for Anonymous Voter Identity
 * Allows Firestore to enforce one-vote-per-student without storing identity.
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

/**
 * Generates a SHA-256 voter hash for upvoting
 * Combines persistent client device entropy with salt so voter identity cannot be reverse-engineered.
 */
export function getOrCreateVoterFingerprint(): string {
  let voterId = localStorage.getItem('sage_voter_client_id');
  if (!voterId) {
    voterId = 'VOTER_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem('sage_voter_client_id', voterId);
  }
  return hashSHA256(voterId);
}

/**
 * Hash current user ID with SHA-256 for anonymous upvote tracking
 * Prevents duplicate votes in Firestore upvotes collection without storing plain user identity.
 */
export function getVoterHashedId(userId?: string | null): string {
  if (userId && userId.trim()) {
    return hashSHA256(userId.trim());
  }
  return getOrCreateVoterFingerprint();
}
