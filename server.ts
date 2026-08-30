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
import portfolioGenerateHandler from './api/ai/portfolio/generate.ts';
import twinLoadHandler from './api/twin/load.ts';
import twinSyncHandler from './api/twin/sync.ts';
import twinItemHandler from './api/twin/item.ts';
import twinProfileHandler from './api/twin/profile.ts';
import twinStudentsHandler from './api/twin/students.ts';
import twinSkillsHandler from './api/twin/skills.ts';
import twinProjectsHandler from './api/twin/projects.ts';
import twinAchievementsHandler from './api/twin/achievements.ts';
import twinCareerGoalsHandler from './api/twin/career-goals.ts';

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
app.all('/api/health', (req, res) => healthHandler(req as any, res as any));
app.all('/api/twin/profile', (req, res) => twinProfileHandler(req as any, res as any));
app.all('/api/twin/students', (req, res) => twinStudentsHandler(req as any, res as any));
app.all('/api/twin/student-twins', (req, res) => twinStudentsHandler(req as any, res as any));
app.all('/api/twin/skills', (req, res) => twinSkillsHandler(req as any, res as any));
app.all('/api/twin/projects', (req, res) => twinProjectsHandler(req as any, res as any));
app.all('/api/twin/achievements', (req, res) => twinAchievementsHandler(req as any, res as any));
app.all('/api/twin/career-goals', (req, res) => twinCareerGoalsHandler(req as any, res as any));
app.all('/api/twin/load', (req, res) => twinLoadHandler(req as any, res as any));
app.all('/api/twin/sync', (req, res) => twinSyncHandler(req as any, res as any));
app.all('/api/twin/item', (req, res) => twinItemHandler(req as any, res as any));
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
app.all('/api/ai/portfolio/generate', (req, res) => portfolioGenerateHandler(req as any, res as any));

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
