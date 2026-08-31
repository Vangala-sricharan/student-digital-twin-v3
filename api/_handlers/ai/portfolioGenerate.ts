import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callGeminiWithRetry, cleanAndParseJSON, handleApiError } from '../../_utils/gemini.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      profile,
      activeProfile,
      userProfile,
      skills = [],
      projects = [],
      achievements = [],
      careerGoals = [],
      theme = 'modern-minimal',
    } = req.body || {};

    const profileData = profile || activeProfile || userProfile || {};
    const fullName = profileData.fullName || profileData.name || 'Student Engineer';
    const university = profileData.university || '';
    const degree = profileData.degree || '';
    const branch = profileData.branch || '';
    const year = profileData.year || '';
    const graduationYear = profileData.expectedGraduationYear || profileData.graduationYear || '';
    const targetRole = profileData.targetRole || profileData.careerGoal || 'Software Engineer';
    const bio = profileData.bio || profileData.profileData?.bio || '';
    const githubUrl = profileData.githubUrl || profileData.profileData?.githubUrl || '';
    const linkedinUrl = profileData.linkedinUrl || profileData.profileData?.linkedinUrl || '';
    const phone = profileData.phone || profileData.profileData?.phone || '';
    const location = profileData.location || profileData.profileData?.location || '';
    const email = profileData.email || userProfile?.email || '';
    const avatarUrl =
      profileData.profileImageUrl ||
      profileData.avatarUrl ||
      userProfile?.profileImageUrl ||
      userProfile?.avatarUrl ||
      '';

    // Prepare clean skills text
    const skillsList = (skills as any[]).map((s) => ({
      name: s.skillName || s.name,
      category: s.category || 'General',
      proficiency: s.proficiency || 'Intermediate',
    }));

    // Prepare clean projects
    const projectsList = (projects as any[]).map((p) => ({
      id: p.id || `proj_${Math.random()}`,
      title: p.title,
      role: p.role || 'Lead Developer',
      description: p.description,
      techStack: Array.isArray(p.techStack) ? p.techStack : [],
      architecture: p.architecture || '',
      githubUrl: p.githubUrl || '',
      liveDemoUrl: p.liveDemoUrl || '',
    }));

    // Prepare clean achievements
    const achievementsList = (achievements as any[]).map((a) => ({
      id: a.id || `ach_${Math.random()}`,
      title: a.title,
      organization: a.organization,
      date: a.date,
      description: a.description,
    }));

    // Prepare clean career goals
    const goalsList = (careerGoals as any[]).map((g) => ({
      targetRole: g.targetRole || g.goal,
      timeline: g.timeline || 'Upcoming',
      targetCompanies: Array.isArray(g.targetCompanies) ? g.targetCompanies : [],
    }));

    const prompt = `You are an elite Executive Tech Portfolio Architect & AI Career OS Synthesizer.
Transform the provided verified Student Digital Twin record into a top-tier, recruiter-optimized portfolio structure.

INPUT STUDENT DIGITAL TWIN RECORD:
- Full Name: ${fullName}
- Target Career Role: ${targetRole}
- University: ${university}
- Degree & Branch: ${degree} ${branch} (${year}, Graduating: ${graduationYear})
- Location: ${location}
- Bio / Personal Summary: ${bio}
- GitHub: ${githubUrl}
- LinkedIn: ${linkedinUrl}
- Skills: ${JSON.stringify(skillsList)}
- Projects: ${JSON.stringify(projectsList)}
- Achievements & Certifications: ${JSON.stringify(achievementsList)}
- Career Goals: ${JSON.stringify(goalsList)}

RULES & CONSTRAINTS:
1. Grounding: You MUST ONLY use the verified student facts provided above. Do NOT invent new companies, degrees, or fake internships.
2. Craftsmanship: Elevate phrasing, impact articulation, and project highlights with crisp technical vocabulary, action verbs, and quantitative outcomes where implied.
3. Hero Tagline: Create a punchy, memorable headline (e.g. "AI/ML Systems Engineer & Neural Search Architect").
4. Available for roles: Provide 2-4 specific role titles related to their target role and skill set.
5. Skills Grouping: Organize all skills logically into 3-5 clean categories (e.g., "Languages & Core", "Frameworks & Web", "AI / ML & Data", "Cloud & Tooling").
6. Project Highlights: For each project, synthesize 2-3 bullet-point highlights articulating architecture, scale, or engineering problem solved.
7. Return strict JSON matching the schema below.

REQUIRED JSON OUTPUT FORMAT:
{
  "theme": "${theme}",
  "hero": {
    "name": "${fullName}",
    "tagline": "A high-impact 1-line professional title",
    "location": "${location}",
    "bio": "2-3 sentence impactful executive elevator pitch",
    "availableForRoles": ["Role 1", "Role 2", "Role 3"],
    "avatarUrl": "${avatarUrl}"
  },
  "about": {
    "summary": "Detailed, highly compelling 2-paragraph narrative about the student's engineering mindset, learning trajectory, and problem-solving focus.",
    "education": {
      "university": "${university}",
      "degree": "${degree}",
      "branch": "${branch}",
      "year": "${year}",
      "graduationYear": "${graduationYear}"
    },
    "careerAspirations": "1-2 sentences on what engineering challenges they want to tackle next."
  },
  "skills": [
    {
      "category": "string",
      "items": ["skill 1", "skill 2"]
    }
  ],
  "featuredProjects": [
    {
      "id": "string",
      "title": "string",
      "role": "string",
      "description": "string",
      "techStack": ["tech1", "tech2"],
      "architecture": "string",
      "githubUrl": "string",
      "liveDemoUrl": "string",
      "highlights": ["highlight 1", "highlight 2"]
    }
  ],
  "achievements": [
    {
      "id": "string",
      "title": "string",
      "organization": "string",
      "date": "string",
      "description": "string"
    }
  ],
  "careerGoals": [
    {
      "targetRole": "string",
      "timeline": "string",
      "targetCompanies": ["company 1", "company 2"]
    }
  ],
  "socialLinks": {
    "githubUrl": "${githubUrl}",
    "linkedinUrl": "${linkedinUrl}",
    "email": "${email}",
    "phone": "${phone}"
  }
}`;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let rawText = '';
    if (typeof response?.text === 'string') {
      rawText = response.text;
    } else if (typeof response?.text === 'function') {
      rawText = response.text();
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = response.candidates[0].content.parts[0].text;
    }

    let parsed: any = {};
    try {
      parsed = cleanAndParseJSON(rawText || '{}');
    } catch (parseErr) {
      console.warn('[portfolioGenerate] AI JSON parse fallback triggered:', parseErr);
      parsed = {};
    }

    const result = {
      theme: parsed.theme || theme || 'modern-minimal',
      hero: {
        name: parsed.hero?.name || fullName,
        tagline: parsed.hero?.tagline || `${targetRole} | Engineering Student`,
        location: parsed.hero?.location || location,
        bio: parsed.hero?.bio || bio || `Student engineer studying at ${university || 'University'}.`,
        availableForRoles: Array.isArray(parsed.hero?.availableForRoles)
          ? parsed.hero.availableForRoles
          : [targetRole],
        avatarUrl: avatarUrl || parsed.hero?.avatarUrl || '',
      },
      about: {
        summary:
          parsed.about?.summary ||
          bio ||
          `Dedicated engineer focusing on ${targetRole} with a strong foundation in modern software development and problem solving.`,
        education: {
          university: parsed.about?.education?.university || university,
          degree: parsed.about?.education?.degree || degree,
          branch: parsed.about?.education?.branch || branch,
          year: parsed.about?.education?.year || year,
          graduationYear: parsed.about?.education?.graduationYear || graduationYear,
        },
        careerAspirations: parsed.about?.careerAspirations || `Aiming to excel as a ${targetRole}.`,
      },
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
        ? parsed.skills
        : [
            {
              category: 'Core Skills',
              items: skillsList.map((s) => s.name),
            },
          ],
      featuredProjects: Array.isArray(parsed.featuredProjects) && parsed.featuredProjects.length > 0
        ? parsed.featuredProjects
        : projectsList.map((p) => ({
            ...p,
            highlights: ['Engineered full-stack technical implementation', 'Applied modular architecture patterns'],
          })),
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : achievementsList,
      careerGoals: Array.isArray(parsed.careerGoals) && parsed.careerGoals.length > 0 ? parsed.careerGoals : goalsList,
      socialLinks: {
        githubUrl: parsed.socialLinks?.githubUrl || githubUrl,
        linkedinUrl: parsed.socialLinks?.linkedinUrl || linkedinUrl,
        email: parsed.socialLinks?.email || email,
        phone: parsed.socialLinks?.phone || phone,
      },
      generatedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      portfolioData: result,
      ...result,
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Failed to generate AI portfolio');
  }
}
