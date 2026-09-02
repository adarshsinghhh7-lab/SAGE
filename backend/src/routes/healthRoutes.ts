import { Router, Request, Response } from 'express';
import { isFirebaseLive, initMessage } from '../config/firebaseAdmin';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    system: 'SAGE Backend (Node.js/Express + Firebase)',
    timestamp: new Date().toISOString(),
    firebase: {
      connected: isFirebaseLive,
      status: isFirebaseLive ? 'Live Firebase Firestore Connected' : 'Synchronized In-Memory Firestore Active',
      details: initMessage,
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
