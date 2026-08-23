import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { project, userId } = req.body || {};

    if (!project || !project.id || !project.title) {
      return res.status(400).json({ error: 'Valid project record is required' });
    }

    // Check public GitHub repository if available
    let repoEvidence: any = null;
    let isVerifiedRepo = false;

    if (project.githubUrl && project.githubUrl.includes('github.com')) {
      try {
        const urlMatch = project.githubUrl.match(/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/);
        if (urlMatch) {
          const owner = urlMatch[1];
          const repo = urlMatch[2].replace(/\.git$/, '');
          const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              'User-Agent': 'StudentDigitalTwin-V3',
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (ghRes.ok) {
            const ghData: any = await ghRes.json();
            isVerifiedRepo = true;
            repoEvidence = {
              stars: ghData.stargazers_count || 0,
              forks: ghData.forks_count || 0,
              languages: [ghData.language].filter(Boolean),
              hasReadme: Boolean(ghData.has_wiki || ghData.description),
              lastPush: ghData.pushed_at,
              openIssues: ghData.open_issues_count || 0,
            };
          }
        }
      } catch (err) {
        console.warn('GitHub repo verification notice:', err);
      }
    }

    const prompt = `You are a Principal Software Architect evaluating an engineering portfolio project.

EVALUATE THIS EXACT PROJECT AND ONLY THIS PROJECT:
- Project ID: ${project.id}
- Title: ${project.title}
- Description: ${project.description || 'No description provided'}
- System Architecture: ${project.architecture || 'No architectural details provided'}
- Tech Stack: ${(project.techStack || []).join(', ') || 'None specified'}
- GitHub URL: ${project.githubUrl || 'None provided'}
- Live Demo URL: ${project.liveDemoUrl || 'None provided'}
- Contributor Role: ${project.role || 'Sole Developer'}
- Claimed Difficulty: ${project.difficulty || 'Intermediate'}
- Status: ${project.status || 'Completed'}
- Verified Repository Metadata: ${repoEvidence ? JSON.stringify(repoEvidence) : 'Repository not verified or private'}

SCORING RUBRIC (Max Total = 100):
1. Architecture (Max 10): Modular design, decoupling, layered structure, data flow clarity.
2. Technical Depth (Max 15): Algorithmic complexity, concurrency, custom logic vs boilerplate wrapper.
3. Complexity (Max 10): State management, error boundaries, performance considerations.
4. Tech Stack Quality (Max 10): Appropriateness of selected tools, modern frameworks, ecosystem maturity.
5. Backend & Database (Max 10): Schema design, ORM/query efficiency, caching, API design (or state persistence).
6. Authentication & Security (Max 10): Sanitization, auth flows, environment variable management, role control.
7. Scalability (Max 10): Statelessness, containerization, async operations, load handling.
8. Testing & Evidence (Max 10): Automated unit/integration tests, CI/CD, verifiable commits/proof of work.
9. Deployment & Docs (Max 10): Live demo availability, detailed README, setup guides, API docs.
10. Resume Impact (Max 5): Recruiter appeal, industry alignment, distinctiveness.

CRITICAL RULES:
- DO NOT assign default 98/100 or static scores.
- If an architectural component (e.g., auth, backend, testing, deployment) is absent or not mentioned in the evidence, award 0 to 2 points for that category and explicitly state its absence in weaknesses.
- Different projects with different details MUST receive distinct, evidence-based scores.

RETURN STRICT JSON ONLY:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "architecture": number (0-10),
    "technicalDepth": number (0-15),
    "complexity": number (0-10),
    "techStackQuality": number (0-10),
    "backendDatabase": number (0-10),
    "authAndSecurity": number (0-10),
    "scalability": number (0-10),
    "testingAndEvidence": number (0-10),
    "deploymentAndDocs": number (0-10),
    "resumeImpact": number (0-5)
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    const result = {
      id: `proj_ana_${project.id}_${Date.now()}`,
      userId: userId || 'anonymous',
      projectId: project.id,
      projectTitle: project.title,
      analysisDate: new Date().toISOString(),
      overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 0)),
      categoryScores: {
        architecture: Number(parsed.categoryScores?.architecture) || 0,
        technicalDepth: Number(parsed.categoryScores?.technicalDepth) || 0,
        complexity: Number(parsed.categoryScores?.complexity) || 0,
        techStackQuality: Number(parsed.categoryScores?.techStackQuality) || 0,
        backendDatabase: Number(parsed.categoryScores?.backendDatabase) || 0,
        authAndSecurity: Number(parsed.categoryScores?.authAndSecurity) || 0,
        scalability: Number(parsed.categoryScores?.scalability) || 0,
        testingAndEvidence: Number(parsed.categoryScores?.testingAndEvidence) || 0,
        deploymentAndDocs: Number(parsed.categoryScores?.deploymentAndDocs) || 0,
        resumeImpact: Number(parsed.categoryScores?.resumeImpact) || 0,
      },
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      evidenceSummary: {
        hasTechStack: Boolean(project.techStack?.length),
        hasGithub: Boolean(project.githubUrl),
        hasLiveDemo: Boolean(project.liveDemoUrl),
        hasArchitecture: Boolean(project.architecture),
        isVerifiedRepo,
        repoDetails: repoEvidence || undefined,
      },
    };

    return res.status(200).json(result);
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze project');
  }
}
