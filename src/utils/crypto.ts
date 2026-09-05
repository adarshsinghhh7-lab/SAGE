import CryptoJS from 'crypto-js';

// IMPORTANT SECURITY NOTE:
// Client-side AES encryption/decryption of student identity has been REMOVED.
// Identity sealing/decryption now happens ONLY on the backend with the
// server-only SAGE_MASTER_KEY. Nothing on this module (or anywhere in the
// browser bundle) can encrypt or decrypt a submitter reference anymore.
// This file only keeps the SHA-256 one-way voter helpers, which never
// reveal identity.

/**
 * SHA-256 One-Way Hash for Anonymous Voter Identity
 * Allows Firestore to enforce one-vote-per-student without storing identity.
 */
export function hashSHA256(input: string): string {
  if (!input) return '';
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
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
