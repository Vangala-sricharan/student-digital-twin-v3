import type { VercelRequest, VercelResponse } from '@vercel/node';
import assistantHandler from './_handlers/ai/assistant.js';
import resumeAnalyzeHandler from './_handlers/ai/resumeAnalyze.js';
import resumeSectionHandler from './_handlers/ai/resumeGenerateSection.js';
import syllabusAnalyzeHandler from './_handlers/ai/syllabusAnalyze.js';
import projectAnalyzeHandler from './_handlers/ai/projectAnalyze.js';
import githubAnalyzeHandler from './_handlers/ai/githubAnalyze.js';
import linkedinAnalyzeHandler from './_handlers/ai/linkedinAnalyze.js';
import internshipAnalyzeHandler from './_handlers/ai/internshipAnalyze.js';
import roadmapGenerateHandler from './_handlers/ai/roadmapGenerate.js';
import simulatorRunHandler from './_handlers/ai/simulatorRun.js';
import portfolioGenerateHandler from './_handlers/ai/portfolioGenerate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Determine action from query or URL
  const actionQuery = Array.isArray(req.query.action) ? req.query.action.join('/') : req.query.action;
  let action = actionQuery || '';

  if (!action && req.url) {
    const cleanUrl = req.url.split('?')[0];
    const match = cleanUrl.match(/^\/api\/ai\/(.+)$/);
    if (match) {
      action = match[1];
    }
  }

  // Normalize action (strip leading/trailing slashes)
  action = action.replace(/^\/+|\/+$/g, '');

  switch (action) {
    case 'assistant':
      return assistantHandler(req, res);
    case 'resume/analyze':
    case 'resume-analyze':
      return resumeAnalyzeHandler(req, res);
    case 'resume/generate-section':
    case 'resume-generate-section':
      return resumeSectionHandler(req, res);
    case 'syllabus/analyze':
    case 'syllabus-analyze':
      return syllabusAnalyzeHandler(req, res);
    case 'project/analyze':
    case 'project-analyze':
      return projectAnalyzeHandler(req, res);
    case 'github/analyze':
    case 'github-analyze':
      return githubAnalyzeHandler(req, res);
    case 'linkedin/analyze':
    case 'linkedin-analyze':
      return linkedinAnalyzeHandler(req, res);
    case 'internship/analyze':
    case 'internship-analyze':
      return internshipAnalyzeHandler(req, res);
    case 'roadmap/generate':
    case 'roadmap-generate':
      return roadmapGenerateHandler(req, res);
    case 'simulator/run':
    case 'simulator-run':
      return simulatorRunHandler(req, res);
    case 'portfolio/generate':
    case 'portfolio-generate':
      return portfolioGenerateHandler(req, res);
    default:
      return res.status(404).json({ error: `Unknown AI action: "${action}"` });
  }
}
