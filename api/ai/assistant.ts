import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, callGeminiStreamWithRetry, handleApiError } from '../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, activeProfile, skills, projects, achievements, careerGoals, history, stream = false } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message query is required' });
    }

    // Static system instructions separated for token caching & fast prompt evaluation
    const systemInstruction = `You are the expert AI Career Intelligence Assistant for the Student Digital Twin OS.
Provide rigorous, evidence-based, concise, and highly actionable career guidance grounded strictly in the student's profile context.
Directives:
1. Reference the student's target role, recorded skills, projects, and achievements.
2. Structure your guidance with clear bold headings, tight bullet points, and concrete next actions.
3. Be encouraging, mentorship-oriented, and realistic. Never invent fake credentials or hallucinations.
4. At the very end on a new line, always provide a section:
SUGGESTED NEXT QUESTIONS:
- [Short follow-up 1]
- [Short follow-up 2]
- [Short follow-up 3]`;

    // Compact, high-signal profile grounding context
    const compactSkills = (skills || [])
      .slice(0, 18)
      .map((s: any) => `${s.skillName} (${s.category || 'Tech'} - ${s.proficiency || 'Intermediate'}, ${s.score || 70}/100)`)
      .join(', ');

    const compactProjects = (projects || [])
      .slice(0, 5)
      .map((p: any) => `• ${p.title} [${p.difficulty || 'Intermediate'}] - Tech: ${(p.techStack || []).join(', ')}. Role: ${p.role || 'Developer'}. Summary: ${p.description || ''}`)
      .join('\n');

    const compactAchievements = (achievements || [])
      .slice(0, 4)
      .map((a: any) => `• ${a.title} (${a.organization || 'Org'}, ${a.date || ''})`)
      .join('\n');

    const compactGoals = (careerGoals || [])
      .slice(0, 2)
      .map((g: any) => `Target: ${g.targetRole} | Companies: ${(g.targetCompanies || []).join(', ')} | Timeline: ${g.timeline || '6-12m'}`)
      .join('; ');

    const compactHistory = (history || [])
      .slice(-4)
      .map((h: any) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n\n');

    const contextPrompt = `STUDENT PROFILE:
- Name: ${activeProfile?.name || 'Student'} | Degree: ${activeProfile?.degree || ''} ${activeProfile?.branch || ''} (${activeProfile?.year || 'Current'})
- Target Role: ${activeProfile?.targetRole || activeProfile?.careerGoal || 'Software / AI Engineer'}
- GitHub: ${activeProfile?.githubUrl ? 'Connected' : 'Not linked'} | LinkedIn: ${activeProfile?.linkedinUrl ? 'Connected' : 'Not linked'}
- Verified Skills: ${compactSkills || 'None recorded yet.'}
- Key Projects:\n${compactProjects || 'None recorded yet.'}
- Key Achievements:\n${compactAchievements || 'None recorded yet.'}
- Career Goals: ${compactGoals || 'General SWE / AI growth'}

${compactHistory ? `RECENT CONVERSATION:\n${compactHistory}\n\n` : ''}USER QUESTION: "${message.trim()}"`;

    // Handle Streaming requests (Server-Sent Events)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      try {
        const responseStream = await callGeminiStreamWithRetry({
          model: 'gemini-2.5-flash',
          contents: contextPrompt,
          config: {
            systemInstruction,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk?.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      } catch (streamErr: any) {
        console.error('[Career Assistant Stream Error]:', streamErr);
        res.write(`data: ${JSON.stringify({ error: streamErr?.message || 'Streaming failed', done: true })}\n\n`);
        return res.end();
      }
    }

    // Standard Non-streaming response fallback
    const response = await callGeminiWithRetry({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction,
      },
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
