-- ==============================================================================
-- STUDENT DIGITAL TWIN V3 — DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Part 2: Real Authenticated Data Model & Entity Relations
-- ==============================================================================

-- 1. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  university TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  year TEXT DEFAULT '',
  career_goal TEXT DEFAULT '',
  target_role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  profile_image_url TEXT DEFAULT '',
  plan TEXT DEFAULT 'free',
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select_policy') THEN
    CREATE POLICY "user_profiles_select_policy" ON public.user_profiles FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_insert_policy') THEN
    CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_update_policy') THEN
    CREATE POLICY "user_profiles_update_policy" ON public.user_profiles FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_delete_policy') THEN
    CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles FOR DELETE USING (auth.uid() = id OR auth.uid() = user_id);
  END IF;
END $$;

-- 2. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  university TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  year TEXT DEFAULT '',
  career_goal TEXT DEFAULT '',
  target_role TEXT DEFAULT '',
  profile_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_profiles' AND policyname = 'student_profiles_all_policy') THEN
    CREATE POLICY "student_profiles_all_policy" ON public.student_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. SKILLS
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Programming',
  proficiency TEXT NOT NULL DEFAULT 'Intermediate',
  score INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'skills_all_policy') THEN
    CREATE POLICY "skills_all_policy" ON public.skills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  architecture TEXT DEFAULT '',
  tech_stack TEXT[] DEFAULT '{}',
  github_url TEXT DEFAULT '',
  live_demo_url TEXT DEFAULT '',
  role TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'Intermediate',
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'projects_all_policy') THEN
    CREATE POLICY "projects_all_policy" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  certificate_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'achievements_all_policy') THEN
    CREATE POLICY "achievements_all_policy" ON public.achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. CAREER GOALS
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT '',
  target_companies TEXT[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  timeline TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'career_goals' AND policyname = 'career_goals_all_policy') THEN
    CREATE POLICY "career_goals_all_policy" ON public.career_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
