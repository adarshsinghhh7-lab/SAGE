import CryptoJS from 'crypto-js';

/**
 * SAGE_MASTER_KEY: Server-only master encryption key.
 *
 * FAIL-CLOSED POLICY (serverless-compatible):
 *  - In production (NODE_ENV=production) the server STARTS even if SAGE_MASTER_KEY
 *    is missing, but `isMasterKeyReady` is `false` and identity sealing is disabled:
 *    complaints return 503, and GET /api/health reports "masterKeyConfigured": false.
 *    This ensures the deployed site shows a clear diagnostic instead of a generic 500
 *    that the frontend reports as "Cannot reach the Sealing Server".
 *  - In development a clearly-labelled fallback string is allowed so the
 *    local demo/sandbox keeps working, accompanied by an explicit warning
 *    that this key MUST NOT be used for real data.
 */

// Development-only fallback. String is deliberately prefixed so any accidental
// exposure in logs/build artefacts is unmistakable as a NON-production key.
const DEV_FALLBACK_KEY = 'SAGE_CAMPUS_AES_KEY_2026_DECOUPLED_IDENTITY_SEC';

const isProduction = process.env.NODE_ENV === 'production';

let masterKey = process.env.SAGE_MASTER_KEY || '';
let masterKeyReady = Boolean(masterKey);

if (!masterKey) {
  if (isProduction) {
    // Fail closed WITHOUT throwing at module load: when deployed as a serverless
    // function (Vercel api/index.js) a module-load throw crashes the whole
    // function before it can send any response — the client then sees a generic
    // "Cannot reach the Sealing Server" with no way to know why. Instead we keep
    // the process alive, mark the key as unavailable, and expose a clear,
    // actionable status via GET /api/health and the / root endpoint. Identity
    // sealing/decryption is still refused at the point of use, so real identities
    // can never be sealed with a public fallback.
    masterKey = '';
    masterKeyReady = false;
    console.error(
      '[SAGE_MASTER_KEY] Missing required SAGE_MASTER_KEY environment variable. ' +
      'The backend started but identity sealing is DISABLED. Set SAGE_MASTER_KEY ' +
      'in your hosting platform (Vercel → Project Settings → Environment Variables) ' +
      'and redeploy or restart.'
    );
  } else {
    masterKey = DEV_FALLBACK_KEY;
    masterKeyReady = true;
    console.warn(
      '[SAGE_MASTER_KEY] WARNING: SAGE_MASTER_KEY is not set. Using DEV-ONLY fallback key. ' +
      'This MUST NOT be used to seal real student identity in production.'
    );
  }
}

export const SAGE_MASTER_KEY = masterKey;

/** True when a real, server-provided SAGE_MASTER_KEY is available for sealing. */
export const isMasterKeyReady = masterKeyReady;

/**
 * AES-256 Encryption for Student Identity & User Reference
 * Runs ONLY on the backend with the server-only SAGE_MASTER_KEY.
 */
export function encryptAES(plainText, secretKey = masterKey) {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/**
 * AES-256 Decryption (Restricted to Head Admin)
 */
export function decryptAES(cipherText, secretKey = masterKey) {
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
export function hashSHA256(input) {
  if (!input) return '';
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}
