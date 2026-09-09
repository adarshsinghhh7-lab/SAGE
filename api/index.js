// Vercel serverless entry point for the S.A.G.E. Express backend.
//
// Vercel maps every /api/* request to this file, and serverless-http adapts the
// Express app (defined in backend/src/server.js) to Vercel's function invocation
// contract. The app is built fresh for each function invocation by the runtime,
// so the direct-run guard in server.js correctly skips app.listen() here.
//
// Configuration keys (SAGE_MASTER_KEY, Firestore credentials) no longer throw at
// module load (see utils/crypto.js) — a missing key is reported through
// GET /api/health and a clear 503 on complaint submission, so the deployed site
// tells you exactly what to fix instead of returning a generic 500/502 that the
// frontend surfaces as "Cannot reach the S.A.G.E. Sealing Server".
import serverless from 'serverless-http';
import app from '../backend/src/server.js';

export default serverless(app);
