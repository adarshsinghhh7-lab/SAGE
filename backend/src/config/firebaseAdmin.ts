import { initializeApp, cert, applicationDefault, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let adminApp: App | null = null;
let db: Firestore | any = null;
let auth: Auth | any = null;
let isFirebaseLive = false;
let initMessage = '';

try {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    isFirebaseLive = true;
    initMessage = 'Reusing existing Firebase Admin instance';
  } else if (serviceAccountEnv) {
    let serviceAccount: any;
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
    isFirebaseLive = true;
    initMessage = 'Connected to Live Firebase Firestore via Service Account Key';
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
    });
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    isFirebaseLive = true;
    initMessage = 'Connected to Live Firebase Firestore via Application Default Credentials';
  } else if (projectId && process.env.FIRESTORE_EMULATOR_HOST) {
    adminApp = initializeApp({
      projectId: projectId,
    });
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    isFirebaseLive = true;
    initMessage = `Connected to Firebase Firestore Emulator on ${process.env.FIRESTORE_EMULATOR_HOST}`;
  } else {
    initMessage = 'Running in Development / Sandbox Mode with Synchronized In-Memory Firestore & Auth';
  }
} catch (error: any) {
  console.warn(`[Firebase Admin Warning] Initializing fallback store: ${error?.message}`);
  initMessage = `Fallback Mode: ${error?.message}`;
  isFirebaseLive = false;
}

export { adminApp, db, auth, isFirebaseLive, initMessage };
