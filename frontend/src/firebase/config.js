// NOTE: We import from the underlying @firebase/* packages rather than the
// firebase/* umbrella subpaths. firebase@12.18.0's published tarball omits the
// firestore/dist/firestore/index.d.ts type file that its exports map declares,
// which breaks type resolution for `import ... from 'firebase/firestore'`.
// The @firebase/* packages ship complete, correct types and identical APIs.
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
// Client Firebase Configuration (reads from Vite env vars with safe defaults)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-sage-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sage-grievance.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sage-grievance',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sage-grievance.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};
let app;
let auth;
let db;
let isFirebaseConfigured = false;
try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    }
    else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
        isFirebaseConfigured = true;
    }
}
catch (error) {
    console.warn('[Firebase Client Init] Running in sandbox mode:', error);
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}
export { app, auth, db, isFirebaseConfigured, firebaseConfig };
