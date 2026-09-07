import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';
import {defineConfig, type Plugin} from 'vite';

/**
 * Quick TCP reachability probe for a local port.
 * Resolves true when something accepts connections on host:port within timeoutMs.
 */
function isPortOpen(port: number, host = '127.0.0.1', timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

/**
 * S.A.G.E. Sealing Server auto-start.
 *
 * The browser submits grievances through the Vite dev-server proxy to the
 * backend on :5000. If that backend is not running, every submission fails
 * with a "Cannot reach the S.A.G.E. Sealing Server" banner. This plugin makes
 * the dev server start the backend itself (same command as `npm run
 * dev:backend`) whenever port 5000 is not already listening, so `npm run dev`
 * alone is always enough for local development.
 *
 * The frontend lives in `frontend/` (sibling of `backend/`), so the tsx CLI is
 * resolved from the repo root's node_modules and the backend is spawned with
 * the repo root as its working directory.
 */
const repoRoot = path.resolve(__dirname, '..');

function ensureSageBackendRunning(): Plugin {
  return {
    name: 'sage:ensure-backend',
    async configureServer() {
      const isUp = await isPortOpen(5000);
      if (isUp) return; // backend already running (manual `npm run dev:backend`)
      console.log('[sage] Backend not detected on :5000 — auto-starting it (npm run dev:backend)...');

      const cliPath = path.resolve(repoRoot, 'node_modules/tsx/dist/cli.mjs');
      const child = spawn(process.execPath, [cliPath, 'watch', 'backend/src/server.ts'], {
        cwd: repoRoot,
        stdio: 'inherit', // backend logs appear in the same terminal
        env: {...process.env, SAGE_LISTEN: '1'},
      });
      child.on('error', (err) => {
        console.error('[sage] Failed to auto-start the backend:', err.message);
        console.error('[sage] Start it manually in a second terminal: npm run dev:backend');
      });

      // Wait (non-fatal) for the backend to accept connections so the first
      // submission the user makes isn't caught during boot.
      const waitMs = 10_000;
      const startedAt = Date.now();
      while (Date.now() - startedAt < waitMs) {
        await new Promise((r) => setTimeout(r, 700));
        if (await isPortOpen(5000)) {
          console.log('[sage] Backend is up on :5000 — sealing service ready.');
          return;
        }
      }
      console.warn('[sage] Backend did not become reachable on :5000 within ~10s.');
      console.warn('[sage] Start it manually in a second terminal: npm run dev:backend');
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ensureSageBackendRunning()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Forward S.A.G.E. API calls to the backend (Sealing Server) on :5000 so
      // the browser only ever talks to this dev server's own origin. This works
      // both from http://localhost:3000 and from forwarded preview URLs, and
      // removes CORS entirely.
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
