import { Router } from 'express';
import { isFirebaseLive, initMessage } from '../config/firebaseAdmin.js';
import { isMasterKeyReady } from '../utils/crypto.js';

const router = Router();

router.get('/', (req, res) => {
  const masterKeyConfigured = isMasterKeyReady;
  res.status(200).json({
    status: 'healthy',
    system: 'SAGE Backend (Node.js/Express + Firebase)',
    timestamp: new Date().toISOString(),
    firebase: {
      connected: isFirebaseLive,
      status: isFirebaseLive ? 'Live Firebase Firestore Connected' : 'Synchronized In-Memory Firestore Active',
      details: initMessage,
    },
    sealing: {
      masterKeyConfigured,
      status: masterKeyConfigured
        ? 'Identity sealing enabled (SAGE_MASTER_KEY configured)'
        : 'DISABLED — SAGE_MASTER_KEY not configured. Set it in Vercel → Project Settings → Environment Variables and redeploy.',
    },
    collections: {
      users: true,
      complaints: true,
      upvotes: true,
      statusUpdates: true,
      revealLogs: true,
      settings: true,
    },
    escalation: {
      enabled: process.env.DISABLE_ESCALATION_SCHEDULER !== 'true',
      endpoint: 'PUT /api/settings/escalation/threshold',
    },
    version: '2.0.0',
  });
});

export default router;
