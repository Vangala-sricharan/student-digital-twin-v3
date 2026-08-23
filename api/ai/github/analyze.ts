import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let evidenceSummary: any = null;
  try {
    const { githubUrl, userId } = req.body || {};

    if (!githubUrl || typeof githubUrl !== 'string' || !githubUrl.trim()) {
      return res.status(400).json({ error: 'GitHub profile or repository URL is required.' });
    }

    const trimmedUrl = githubUrl.trim();

    // Validate and extract username dynamically
    const cleanUrl = trimmedUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const pathParts = cleanUrl.split('/').filter(Boolean);

    let username = '';
    if (cleanUrl.startsWith('github.com/')) {
      username = pathParts[1] || '';
    } else if (pathParts.length === 1 && /^[a-zA-Z0-9_-]+$/.test(pathParts[0])) {
      username = pathParts[0];
    } else {
      return res.status(400).json({
        error: 'Invalid GitHub URL. Must be in the format: https://github.com/username',
      });
    }

    username = username.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!username) {
      return res.status(400).json({
        error: 'Invalid GitHub username detected. Please provide a valid URL like https://github.com/username',
      });
    }

    // Step 2: Fetch public evidence via GitHub API
    let userProfileData: any = null;
    let reposData: any[] = [];
    let eventsData: any[] = [];

    try {
      const headers = {
        'User-Agent': 'StudentDigitalTwinOS-V3',
        Accept: 'application/vnd.github.v3+json',
      };

      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });

      if (userRes.status === 404) {
        return res.status(404).json({ error: `GitHub profile "@${username}" was not found on GitHub. Please check username spelling.` });
      }

      if (userRes.status === 403 || userRes.status === 429) {
        return res.status(429).json({ error: 'GitHub API rate limit reached. Please wait a moment before running another audit.' });
      }

      if (!userRes.ok) {
        return res.status(400).json({ error: `GitHub API returned HTTP ${userRes.status}. Profile could not be verified.` });
      }

      userProfileData = await userRes.json();

      // Repositories
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`, { headers });
      if (reposRes.ok) {
        reposData = await reposRes.json();
      }

      // Public events (activity / commit cadence)
      const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, { headers });
      if (eventsRes.ok) {
        eventsData = await eventsRes.json();
      }
    } catch (apiErr: any) {
      console.warn('GitHub API network error:', apiErr);
      return res.status(503).json({ error: `Failed to connect to GitHub API: ${apiErr.message || 'Network timeout'}. Please verify connection.` });
    }

    // Step 3: Process and sample real documentation & repositories
    const languagesCountMap: Record<string, number> = {};
    let totalStars = 0;
    let totalForks = 0;

    const originalRepos = (reposData || []).filter((r: any) => !r.fork);
    const forkedRepos = (reposData || []).filter((r: any) => r.fork);

    // Inspect top repositories and check README availability
    const topReposSample = (reposData || []).slice(0, 10);
    const topRepositoriesWithReadme = await Promise.all(
      topReposSample.map(async (r: any, idx: number) => {
        if (r.language) {
          languagesCountMap[r.language] = (languagesCountMap[r.language] || 0) + 1;
        }
        totalStars += r.stargazers_count || 0;
        totalForks += r.forks_count || 0;

        let readmeSnippet = '';
        let hasDetailedReadme = false;
        let readmeLength = 0;

        // Fetch README for first 3 top repos
        if (idx < 3) {
          try {
            const readmeRes = await fetch(`https://api.github.com/repos/${username}/${r.name}/readme`, {
              headers: {
                'User-Agent': 'StudentDigitalTwinOS-V3',
                Accept: 'application/vnd.github.v3+json',
              },
            });
            if (readmeRes.ok) {
              const readmeJson: any = await readmeRes.json();
              if (readmeJson.content) {
                const decoded = Buffer.from(readmeJson.content, 'base64').toString('utf-8');
                readmeLength = decoded.length;
                hasDetailedReadme = readmeLength > 200;
                readmeSnippet = decoded.slice(0, 300).replace(/\s+/g, ' ').trim();
              }
            }
          } catch {}
        }

        return {
          name: r.name,
          description: r.description || 'No repository description provided',
          language: r.language || 'Plain Text / Config',
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          openIssues: r.open_issues_count || 0,
          isFork: Boolean(r.fork),
          updatedAt: r.pushed_at || r.updated_at,
          hasReadme: Boolean(hasDetailedReadme || r.description),
          readmeLength,
          readmeSnippet: readmeSnippet || undefined,
          topics: Array.isArray(r.topics) ? r.topics : [],
        };
      })
    );

    // Activity analysis from real public events
    const pushEvents = (eventsData || []).filter((e: any) => e.type === 'PushEvent');
    let recentCommitsCount = 0;
    pushEvents.forEach((pe: any) => {
      recentCommitsCount += (pe.payload?.commits?.length || 1);
    });

    const accountAgeYears = userProfileData?.created_at
      ? ((Date.now() - new Date(userProfileData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
      : '0';

    evidenceSummary = {
      username,
      profileUrl: `https://github.com/${username}`,
      avatarUrl: userProfileData?.avatar_url || '',
      name: userProfileData?.name || username,
      bio: userProfileData?.bio || '',
      company: userProfileData?.company || '',
      location: userProfileData?.location || '',
      blog: userProfileData?.blog || '',
      publicReposCount: userProfileData?.public_repos || 0,
      originalReposCount: originalRepos.length,
      forkedReposCount: forkedRepos.length,
      followersCount: userProfileData?.followers || 0,
      followingCount: userProfileData?.following || 0,
      accountCreatedAt: userProfileData?.created_at || '',
      accountAgeYears: `${accountAgeYears} years`,
      totalStars,
      totalForks,
      languagesDetected: Object.keys(languagesCountMap),
      topRepositories: topRepositoriesWithReadme,
      recentActivity: {
        recentEventsCount: (eventsData || []).length,
        recentPushEventsCount: pushEvents.length,
        recentCommitsCount,
        lastActiveDate: eventsData?.[0]?.created_at || reposData?.[0]?.pushed_at || null,
      },
    };

    // Step 4: Send real evidence to Gemini for rubric scoring
    const prompt = `You are a Principal Engineering Hiring Manager and Technical Recruiter conducting an audit of a candidate's GitHub profile.

ACTUAL VERIFIED GITHUB PROFILE EVIDENCE:
- Username: ${evidenceSummary.username}
- Display Name: ${evidenceSummary.name}
- Public Bio: "${evidenceSummary.bio || 'None provided'}"
- Location & Blog: ${evidenceSummary.location || 'None'} | ${evidenceSummary.blog || 'None'}
- Account Age: ${evidenceSummary.accountAgeYears} (Created: ${evidenceSummary.accountCreatedAt})
- Public Repositories: ${evidenceSummary.publicReposCount} total (${evidenceSummary.originalReposCount} original, ${evidenceSummary.forkedReposCount} forks)
- Total Repository Stars: ${evidenceSummary.totalStars}
- Total Repository Forks: ${evidenceSummary.totalForks}
- Followers / Following: ${evidenceSummary.followersCount} / ${evidenceSummary.followingCount}
- Detected Languages: ${evidenceSummary.languagesDetected.join(', ') || 'None detected'}
- Recent Public Activity: ${evidenceSummary.recentActivity.recentCommitsCount} commits across ${evidenceSummary.recentActivity.recentPushEventsCount} push events in last 30 events.
- Sampled Repositories & Documentation:
${evidenceSummary.topRepositories.map((r: any) => `  * ${r.name} (${r.language}) [${r.isFork ? 'FORK' : 'ORIGINAL'}]: ⭐ ${r.stars} | 🍴 ${r.forks}
    Description: ${r.description}
    README: ${r.hasReadme ? `Available (${r.readmeLength || 'present'} chars)` : 'Missing or minimal'}
    ${r.readmeSnippet ? `Sample: "${r.readmeSnippet}"` : ''}`).join('\n') || '  No public repositories'}

SCORING RUBRIC (Max Total = 100):
1. Profile Quality (Max 15): Clear name/bio, location, tech identity, avatar, contact info.
2. Project Quality (Max 25): Depth of original projects, complexity, meaningful software vs empty forks or hello-world.
3. Documentation (Max 20): Detailed READMEs with architecture, setup instructions, screenshots/demos, clear descriptions.
4. Repository Organization (Max 15): Clean naming conventions, sensible branch/commit hygiene, topic tags, license.
5. Activity & Consistency (Max 15): Commit frequency, recent updates, sustained engineering cadence.
6. Engineering Presentation (Max 10): Star traction, original project showcases, open source footprint.

CRITICAL RULES:
- Calculate scores STRICTLY from the verified numbers above.
- If the user has 0 stars, 0 commits, or minimal repositories, reflect this honestly in the category scores.
- NEVER return canned or hardcoded numbers (such as 75, 80, 85, 78).
- Provide highly specific, actionable advice referencing the candidate's actual languages, repositories, and documentation.

RETURN STRICT JSON ONLY:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "profileQuality": number (0-15),
    "projectQuality": number (0-25),
    "documentation": number (0-20),
    "repoOrganization": number (0-15),
    "activityConsistency": number (0-15),
    "engineeringPresentation": number (0-10)
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "highestImpactImprovements": ["string"],
  "recruiterRecommendations": ["string"]
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const parsed = cleanAndParseJSON(response?.text || '{}');

    // Calculate overall score from category scores or parsed score
    const categoryScores = {
      profileQuality: Math.min(15, Math.max(0, Number(parsed.categoryScores?.profileQuality) || 0)),
      projectQuality: Math.min(25, Math.max(0, Number(parsed.categoryScores?.projectQuality) || 0)),
      documentation: Math.min(20, Math.max(0, Number(parsed.categoryScores?.documentation) || 0)),
      repoOrganization: Math.min(15, Math.max(0, Number(parsed.categoryScores?.repoOrganization) || 0)),
      activityConsistency: Math.min(15, Math.max(0, Number(parsed.categoryScores?.activityConsistency) || 0)),
      engineeringPresentation: Math.min(10, Math.max(0, Number(parsed.categoryScores?.engineeringPresentation) || 0)),
    };

    const calculatedTotal = Object.values(categoryScores).reduce((a, b) => a + b, 0);
    const overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || calculatedTotal));

    return res.status(200).json({
      id: `gh_ana_${username}_${Date.now()}`,
      userId: userId || 'anonymous',
      githubUrl: evidenceSummary.profileUrl,
      username,
      analyzedAt: new Date().toISOString(),
      overallScore,
      categoryScores,
      evidenceSummary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      highestImpactImprovements: Array.isArray(parsed.highestImpactImprovements) ? parsed.highestImpactImprovements : [],
      recruiterRecommendations: Array.isArray(parsed.recruiterRecommendations) ? parsed.recruiterRecommendations : [],
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to analyze GitHub profile', {
      evidenceSummary: evidenceSummary || undefined,
    });
  }
}
