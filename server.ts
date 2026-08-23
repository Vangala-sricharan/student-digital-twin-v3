import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import Vercel Serverless Function Handlers
import healthHandler from './api/health.ts';
import assistantHandler from './api/ai/assistant.ts';
import resumeSectionHandler from './api/ai/resume/generate-section.ts';
import resumeAnalyzeHandler from './api/ai/resume/analyze.ts';
import syllabusAnalyzeHandler from './api/ai/syllabus/analyze.ts';
import projectAnalyzeHandler from './api/ai/project/analyze.ts';
import githubAnalyzeHandler from './api/ai/github/analyze.ts';
import linkedinAnalyzeHandler from './api/ai/linkedin/analyze.ts';
import internshipAnalyzeHandler from './api/ai/internship/analyze.ts';
import roadmapGenerateHandler from './api/ai/roadmap/generate.ts';
import simulatorRunHandler from './api/ai/simulator/run.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ==============================================================================
// SERVERLESS FUNCTION ROUTES DELEGATION (Matches Vercel /api/* routing)
// ==============================================================================
app.all('/api/health', (req, res) => healthHandler(req as any, res as any));
app.all('/api/ai/assistant', (req, res) => assistantHandler(req as any, res as any));
app.all('/api/ai/resume/generate-section', (req, res) => resumeSectionHandler(req as any, res as any));
app.all('/api/ai/resume/analyze', (req, res) => resumeAnalyzeHandler(req as any, res as any));
app.all('/api/ai/syllabus/analyze', (req, res) => syllabusAnalyzeHandler(req as any, res as any));
app.all('/api/ai/project/analyze', (req, res) => projectAnalyzeHandler(req as any, res as any));
app.all('/api/ai/github/analyze', (req, res) => githubAnalyzeHandler(req as any, res as any));
app.all('/api/ai/linkedin/analyze', (req, res) => linkedinAnalyzeHandler(req as any, res as any));
app.all('/api/ai/internship/analyze', (req, res) => internshipAnalyzeHandler(req as any, res as any));
app.all('/api/ai/roadmap/generate', (req, res) => roadmapGenerateHandler(req as any, res as any));
app.all('/api/ai/simulator/run', (req, res) => simulatorRunHandler(req as any, res as any));

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
