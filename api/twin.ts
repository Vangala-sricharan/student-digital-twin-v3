import type { VercelRequest, VercelResponse } from '@vercel/node';
import profileHandler from './_handlers/twin/profile.js';
import studentsHandler from './_handlers/twin/students.js';
import skillsHandler from './_handlers/twin/skills.js';
import projectsHandler from './_handlers/twin/projects.js';
import achievementsHandler from './_handlers/twin/achievements.js';
import careerGoalsHandler from './_handlers/twin/careerGoals.js';
import itemHandler from './_handlers/twin/item.js';
import loadHandler from './_handlers/twin/load.js';
import syncHandler from './_handlers/twin/sync.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[TWIN_API_ENTRY_REACHED]', {
    method: req.method,
    url: req.url,
    headersSize: req.headers ? JSON.stringify(req.headers).length : 0,
    hasAuth: Boolean(req.headers.authorization),
  });
  // Determine module from query or URL
  const moduleQuery = Array.isArray(req.query.module) ? req.query.module.join('/') : req.query.module;
  let mod = moduleQuery || '';

  if (!mod && req.url) {
    const cleanUrl = req.url.split('?')[0];
    const match = cleanUrl.match(/^\/api\/twin\/(.+)$/);
    if (match) {
      mod = match[1];
    }
  }

  // Normalize module name
  mod = mod.replace(/^\/+|\/+$/g, '');

  switch (mod) {
    case 'profile':
      return profileHandler(req, res);
    case 'students':
    case 'student-twins':
      return studentsHandler(req, res);
    case 'skills':
      return skillsHandler(req, res);
    case 'projects':
      return projectsHandler(req, res);
    case 'achievements':
      return achievementsHandler(req, res);
    case 'career-goals':
    case 'career_goals':
      return careerGoalsHandler(req, res);
    case 'item':
      return itemHandler(req, res);
    case 'load':
      return loadHandler(req, res);
    case 'sync':
      return syncHandler(req, res);
    default:
      return res.status(404).json({ error: `Unknown Twin module: "${mod}"` });
  }
}
