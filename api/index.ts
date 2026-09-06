// Vercel serverless entry point for the S.A.G.E. Express backend.
//
// Vercel maps every /api/* request to this file, and serverless-http adapts the
// Express app (defined in backend/src/server.ts) to Vercel's function invocation
// contract. The app is built fresh for each function invocation by the runtime,
// so the direct-run guard in server.ts correctly skips app.listen() here.
import serverless from 'serverless-http';
import app from '../backend/src/server.js';

export const handler = serverless(app);
