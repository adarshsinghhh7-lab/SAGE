import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate } from './middleware/authMiddleware';
import complaintRoutes from './routes/complaintRoutes';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import healthRoutes from './routes/healthRoutes';
import { FirestoreService } from './services/firestoreService';
import { startHourlyEscalationScheduler } from './services/escalationService';
import { isFirebaseLive, initMessage } from './config/firebaseAdmin';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (port 3000 / 5173 / all origins)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sage-role', 'x-sage-uid'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      analytics: 'GET /api/analytics',
      escalationSettings: 'GET/PUT /api/settings/escalation[/threshold]',
      runEscalationNow: 'POST /api/settings/escalation/run',
      authMe: 'GET /api/auth/me',
      setRole: 'POST /api/auth/set-role',
    },
    firebaseStatus: isFirebaseLive ? 'Connected' : 'Fallback / In-Memory Sandbox',
  });
});

// Seed data on startup
FirestoreService.seedIfEmpty().catch((err: any) => {
  console.warn(`[Startup Seeding] ${err?.message}`);
});

// Hourly automatic complaint escalation job (see services/escalationService.ts)
// Skips NODE_ENV=test so test suites never arm long timers.
if (process.env.NODE_ENV !== 'test') {
  startHourlyEscalationScheduler();
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  S.A.G.E. Backend Server running on port ${PORT}`);
    console.log(`  Health Check : http://localhost:${PORT}/api/health`);
    console.log(`  Firebase     : ${initMessage}`);
    console.log(`=======================================================`);
  });
}

export default app;
