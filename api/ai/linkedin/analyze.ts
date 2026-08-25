import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { linkedinUrl, profileText, profileBase64, targetRole, userId } = req.body || {};

    let normalizedUrl = (linkedinUrl || '').trim();
    if (!normalizedUrl) {
      normalizedUrl = 'https://linkedin.com/in/student';
    } else if (!normalizedUrl.includes('linkedin.com')) {
      const cleanHandle = normalizedUrl.replace(/^https?:\/\//, '').replace(/^in\//, '').replace(/^\/+/, '');
      normalizedUrl = `https://linkedin.com/in/${cleanHandle}`;
    } else if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    if (!profileText && !profileBase64) {
      return res.status(422).json({
        error: 'LinkedIn requires authentication to view profiles publicly. Please paste your LinkedIn profile text or upload your profile PDF (LinkedIn Profile → More → Save to PDF) for real analysis.',
        requiresInput: true,
      });
    }

    const rubricPrompt = `You are a Principal Tech Recruiter and LinkedIn Profile Optimizer.
Analyze the candidate's actual LinkedIn profile for a student targeting: "${targetRole || 'Software / AI Engineer'}".

SCORING RUBRIC (Max Total = 100):
1. Profile Completeness (Max 15): Headshot, banner, complete sections, contact info.
2. Headline & Positioning (Max 15): Clear role target, key technologies, value proposition vs generic "Student at XYZ".
3. About Section (Max 15): Story, technical depth, achievements, clear call-to-action.
4. Skills & Endorsements (Max 15): Key engineering keywords, modern tech stack representation.
5. Projects & Featured (Max 15): Proof of work, GitHub links, live demos, publications.
6. Experience / Internships (Max 10): Action verbs, technical impact, responsibilities.
7. Education & Certifications (Max 5): Degree details, relevant coursework, credentials.
8. Professional Presentation (Max 5): Grammar, tone, formatting.
9. Career Alignment (Max 5): Specific positioning towards ${targetRole || 'target role'}.

RULES:
- Evaluate ONLY the provided evidence.
- No fabricated scores.

RETURN STRICT JSON ONLY:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "profileCompleteness": number (0-15),
    "headlinePositioning": number (0-15),
    "aboutSection": number (0-15),
    "skillsEndorsements": number (0-15),
    "projectsPortfolio": number (0-15),
    "experienceInternships": number (0-10),
    "educationCertifications": number (0-5),
    "professionalPresentation": number (0-5),
    "careerAlignment": number (0-5)
  },
  "extractedSummary": {
    "headline": "string",
    "about": "string",
    "skillsCount": number,
    "experienceCount": number
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "highestImpactImprovements": ["string"],
  "recruiterFacingTips": ["string"]
}`;

    let contents: any[] = [];
    if (profileBase64) {
      contents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: profileBase64,
          },
        },
        { text: rubricPrompt },
      ];
    } else {
      contents = [
        {
          text: `${rubricPrompt}\n\nLINKEDIN PROFILE CONTENT:\n${profileText}`,
        },
      ];
    }

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    return res.status(200).json({
      id: `li_ana_${Date.now()}`,
      userId: userId || 'anonymous',
      linkedinUrl: normalizedUrl,
      analyzedAt: new Date().toISOString(),
      evidenceSource: profileBase64 ? 'pdf' : 'text',
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 0)),
      categoryScores: {
        profileCompleteness: Number(parsed.categoryScores?.profileCompleteness) || 0,
        headlinePositioning: Number(parsed.categoryScores?.headlinePositioning) || 0,
        aboutSection: Number(parsed.categoryScores?.aboutSection) || 0,
        skillsEndorsements: Number(parsed.categoryScores?.skillsEndorsements) || 0,
        projectsPortfolio: Number(parsed.categoryScores?.projectsPortfolio) || 0,
        experienceInternships: Number(parsed.categoryScores?.experienceInternships) || 0,
        educationCertifications: Number(parsed.categoryScores?.educationCertifications) || 0,
        professionalPresentation: Number(parsed.categoryScores?.professionalPresentation) || 0,
        careerAlignment: Number(parsed.categoryScores?.careerAlignment) || 0,
      },
      extractedSummary: parsed.extractedSummary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      highestImpactImprovements: Array.isArray(parsed.highestImpactImprovements) ? parsed.highestImpactImprovements : [],
      recruiterFacingTips: Array.isArray(parsed.recruiterFacingTips) ? parsed.recruiterFacingTips : [],
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze LinkedIn profile');
  }
}
