import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import Vercel Serverless Function Handlers
import healthHandler from './api/health.ts';
import aiHandler from './api/ai.ts';
import twinHandler from './api/twin.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Comprehensive Layer Diagnostic Logger (Never logs tokens or secrets)
app.use((req, res, next) => {
  const method = req.method;
  const path = req.path;
  if (path.startsWith('/api/')) {
    const queryStr = req.url.includes('?') ? req.url.split('?')[1] : '';
    const querySize = Buffer.byteLength(queryStr || '', 'utf8');
    const bodySize = req.body ? Buffer.byteLength(JSON.stringify(req.body), 'utf8') : 0;
    const authHeaderPresent = Boolean(req.headers['authorization'] || req.headers['Authorization']);

    console.log(
      `[REQUEST START]\nMETHOD: ${method}\nPATH: ${path}\nQUERY PARAMETERS SIZE: ${querySize} bytes\nREQUEST BODY SIZE: ${bodySize} bytes\nAUTH HEADER PRESENT: ${authHeaderPresent}`
    );

    res.on('finish', () => {
      console.log(`[FINAL API RESPONSE STATUS] ${method} ${path} -> Status: ${res.statusCode}`);
    });
  }
  next();
});

// ==============================================================================
// SERVERLESS FUNCTION ROUTES DELEGATION (Matches Vercel /api/* routing)
// ==============================================================================
app.all('/api/health', async (req, res) => {
  try {
    await healthHandler(req as any, res as any);
  } catch (err: any) {
    console.error('[Health Handler Error]:', err);
    if (!res.headersSent) res.status(500).json({ error: err?.message || 'Server error' });
  }
});
app.all('/api/twin*', async (req, res) => {
  try {
    await twinHandler(req as any, res as any);
  } catch (err: any) {
    console.error('[Twin Handler Error]:', err);
    if (!res.headersSent) res.status(500).json({ error: err?.message || 'Server error' });
  }
});
app.all('/api/ai*', async (req, res) => {
  try {
    await aiHandler(req as any, res as any);
  } catch (err: any) {
    console.error('[AI Handler Error]:', err);
    if (!res.headersSent) res.status(500).json({ error: err?.message || 'Server error' });
  }
});

// ==============================================================================
// VITE MIDDLEWARE & STATIC SERVING
// ==============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Student Digital Twin OS serverless bridge running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
