import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

let adminApp = null;
let db = null;
let auth = null;
let bucket = null;
let isFirebaseLive = false;
let initMessage = 'Initializing Firebase...';

// VERCEL COLD START FIX: Synchronous initialization with error handling
// This must complete quickly (< 1s) to avoid Vercel timeout
try {
  console.log('[Firebase] Initializing Admin SDK...');
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (getApps().length > 0) {
    console.log('[Firebase] Reusing existing app instance');
    adminApp = getApps()[0];
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    try {
      bucket = getStorage(adminApp).bucket();
    } catch (e) {
      bucket = null;
    }
    isFirebaseLive = true;
    initMessage = 'Connected (reused instance)';
  } else if (serviceAccountEnv) {
    console.log('[Firebase] Initializing with service account...');
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch {
      serviceAccount = serviceAccountEnv;
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || (typeof serviceAccount === 'object' ? serviceAccount.project_id : undefined),
    });

    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    try {
      bucket = getStorage(adminApp).bucket();
    } catch (e) {
      bucket = null;
    }
    isFirebaseLive = true;
    initMessage = 'Connected (service account)';
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('[Firebase] Initializing with Application Default Credentials...');
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
    });
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    try {
      bucket = getStorage(adminApp).bucket();
    } catch (e) {
      bucket = null;
    }
    isFirebaseLive = true;
    initMessage = 'Connected (ADC)';
  } else if (projectId && process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('[Firebase] Using Firestore Emulator...');
    adminApp = initializeApp({
      projectId: projectId,
    });
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    isFirebaseLive = true;
    initMessage = `Emulator on ${process.env.FIRESTORE_EMULATOR_HOST}`;
  } else {
    console.log('[Firebase] No credentials found - using in-memory fallback');
    isFirebaseLive = false;
    initMessage = 'In-memory fallback (no credentials)';
  }
} catch (error) {
  console.error(`[Firebase] Init failed: ${error?.message}`);
  initMessage = `Error: ${error?.message}`;
  isFirebaseLive = false;
  db = null;
  auth = null;
  bucket = null;
}

export { adminApp, db, auth, bucket, isFirebaseLive, initMessage };
