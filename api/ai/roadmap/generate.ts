import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { activeProfile, skills, projects, achievements, careerGoals, userId } = req.body || {};

    const targetRole = activeProfile?.targetRole || activeProfile?.careerGoal || 'Software Engineer';

    const prompt = `You are an AI Career Strategist creating a personalized 30-Day, 60-Day, and 90-Day execution roadmap.

STUDENT PROFILE:
- Target Role: ${targetRole}
- University & Year: ${activeProfile?.university || ''} (${activeProfile?.year || 'Student'})
- Current Verified Skills: ${(skills || []).map((s: any) => `${s.skillName} (${s.proficiency})`).join(', ') || 'None recorded'}
- Current Projects: ${(projects || []).map((p: any) => `${p.title} (${p.difficulty})`).join(', ') || 'None recorded'}
- Current Goals: ${(careerGoals || []).map((g: any) => `${g.goal} - Target: ${(g.targetCompanies || []).join(', ')}`).join(', ') || 'None'}

REQUIREMENTS:
- Generate 3 progressive phases:
  1. "30-Day Foundation": Immediate skill gaps & foundational core projects/DSA.
  2. "60-Day Acceleration": Advanced architecture, proof-of-work project build, resume polish.
  3. "90-Day Placement Ready": Mock interviews, portfolio deployment, targeted applications.
- Each phase must contain 4-5 concrete, actionable tasks with specific deliverables and estimated hours.
- DO NOT generate generic copy-paste tasks. Customize strictly for ${targetRole} and their recorded skills.

RETURN STRICT JSON ONLY:
{
  "summary": "2-3 sentence strategic roadmap overview",
  "phases": [
    {
      "phaseName": "30-Day Foundation",
      "days": 30,
      "primaryObjective": "string",
      "milestones": ["milestone 1", "milestone 2"],
      "tasks": [
        {
          "id": "task_30_1",
          "title": "string",
          "description": "string",
          "category": "Skill" | "Project" | "DSA" | "Resume" | "Networking" | "Application",
          "estimatedHours": number,
          "deliverable": "concrete verifiable artifact"
        }
      ]
    },
    {
      "phaseName": "60-Day Acceleration",
      "days": 60,
      "primaryObjective": "string",
      "milestones": ["milestone 1", "milestone 2"],
      "tasks": []
    },
    {
      "phaseName": "90-Day Placement Ready",
      "days": 90,
      "primaryObjective": "string",
      "milestones": ["milestone 1", "milestone 2"],
      "tasks": []
    }
  ]
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    return res.status(200).json({
      id: `rdm_${activeProfile?.id || 'profile'}_${Date.now()}`,
      userId: userId || 'anonymous',
      studentProfileId: activeProfile?.id || 'profile',
      targetRole,
      generatedAt: new Date().toISOString(),
      summary: parsed.summary || `Personalized career roadmap tailored for ${targetRole}.`,
      phases: Array.isArray(parsed.phases) ? parsed.phases : [],
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to generate roadmap');
  }
}
