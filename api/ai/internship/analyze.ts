import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { activeProfile, skills, projects, achievements, careerGoals, userId } = req.body || {};

    const prompt = `You are a University Career Placement Director and Technical Internship Evaluator.
Evaluate the current Internship Readiness for this active student profile.

STUDENT RECORD DATA:
- Name: ${activeProfile?.name || 'Student'}
- Degree & Year: ${activeProfile?.degree || ''} ${activeProfile?.branch || ''} (${activeProfile?.year || 'Unspecified'})
- Target Role: ${activeProfile?.targetRole || activeProfile?.careerGoal || 'Software Engineer'}
- Verified Skills (${skills?.length || 0}): ${JSON.stringify(skills || [])}
- Recorded Projects (${projects?.length || 0}): ${JSON.stringify(projects || [])}
- Achievements (${achievements?.length || 0}): ${JSON.stringify(achievements || [])}
- Career Goals: ${JSON.stringify(careerGoals || [])}
- GitHub: ${activeProfile?.githubUrl || 'None'}
- LinkedIn: ${activeProfile?.linkedinUrl || 'None'}

EVALUATION CRITERIA:
- Evaluate 5 core pillars:
  1. Coding & DSA Readiness (0-100)
  2. Project Proof-of-Work (0-100)
  3. Resume Health & Readiness (0-100)
  4. Online Presence (GitHub / LinkedIn) (0-100)
  5. Role & Domain Alignment (0-100)
- Overall Score = weighted average (0-100).
- Readiness Level: "Not Ready" (<30), "Early Preparation" (30-50), "Approaching Readiness" (51-70), "Internship Ready" (71-85), "Highly Competitive" (>85).
- If key evidence (e.g., DSA, projects, github) is missing, assign low scores accordingly and flag as blockers.

RETURN STRICT JSON ONLY:
{
  "overallScore": number (0-100),
  "readinessLevel": "Not Ready" | "Early Preparation" | "Approaching Readiness" | "Internship Ready" | "Highly Competitive",
  "categoryBreakdown": {
    "codingAndDSA": { "score": number, "status": "string" },
    "projectProofOfWork": { "score": number, "status": "string" },
    "resumeHealth": { "score": number, "status": "string" },
    "onlinePresence": { "score": number, "status": "string" },
    "roleAlignment": { "score": number, "status": "string" }
  },
  "strengths": ["string"],
  "blockers": ["string"],
  "priorityActions": ["string"],
  "missingEvidence": ["string"],
  "nextSteps": ["string"]
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    return res.status(200).json({
      id: `int_ana_${activeProfile?.id || 'profile'}_${Date.now()}`,
      userId: userId || 'anonymous',
      studentProfileId: activeProfile?.id || 'profile',
      analyzedAt: new Date().toISOString(),
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 0)),
      readinessLevel: parsed.readinessLevel || 'Approaching Readiness',
      categoryBreakdown: parsed.categoryBreakdown || {},
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
      priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
      missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze internship readiness');
  }
}
