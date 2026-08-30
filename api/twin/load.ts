import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseServerClient,
  authenticateRequest,
  logServerSupabaseDiag,
  isServerSupabaseConfigured,
  getSupabaseHostName,
} from '../_utils/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { authenticated, userId, user, token, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logServerSupabaseDiag('LOAD', 'Authentication Check', 'unknown', 401, authError);
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  logServerSupabaseDiag('LOAD_START', 'All Twin Database Tables', userId, 200);

  if (!isServerSupabaseConfigured) {
    logServerSupabaseDiag('LOAD', 'Supabase Not Configured', userId, 200);
    return res.status(200).json({
      success: true,
      configured: false,
      userId,
      data: null,
      message: 'Supabase is not configured on server',
    });
  }

  try {
    const client = getSupabaseServerClient(token || undefined);

    // Concurrently query database tables
    const [projRes, skillRes, studRes, achRes, goalRes, profRes, subRes] = await Promise.allSettled([
      client.from('projects').select('*').eq('user_id', userId),
      client.from('skills').select('*').eq('user_id', userId),
      client.from('student_profiles').select('*').eq('user_id', userId),
      client.from('achievements').select('*').eq('user_id', userId),
      client.from('career_goals').select('*').eq('user_id', userId),
      client.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      client.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    const tableStatuses: Record<string, { ok: boolean; status: number; count?: number; error?: string | null }> = {};
    let allTablesSucceeded = true;

    // Helper to process response
    const checkTable = (tableName: string, res: PromiseSettledResult<any>) => {
      if (res.status === 'fulfilled') {
        if (res.value.error) {
          allTablesSucceeded = false;
          const err = res.value.error;
          const status = res.value.status || 400;
          tableStatuses[tableName] = { ok: false, status, error: `${err.message || err.code || 'DB Error'} (${err.code || 'UNKNOWN'})` };
          logServerSupabaseDiag('SELECT', tableName, userId, status, err);
          return null;
        } else {
          const count = Array.isArray(res.value.data) ? res.value.data.length : (res.value.data ? 1 : 0);
          tableStatuses[tableName] = { ok: true, status: 200, count, error: null };
          logServerSupabaseDiag('SELECT', `${tableName} (${count} rows)`, userId, 200);
          return res.value.data;
        }
      } else {
        allTablesSucceeded = false;
        tableStatuses[tableName] = { ok: false, status: 500, error: res.reason?.message || 'Network / Promise rejection' };
        logServerSupabaseDiag('SELECT', tableName, userId, 500, res.reason);
        return null;
      }
    };

    const rawProjects = checkTable('projects', projRes);
    const rawSkills = checkTable('skills', skillRes);
    const rawStudents = checkTable('student_profiles', studRes);
    const rawAchievements = checkTable('achievements', achRes);
    const rawGoals = checkTable('career_goals', goalRes);
    const rawProfile = checkTable('user_profiles', profRes);
    const rawSubs = checkTable('subscriptions', subRes);

    // Map projects
    const projects = Array.isArray(rawProjects)
      ? rawProjects.map((p: any) => ({
          id: p.id,
          userId: p.user_id || userId,
          studentProfileId: p.student_profile_id || p.studentProfileId,
          title: p.title || '',
          description: p.description || '',
          architecture: p.architecture || '',
          techStack: Array.isArray(p.tech_stack) ? p.tech_stack : (Array.isArray(p.techStack) ? p.techStack : []),
          githubUrl: p.github_url || p.githubUrl || '',
          liveDemoUrl: p.live_demo_url || p.liveDemoUrl || '',
          role: p.role || 'Lead Developer',
          difficulty: p.difficulty || 'Intermediate',
          status: p.status || 'Completed',
          createdAt: p.created_at || p.createdAt || new Date().toISOString(),
          updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
        }))
      : [];

    // Map skills
    const skills = Array.isArray(rawSkills)
      ? rawSkills.map((s: any) => ({
          id: s.id,
          userId: s.user_id || userId,
          studentProfileId: s.student_profile_id || s.studentProfileId,
          skillName: s.skill_name || s.skillName || s.name || '',
          category: s.category || 'Programming',
          proficiency: s.proficiency || 'Intermediate',
          score: typeof s.score === 'number' ? s.score : 75,
          createdAt: s.created_at || s.createdAt || new Date().toISOString(),
          updatedAt: s.updated_at || s.updatedAt || new Date().toISOString(),
        }))
      : [];

    // Map student profiles
    const students = Array.isArray(rawStudents)
      ? rawStudents.map((st: any) => ({
          id: st.id,
          userId: st.user_id || userId,
          name: st.name || '',
          university: st.university || '',
          degree: st.degree || 'B.Tech',
          branch: st.branch || '',
          year: st.year || '1st Year',
          careerGoal: st.career_goal || st.careerGoal || '',
          targetRole: st.target_role || st.targetRole || '',
          profileData: st.profile_data || st.profileData,
          isActive: Boolean(st.is_active ?? st.isActive ?? false),
          createdAt: st.created_at || st.createdAt || new Date().toISOString(),
          updatedAt: st.updated_at || st.updatedAt || new Date().toISOString(),
        }))
      : [];

    // Map achievements
    const achievements = Array.isArray(rawAchievements)
      ? rawAchievements.map((a: any) => ({
          id: a.id,
          userId: a.user_id || userId,
          studentProfileId: a.student_profile_id || a.studentProfileId,
          title: a.title || '',
          organization: a.organization || '',
          date: a.date || '',
          description: a.description || '',
          certificateUrl: a.certificate_url || a.certificateUrl || '',
          createdAt: a.created_at || a.createdAt || new Date().toISOString(),
          updatedAt: a.updated_at || a.updatedAt || new Date().toISOString(),
        }))
      : [];

    // Map career goals
    const careerGoals = Array.isArray(rawGoals)
      ? rawGoals.map((g: any) => ({
          id: g.id,
          userId: g.user_id || userId,
          studentProfileId: g.student_profile_id || g.studentProfileId,
          goal: g.goal || '',
          targetRole: g.target_role || g.targetRole || '',
          targetCompanies: Array.isArray(g.target_companies) ? g.target_companies : (Array.isArray(g.targetCompanies) ? g.targetCompanies : []),
          requiredSkills: Array.isArray(g.required_skills) ? g.required_skills : (Array.isArray(g.requiredSkills) ? g.requiredSkills : []),
          timeline: g.timeline || '',
          isActive: Boolean(g.is_active ?? g.isActive ?? true),
          createdAt: g.created_at || g.createdAt || new Date().toISOString(),
          updatedAt: g.updated_at || g.updatedAt || new Date().toISOString(),
        }))
      : [];

    // Map user foundation profile
    const dbProfile = rawProfile || {};
    const primaryStudent = students.find((s) => s.id === `sp_${userId}_primary` || s.isActive) || students[0];
    const userMeta = user?.user_metadata || {};

    // Fallback to user_metadata if tables were empty/missing
    const finalProjects = projects.length > 0 ? projects : (Array.isArray(userMeta.projects) ? userMeta.projects : []);
    const finalSkills = skills.length > 0 ? skills : (Array.isArray(userMeta.skills) ? userMeta.skills : []);
    const finalStudents = students.length > 0 ? students : (Array.isArray(userMeta.students) ? userMeta.students : (Array.isArray(userMeta.student_twins) ? userMeta.student_twins : []));
    const finalAchievements = achievements.length > 0 ? achievements : (Array.isArray(userMeta.achievements) ? userMeta.achievements : []);
    const finalGoals = careerGoals.length > 0 ? careerGoals : (Array.isArray(userMeta.career_goals) ? userMeta.career_goals : (Array.isArray(userMeta.careerGoals) ? userMeta.careerGoals : []));

    const profile = {
      id: userId,
      email: user?.email || dbProfile.email || '',
      fullName: dbProfile.full_name || userMeta.full_name || userMeta.name || primaryStudent?.name || 'Student User',
      university: dbProfile.university || userMeta.university || primaryStudent?.university || '',
      degree: dbProfile.degree || userMeta.degree || primaryStudent?.degree || 'B.Tech',
      branch: dbProfile.branch || userMeta.branch || primaryStudent?.branch || '',
      program: dbProfile.degree && dbProfile.branch ? `${dbProfile.degree} in ${dbProfile.branch}` : (userMeta.program || ''),
      year: dbProfile.year || userMeta.year || primaryStudent?.year || '1st Year',
      expectedGraduationYear: userMeta.expected_graduation_year || '',
      careerGoal: dbProfile.career_goal || userMeta.career_goal || primaryStudent?.careerGoal || '',
      targetRole: dbProfile.target_role || userMeta.target_role || primaryStudent?.targetRole || '',
      currentSkills: userMeta.current_skills || '',
      skills: userMeta.skills || [],
      bio: dbProfile.bio || userMeta.bio || '',
      githubUrl: dbProfile.github_url || userMeta.github_url || '',
      linkedinUrl: dbProfile.linkedin_url || userMeta.linkedin_url || '',
      phone: dbProfile.phone || userMeta.phone || '',
      location: dbProfile.location || userMeta.location || '',
      profileImageUrl: dbProfile.profile_image_url || userMeta.profile_image_url || userMeta.avatar_url || '',
      avatarUrl: dbProfile.profile_image_url || userMeta.profile_image_url || userMeta.avatar_url || '',
      portfolio: userMeta.portfolio || primaryStudent?.profileData?.portfolio,
      plan: dbProfile.plan || userMeta.plan || 'free',
      billingCycle: userMeta.billing_cycle,
      subscriptionStatus: userMeta.subscription_status,
      subscriptionDetails: userMeta.subscription_data,
      isOnboarded: Boolean(dbProfile.is_onboarded ?? userMeta.is_onboarded ?? (dbProfile.university || userMeta.university)),
      createdAt: dbProfile.created_at || user?.created_at || new Date().toISOString(),
      updatedAt: dbProfile.updated_at || new Date().toISOString(),
      isDemo: false,
    };

    const activeStudentId = finalStudents.find((s: any) => s.isActive)?.id || finalStudents[0]?.id || null;

    if (allTablesSucceeded) {
      logServerSupabaseDiag('LOAD', 'All Twin Database Tables', userId, 200);
    } else {
      const failedTables = Object.entries(tableStatuses)
        .filter(([_, st]) => !st.ok)
        .map(([t, st]) => `${t}: ${st.error}`)
        .join('; ');
      logServerSupabaseDiag('LOAD', `Tables Partial/Failed (${failedTables})`, userId, 207);
    }

    return res.status(200).json({
      success: true,
      allTablesSucceeded,
      tableStatuses,
      host: getSupabaseHostName(),
      userId,
      data: {
        profile,
        students: finalStudents,
        skills: finalSkills,
        projects: finalProjects,
        achievements: finalAchievements,
        careerGoals: finalGoals,
        activeStudentId,
        subscriptions: Array.isArray(rawSubs) ? rawSubs : [],
        lastSyncedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    logServerSupabaseDiag('LOAD_EXCEPTION', 'Database fetch error', userId, 500, err);
    return res.status(500).json({
      success: false,
      allTablesSucceeded: false,
      error: err?.message || 'Database fetch failed',
      userId,
    });
  }
}
