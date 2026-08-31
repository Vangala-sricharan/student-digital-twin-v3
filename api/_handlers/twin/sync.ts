import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseServerClient,
  authenticateRequest,
  logServerSupabaseDiag,
  isServerSupabaseConfigured,
  getSupabaseHostName,
} from '../../_utils/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { authenticated, userId, user, token, error: authError } = await authenticateRequest(req);

  if (!authenticated || !userId) {
    logServerSupabaseDiag('SYNC', 'Authentication Check', 'unknown', 401, authError);
    return res.status(401).json({
      success: false,
      error: authError || 'Unauthorized — Authenticated user session required',
    });
  }

  const {
    profile,
    students = [],
    skills = [],
    projects = [],
    achievements = [],
    careerGoals = [],
    activeStudentId,
  } = req.body || {};

  logServerSupabaseDiag('SYNC_START', 'Initiating full twin database sync', userId, 200);

  if (!isServerSupabaseConfigured) {
    logServerSupabaseDiag('SYNC', 'Supabase Not Configured', userId, 200);
    return res.status(200).json({
      success: true,
      configured: false,
      message: 'Supabase is not configured on server. State stored locally.',
      savedAt: new Date().toISOString(),
    });
  }

  const now = new Date().toISOString();
  const client = getSupabaseServerClient(token || undefined);

  // 1. Prepare user profile table payload
  const mergedProfile = {
    ...(profile || {}),
    id: userId,
    user_id: userId,
    updated_at: now,
  };

  const userProfilePayload = {
    id: userId,
    user_id: userId,
    full_name: mergedProfile.fullName || '',
    email: mergedProfile.email || user?.email || '',
    university: mergedProfile.university || '',
    degree: mergedProfile.degree || '',
    branch: mergedProfile.branch || '',
    year: mergedProfile.year || '',
    career_goal: mergedProfile.careerGoal || '',
    target_role: mergedProfile.targetRole || '',
    bio: mergedProfile.bio || '',
    github_url: mergedProfile.githubUrl || '',
    linkedin_url: mergedProfile.linkedinUrl || '',
    phone: mergedProfile.phone || '',
    location: mergedProfile.location || '',
    profile_image_url: mergedProfile.profileImageUrl || mergedProfile.avatarUrl || '',
    plan: mergedProfile.plan || 'free',
    is_onboarded: Boolean(mergedProfile.isOnboarded),
    updated_at: now,
  };

  // 2. Prepare student_profiles payload
  const studentListToUpsert = (Array.isArray(students) && students.length > 0 ? students : [{
    id: `sp_${userId}_primary`,
    userId,
    name: mergedProfile.fullName || 'Student',
    university: mergedProfile.university || '',
    degree: mergedProfile.degree || 'B.Tech',
    branch: mergedProfile.branch || '',
    year: mergedProfile.year || '1st Year',
    careerGoal: mergedProfile.careerGoal || '',
    targetRole: mergedProfile.targetRole || '',
    profileData: mergedProfile,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }]).map((s: any) => ({
    id: s.id,
    user_id: userId,
    name: s.name || mergedProfile.fullName || '',
    university: s.university || mergedProfile.university || '',
    degree: s.degree || mergedProfile.degree || 'B.Tech',
    branch: s.branch || mergedProfile.branch || '',
    year: s.year || mergedProfile.year || '1st Year',
    career_goal: s.careerGoal || mergedProfile.careerGoal || '',
    target_role: s.targetRole || mergedProfile.targetRole || '',
    profile_data: s.profileData || mergedProfile,
    is_active: Boolean(s.isActive),
    updated_at: now,
  }));

  // 3. Prepare skills payload
  const skillsToUpsert = (Array.isArray(skills) ? skills : []).map((s: any) => ({
    id: s.id,
    user_id: userId,
    student_profile_id: s.studentProfileId || activeStudentId || null,
    skill_name: s.skillName || '',
    category: s.category || 'Programming',
    proficiency: s.proficiency || 'Intermediate',
    score: typeof s.score === 'number' ? s.score : 75,
    updated_at: now,
  }));

  // 4. Prepare projects payload
  const projectsToUpsert = (Array.isArray(projects) ? projects : []).map((p: any) => ({
    id: p.id,
    user_id: userId,
    student_profile_id: p.studentProfileId || activeStudentId || null,
    title: p.title || '',
    description: p.description || '',
    architecture: p.architecture || '',
    tech_stack: Array.isArray(p.techStack) ? p.techStack : [],
    github_url: p.githubUrl || '',
    live_demo_url: p.liveDemoUrl || '',
    role: p.role || 'Lead Developer',
    difficulty: p.difficulty || 'Intermediate',
    status: p.status || 'Completed',
    updated_at: now,
  }));

  // 5. Prepare achievements payload
  const achievementsToUpsert = (Array.isArray(achievements) ? achievements : []).map((a: any) => ({
    id: a.id,
    user_id: userId,
    student_profile_id: a.studentProfileId || activeStudentId || null,
    title: a.title || '',
    organization: a.organization || '',
    date: a.date || '',
    description: a.description || '',
    certificate_url: a.certificateUrl || '',
    updated_at: now,
  }));

  // 6. Prepare career goals payload
  const goalsToUpsert = (Array.isArray(careerGoals) ? careerGoals : []).map((g: any) => ({
    id: g.id,
    user_id: userId,
    student_profile_id: g.studentProfileId || activeStudentId || null,
    goal: g.goal || '',
    target_role: g.targetRole || '',
    target_companies: Array.isArray(g.targetCompanies) ? g.targetCompanies : [],
    required_skills: Array.isArray(g.requiredSkills) ? g.requiredSkills : [],
    timeline: g.timeline || '',
    is_active: Boolean(g.isActive),
    updated_at: now,
  }));

  try {
    const tableStatuses: Record<string, { ok: boolean; status: number; count: number; error?: string | null }> = {};
    let allTablesSucceeded = true;

    // Execute upsert operations
    const upsertTable = async (tableName: string, rows: any[]) => {
      if (!rows || rows.length === 0) {
        tableStatuses[tableName] = { ok: true, status: 200, count: 0, error: null };
        return;
      }
      try {
        const { error, status } = await client.from(tableName).upsert(rows, { onConflict: 'id' });
        if (error) {
          allTablesSucceeded = false;
          const httpStatus = status || 400;
          tableStatuses[tableName] = { ok: false, status: httpStatus, count: rows.length, error: `${error.message || error.code} (${error.code || 'UNKNOWN'})` };
          logServerSupabaseDiag('UPSERT', `${tableName} (${rows.length} rows)`, userId, httpStatus, error);
        } else {
          tableStatuses[tableName] = { ok: true, status: 200, count: rows.length, error: null };
          logServerSupabaseDiag('UPSERT', `${tableName} (${rows.length} rows)`, userId, 200);
        }
      } catch (err: any) {
        allTablesSucceeded = false;
        tableStatuses[tableName] = { ok: false, status: 500, count: rows.length, error: err?.message || 'Exception during upsert' };
        logServerSupabaseDiag('UPSERT', tableName, userId, 500, err);
      }
    };

    await Promise.allSettled([
      upsertTable('user_profiles', [userProfilePayload]),
      upsertTable('student_profiles', studentListToUpsert),
      upsertTable('skills', skillsToUpsert),
      upsertTable('projects', projectsToUpsert),
      upsertTable('achievements', achievementsToUpsert),
      upsertTable('career_goals', goalsToUpsert),
    ]);

    // Also update basic user_metadata via Supabase Auth when token is valid
    if (token) {
      try {
        const basicMetadata = {
          full_name: mergedProfile.fullName,
          university: mergedProfile.university,
          degree: mergedProfile.degree,
          branch: mergedProfile.branch,
          year: mergedProfile.year,
          career_goal: mergedProfile.careerGoal,
          target_role: mergedProfile.targetRole,
          plan: mergedProfile.plan,
          is_onboarded: mergedProfile.isOnboarded,
        };
        await client.auth.updateUser({ data: basicMetadata });
      } catch (authMetaErr) {
        logServerSupabaseDiag('USER_METADATA', 'updateUser notice', userId, 200, authMetaErr);
      }
    }

    if (allTablesSucceeded) {
      logServerSupabaseDiag('SYNC_COMPLETE', 'All Twin Records successfully persisted to cloud database', userId, 200);
      return res.status(200).json({
        success: true,
        allTablesSucceeded: true,
        message: 'Cloud Sync Successful: All Twin Records are safely stored in the cloud.',
        tableStatuses,
        host: getSupabaseHostName(),
        userId,
        savedAt: now,
      });
    } else {
      const failedTables = Object.entries(tableStatuses)
        .filter(([_, st]) => !st.ok)
        .map(([t, st]) => `${t}: ${st.error}`)
        .join('; ');

      logServerSupabaseDiag('SYNC_PARTIAL', `Tables status (${failedTables})`, userId, 207);
      return res.status(200).json({
        success: true,
        allTablesSucceeded: false,
        message: `Twin Records updated. Note: Database sync notice: ${failedTables}`,
        tableStatuses,
        host: getSupabaseHostName(),
        userId,
        savedAt: now,
      });
    }
  } catch (err: any) {
    logServerSupabaseDiag('SYNC_EXCEPTION', 'Database upsert error', userId, 500, err);
    return res.status(500).json({
      success: false,
      allTablesSucceeded: false,
      error: err?.message || 'Database sync failed',
      userId,
    });
  }
}
