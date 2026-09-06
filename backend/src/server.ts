import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { authenticate } from './middleware/authMiddleware.js';
import complaintRoutes from './routes/complaintRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { FirestoreService } from './services/firestoreService.js';
import { startHourlyEscalationScheduler } from './services/escalationService.js';
import { isFirebaseLive, initMessage } from './config/firebaseAdmin.js';
import { SAGE_MASTER_KEY } from './utils/crypto.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (port 3000 / 5173 / all origins)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sage-role', 'x-sage-uid', 'x-sage-voter-id'],
  })
);

// Body limit must accommodate the largest allowed evidence upload: a 25MB
// video encoded as a base64 data-URI inflates to ~33MB of JSON, so we allow
// 35MB (was 10mb â€” large video submissions were being rejected with 413).
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Optional single-service production hosting: when SERVE_STATIC=true the
// backend also serves the built React app (dist/) plus an SPA fallback, so the
// UI and /api share ONE origin. The browser's default API base ('/api') then
// works exactly as it does through the dev proxy — no VITE_API_URL, no CORS.
// Mounted before the API routes on purpose: express.static only answers for
// real files in dist/, so every /api request still flows to the controllers.
if (process.env.SERVE_STATIC === 'true') {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    console.log(`  Single-service: serving React UI from ${distDir}`);
  } else {
    console.warn(
      `[SERVE_STATIC] No dist/ found at ${distDir} — run "npm run build" first. Serving API routes only.`
    );
  }
}

// Global authentication & role extraction middleware
app.use(authenticate);

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'S.A.G.E. Backend API',
    description: 'Student Anonymous Grievance & Escalation System',
    endpoints: {
      health: 'GET /api/health',
      complaints: 'GET/POST /api/complaints',
      complaintDetail: 'GET /api/complaints/:id',
      upvote: 'POST /api/complaints/:id/upvote',
      updateStatus: 'PATCH /api/complaints/:id/status',
      flagDisputed: 'POST /api/complaints/:id/dispute',
      revealIdentity: 'POST /api/complaints/:id/reveal',
      revealLogs: 'GET /api/complaints/reveal-logs',
      analytics: 'GET /api/analytics',
      escalationSettings: 'GET/PUT /api/settings/escalation[/threshold]',
      runEscalationNow: 'POST /api/settings/escalation/run',
      authMe: 'GET /api/auth/me',
      setRole: 'POST /api/auth/set-role',
    },
    firebaseStatus: isFirebaseLive ? 'Connected' : 'Fallback / In-Memory Sandbox',
  });
});

// SPA fallback: in single-service mode any unmatched non-/api GET is a
// client-side route, so hand index.html to React Router.
if (process.env.SERVE_STATIC === 'true') {
  const distDir = path.resolve(process.cwd(), 'dist');
  app.get(/^\/(?!api([\/]|$)).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Seed data on startup
FirestoreService.seedIfEmpty().catch((err: any) => {
  console.warn(`[Startup Seeding] ${err?.message}`);
});

// Hourly automatic complaint escalation job (see services/escalationService.ts)
// Skips NODE_ENV=test so test suites never arm long timers.
if (process.env.NODE_ENV !== 'test') {
  startHourlyEscalationScheduler();
}

// Direct-run guard: when this module is the entry point (node backend/dist/server.js
// or tsx backend/src/server.ts) we start the HTTP listener. When it is imported
// as an app factory (e.g. by the Vercel serverless wrapper in api/index.ts), we
// only export the app and let the platform handle invocation — so a serverless
// function never tries to bind a port.
const isDirectRun =
  typeof process !== 'undefined' &&
  typeof process.argv[1] !== 'undefined' &&
  (typeof import.meta.url === 'undefined' ||
    import.meta.url === pathToFileURL(process.argv[1]).href);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  S.A.G.E. Backend Server running on port ${PORT}`);
    console.log(`  Health Check : http://localhost:${PORT}/api/health`);
    console.log(`  Firebase     : ${initMessage}`);
    const isProd = process.env.NODE_ENV === 'production';
    console.log(`  Sealing Key  : ${isProd ? 'SAGE_MASTER_KEY (server-only, production)' : `DEV-ONLY fallback (${String(SAGE_MASTER_KEY).slice(0, 8)}…) — set SAGE_MASTER_KEY for real deployments`}`);
    console.log(`=======================================================`);
  });
}

export default app;
