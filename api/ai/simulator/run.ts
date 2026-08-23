import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { scenario, activeProfile, skills, projects, achievements, currentReadinessScore, userId } = req.body || {};

    const prompt = `You are a Career Trajectory Simulator & Predictive Placement Model.
Simulate what would happen to this student's readiness if they completed the hypothetical actions.

CURRENT STUDENT EVIDENCE:
- Target Role: ${activeProfile?.targetRole || activeProfile?.careerGoal || 'Software Engineer'}
- Current Readiness Score Baseline: ${currentReadinessScore || 45}/100
- Recorded Skills: ${(skills || []).map((s: any) => `${s.skillName} (${s.proficiency})`).join(', ') || 'None'}
- Recorded Projects: ${(projects || []).map((p: any) => p.title).join(', ') || 'None'}

SIMULATED "WHAT-IF" CHANGES:
- Added Skills: ${(scenario?.addedSkills || []).join(', ') || 'None'}
- Added Projects: ${(scenario?.addedProjects || []).join(', ') || 'None'}
- Added Certifications: ${(scenario?.addedCertifications || []).join(', ') || 'None'}
- Improved DSA LeetCode Count: +${scenario?.improvedDsaCount || 0} solved problems
- Improved GitHub Portfolio: ${scenario?.improvedGithub ? 'YES (Active commits, clean READMEs, pinned repos)' : 'No change'}
- Improved LinkedIn Profile: ${scenario?.improvedLinkedin ? 'YES (Optimized headline, featured projects, recommendations)' : 'No change'}
- Improved ATS Resume: ${scenario?.improvedResume ? 'YES (Action verbs, metrics, customized keywords)' : 'No change'}

TASK:
1. Calculate the projected new readiness score (0-100) based on the value of these additions to ${activeProfile?.targetRole || 'their target role'}.
2. Compare Category Impacts (Programming, DSA, Projects, System Design, Professional Presence).
3. Provide a clear rationale explaining WHY the score moved by that amount.
4. Give 3 strategic recommendations on which simulation action has the highest ROI.

RETURN STRICT JSON ONLY:
{
  "currentScore": number,
  "projectedScore": number,
  "scoreDelta": number,
  "rationale": "detailed string explanation",
  "categoryImpacts": [
    {
      "category": "string",
      "current": number,
      "projected": number,
      "diff": number,
      "impactExplanation": "string"
    }
  ],
  "strategicAdvice": ["string"]
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    return res.status(200).json({
      id: `sim_${Date.now()}`,
      userId: userId || 'anonymous',
      simulatedAt: new Date().toISOString(),
      currentScore: Number(parsed.currentScore) || Number(currentReadinessScore) || 45,
      projectedScore: Math.min(100, Math.max(0, Number(parsed.projectedScore) || 55)),
      scoreDelta: Number(parsed.scoreDelta) || 10,
      rationale: parsed.rationale || 'Projection calculated based on technical depth and portfolio impact.',
      categoryImpacts: Array.isArray(parsed.categoryImpacts) ? parsed.categoryImpacts : [],
      strategicAdvice: Array.isArray(parsed.strategicAdvice) ? parsed.strategicAdvice : [],
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to run career simulation');
  }
}
