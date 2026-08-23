import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { syllabusText, syllabusTitle, targetRole, userId } = req.body || {};

    if (!syllabusText || typeof syllabusText !== 'string' || syllabusText.trim().length < 20) {
      return res.status(400).json({ error: 'Syllabus text of at least 20 characters is required' });
    }

    const prompt = `You are an Academic Syllabus and Computer Science Curriculum Analyst.
Analyze the following university coursework syllabus for a student targeting: "${targetRole || 'Software / AI Engineer'}".

SYLLABUS TITLE: ${syllabusTitle || 'Course Curriculum'}
SYLLABUS CONTENT:
${syllabusText}

ANALYSIS REQUIREMENTS:
1. Break down the actual topics present in the syllabus into units/modules. Do NOT invent syllabus topics not mentioned.
2. Identify high-priority topics critical for technical interviews and industry readiness.
3. Identify conceptually difficult topics that require dedicated focus.
4. Highlight skill gaps between this academic syllabus and modern industry production standards for "${targetRole || 'the target role'}".
5. Formulate an optimized sequential learning order (Learning Sequence).
6. Create a 4-to-6 module structured Study & Revision Plan with concrete action items.
7. Assign an empirical Career Relevance Score (0 to 100) reflecting how directly this course impacts industry hiring.

RETURN STRICT JSON ONLY matching this exact structure:
{
  "totalTopicsCount": number,
  "topicBreakdown": [
    {
      "unitName": "string",
      "topics": ["topic 1", "topic 2"],
      "priority": "High" | "Medium" | "Low",
      "difficulty": "Easy" | "Moderate" | "Challenging",
      "industryRelevance": "string explanation"
    }
  ],
  "priorityTopics": ["string"],
  "difficultTopics": ["string"],
  "skillGapsForIndustry": ["string"],
  "learningSequence": [
    {
      "step": number,
      "title": "string",
      "topics": ["string"],
      "rationale": "string"
    }
  ],
  "studyPlan": [
    {
      "weekOrModule": "string",
      "focusAreas": ["string"],
      "actionItems": ["string"],
      "expectedOutcome": "string"
    }
  ],
  "careerRelevanceScore": number (0-100),
  "careerRelevanceSummary": "string"
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    return res.status(200).json({
      id: `syl_ana_${Date.now()}`,
      userId: userId || 'anonymous',
      syllabusTitle: syllabusTitle || 'Coursework Syllabus',
      targetRole: targetRole || 'Software Engineer',
      analyzedAt: new Date().toISOString(),
      totalTopicsCount: Number(parsed.totalTopicsCount) || (parsed.topicBreakdown?.length || 0) * 3,
      topicBreakdown: Array.isArray(parsed.topicBreakdown) ? parsed.topicBreakdown : [],
      priorityTopics: Array.isArray(parsed.priorityTopics) ? parsed.priorityTopics : [],
      difficultTopics: Array.isArray(parsed.difficultTopics) ? parsed.difficultTopics : [],
      skillGapsForIndustry: Array.isArray(parsed.skillGapsForIndustry) ? parsed.skillGapsForIndustry : [],
      learningSequence: Array.isArray(parsed.learningSequence) ? parsed.learningSequence : [],
      studyPlan: Array.isArray(parsed.studyPlan) ? parsed.studyPlan : [],
      careerRelevanceScore: Math.min(100, Math.max(0, Number(parsed.careerRelevanceScore) || 0)),
      careerRelevanceSummary: parsed.careerRelevanceSummary || 'Curriculum analysis completed.',
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze syllabus');
  }
}
