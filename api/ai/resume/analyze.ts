import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resumeText, resumeBase64, targetRole, userId } = req.body || {};

    if (!resumeText && !resumeBase64) {
      return res.status(400).json({ error: 'Either resume text or PDF document is required' });
    }

    let contents: any[] = [];

    const systemPrompt = `You are an expert Technical Resume Evaluator and ATS Hiring Auditor.
Evaluate the provided resume for an aspiring engineer targeting the role of: "${targetRole || 'Software / AI Engineer'}".

EVALUATION CRITERIA:
1. Impact & Clarity (Max 25): Strong action verbs, quantifiable achievements, concise structure.
2. Skills Coverage (Max 25): Relevant languages, frameworks, developer tools, core CS foundations.
3. Project Depth (Max 20): Architectural description, tech stack explanation, real problem solving.
4. ATS Readability (Max 15): Standard section headers, readable layout, parseable structure.
5. Structure & Formatting (Max 15): Clear contact info, clean chronology, professional hierarchy.

Total Score = sum of the 5 categories (0 to 100).
DO NOT assign random or generic scores. Base every point directly on the concrete evidence present in the text.
If the text is empty or meaningless, assign 0 and state "Insufficient evidence".

RETURN STRICT JSON ONLY matching this exact structure:
{
  "overallScore": number (0-100),
  "categories": {
    "impactAndClarity": number (0-25),
    "skillsCoverage": number (0-25),
    "projectDepth": number (0-20),
    "atsReadability": number (0-15),
    "structureAndFormatting": number (0-15)
  },
  "detectedSkills": ["string"],
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "projectQualityFeedback": ["string"],
  "careerAlignment": "string assessment for ${targetRole || 'target role'}",
  "actionableSuggestions": ["string"]
}`;

    if (resumeBase64) {
      contents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: resumeBase64,
          },
        },
        { text: systemPrompt },
      ];
    } else {
      contents = [
        {
          text: `${systemPrompt}\n\nRESUME CONTENT TO EVALUATE:\n${resumeText}`,
        },
      ];
    }

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    // Validation
    const overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 0));

    return res.status(200).json({
      id: `res_ana_${Date.now()}`,
      userId: userId || 'anonymous',
      analyzedAt: new Date().toISOString(),
      targetRole: targetRole || 'Software Engineer',
      overallScore,
      categories: {
        impactAndClarity: Number(parsed.categories?.impactAndClarity) || 0,
        skillsCoverage: Number(parsed.categories?.skillsCoverage) || 0,
        projectDepth: Number(parsed.categories?.projectDepth) || 0,
        atsReadability: Number(parsed.categories?.atsReadability) || 0,
        structureAndFormatting: Number(parsed.categories?.structureAndFormatting) || 0,
      },
      detectedSkills: Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      projectQualityFeedback: Array.isArray(parsed.projectQualityFeedback) ? parsed.projectQualityFeedback : [],
      careerAlignment: parsed.careerAlignment || 'Alignment evaluated against target role specifications.',
      actionableSuggestions: Array.isArray(parsed.actionableSuggestions) ? parsed.actionableSuggestions : [],
      rawTextPreview: resumeText ? resumeText.slice(0, 300) : undefined,
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze resume');
  }
}
