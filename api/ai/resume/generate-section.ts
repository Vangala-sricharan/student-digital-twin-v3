import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sectionType, targetRole, existingData, studentProfile } = req.body || {};

    if (!sectionType) {
      return res.status(400).json({ error: 'sectionType is required' });
    }

    let prompt = '';
    if (sectionType === 'summary') {
      prompt = `You are a professional technical resume writer.
Generate a concise, high-impact Professional Summary (3-4 sentences, 60-80 words) for a student or junior engineer.

STUDENT DATA:
- Name: ${studentProfile?.name || 'Candidate'}
- Education: ${studentProfile?.degree || 'B.Tech'} in ${studentProfile?.branch || 'Computer Science'}, ${studentProfile?.university || ''} (${studentProfile?.year || 'Current Student'})
- Target Role: ${targetRole || studentProfile?.targetRole || 'Software Engineer'}
- Key Strengths / Tech: ${JSON.stringify(existingData?.skills || [])}
- Projects Highlights: ${JSON.stringify(existingData?.projects || [])}
- Achievements: ${JSON.stringify(existingData?.achievements || [])}

RULES:
- Do NOT invent fake previous employment or years of experience not in the data.
- Emphasize foundational computer science, problem-solving, real technical projects, and career drive.
- Tailor keywords strictly toward ${targetRole || 'their target role'}.
- Output ONLY the summary paragraph text, no extra commentary.`;
    } else if (sectionType === 'project-bullets') {
      prompt = `You are a technical resume expert.
Write 3-4 high-impact, ATS-optimized bullet points for the following student project using the Action-Verb + Technical Implementation + Measurable/Verifiable Outcome format.

PROJECT DETAILS:
- Title: ${existingData?.title || 'Engineering Project'}
- Tech Stack: ${(existingData?.techStack || []).join(', ')}
- Description: ${existingData?.description || ''}
- Architecture / Implementation: ${existingData?.architecture || ''}
- Target Role Alignment: ${targetRole || 'Software Engineering'}

RULES:
- Output a JSON array of strings containing 3 to 4 strong bullet points.
- Do NOT invent non-existent production user bases or fake commercial metrics.
- Focus on technical complexity (APIs, state management, algorithmic efficiency, clean patterns, database schema, concurrency, etc.).
- Return ONLY valid JSON in format: ["bullet 1", "bullet 2", "bullet 3"]`;
    } else if (sectionType === 'ats-tailor') {
      prompt = `You are an ATS (Applicant Tracking System) optimization advisor for software engineering resumes.
Given the candidate's target role and current resume components, provide ATS-tailored recommendations and keyword alignments.

TARGET ROLE: ${targetRole}
CANDIDATE PROFILE: ${JSON.stringify(studentProfile || {})}
CURRENT RESUME DATA: ${JSON.stringify(existingData || {})}

Return a valid JSON object with the following schema:
{
  "tailoredSummary": "A revised 3-4 sentence professional summary optimized for ${targetRole}",
  "recommendedKeywords": ["keyword1", "keyword2", "keyword3"],
  "skillEmphasis": ["skills to highlight prominently"],
  "atsSuggestions": ["concrete suggestion 1", "concrete suggestion 2"]
}
Return ONLY valid JSON.`;
    } else {
      prompt = `Polish and improve the professional tone of the following resume text for a ${targetRole || 'Software Engineer'} role:
Text: "${JSON.stringify(existingData)}"
Return clean, polished text with zero fabrication.`;
    }

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const text = response?.text || '';

    if (sectionType === 'project-bullets' || sectionType === 'ats-tailor') {
      try {
        const parsed = cleanAndParseJSON(text);
        return res.status(200).json({ result: parsed });
      } catch {
        return res.status(200).json({ result: text.trim() });
      }
    }

    return res.status(200).json({ result: text.trim() });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to generate resume section');
  }
}
