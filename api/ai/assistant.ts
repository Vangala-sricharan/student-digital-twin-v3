import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, handleApiError } from '../_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, activeProfile, skills, projects, achievements, careerGoals, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message query is required' });
    }

    // Ground the assistant strictly in the active user's empirical data
    const contextPrompt = `You are the AI Career Assistant for a Student Digital Twin OS.
You must provide rigorous, evidence-based, empathetic, and actionable career guidance.

CRITICAL DIRECTIVES:
1. Ground your advice STRICTLY in the student's real profile data provided below.
2. If the user asks about missing skills or readiness, analyze the gap between their actual recorded skills/projects and standard expectations for their Target Role.
3. NEVER invent fake companies, fake work experiences, fake certifications, or make up metrics.
4. If there is insufficient evidence to give a confident answer, say so honestly and provide the exact step they need to record.
5. Format your response cleanly with clear headings, bullet points, and actionable next steps.

STUDENT DIGITAL TWIN CONTEXT:
- Name: ${activeProfile?.name || 'Student'}
- University: ${activeProfile?.university || 'Not specified'}
- Degree & Branch: ${activeProfile?.degree || ''} ${activeProfile?.branch || ''} (${activeProfile?.year || 'Year unspecified'})
- Target Role: ${activeProfile?.targetRole || activeProfile?.careerGoal || 'Software Engineer / AI Engineer'}
- Bio: ${activeProfile?.bio || 'None provided'}
- GitHub: ${activeProfile?.githubUrl || 'Not linked'}
- LinkedIn: ${activeProfile?.linkedinUrl || 'Not linked'}

RECORDED SKILLS (${skills?.length || 0}):
${(skills || []).map((s: any) => `- ${s.skillName} (${s.category} | ${s.proficiency} | Score: ${s.score}/100)`).join('\n') || 'No skills recorded yet.'}

RECORDED PROJECTS (${projects?.length || 0}):
${(projects || []).map((p: any) => `- ${p.title} (${p.difficulty} | Role: ${p.role} | Tech: ${(p.techStack || []).join(', ')} | Status: ${p.status})\n  Description: ${p.description}\n  Architecture: ${p.architecture || 'None'}\n  GitHub: ${p.githubUrl || 'None'}`).join('\n\n') || 'No projects recorded yet.'}

RECORDED ACHIEVEMENTS & CERTIFICATIONS (${achievements?.length || 0}):
${(achievements || []).map((a: any) => `- ${a.title} by ${a.organization} (${a.date}): ${a.description}`).join('\n') || 'No achievements recorded yet.'}

RECORDED CAREER GOALS:
${(careerGoals || []).map((g: any) => `- Target: ${g.targetRole} | Companies: ${(g.targetCompanies || []).join(', ')} | Timeline: ${g.timeline}\n  Required Skills Target: ${(g.requiredSkills || []).join(', ')}`).join('\n') || 'No explicit career goals recorded yet.'}

RECENT CONVERSATION HISTORY:
${(history || []).slice(-6).map((h: any) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')}

USER QUESTION: "${message}"

Respond directly to the user in a helpful, mentoring tone. Include 2-3 specific suggested follow-up prompts at the very end in a section labeled "SUGGESTED NEXT QUESTIONS:".`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: contextPrompt,
    });

    const text = response?.text || 'Unable to generate career guidance at this time.';

    // Extract suggested next prompts if present
    let content = text;
    let suggestedPrompts: string[] = [];
    if (text && text.includes('SUGGESTED NEXT QUESTIONS:')) {
      const parts = text.split('SUGGESTED NEXT QUESTIONS:');
      content = (parts[0] || '').trim();
      const rawPrompts = (parts[1] || '').trim().split('\n');
      suggestedPrompts = rawPrompts
        .map((p) => p.replace(/^[-*0-9.)\s]+/, '').trim())
        .filter((p) => p.length > 5 && p.length < 120)
        .slice(0, 3);
    }

    return res.status(200).json({
      content,
      suggestedPrompts: suggestedPrompts.length > 0 ? suggestedPrompts : [
        'Which skills should I prioritize next for my target role?',
        'How can I improve my project architectures?',
        'What should be my 30-day focus plan?',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to process assistant request');
  }
}
