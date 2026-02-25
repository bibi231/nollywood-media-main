-- NAIJAMATION: SCHEMA ALIGNMENT & AUTO-PROFILE TRIGGER
-- Run this in Supabase SQL Editor to fix user creation issues

-- 1. Resolve user_profiles column naming mismatch (user_id vs id)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN user_id TO id;
  END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping user_id rename, it might already be correct.';
END $$;

-- 2. Ensure all required columns exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create the handle_new_user function with per-statement exception handling
-- This prevents one failing INSERT from crashing the entire trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-create public user profile
  BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, bio, avatar_url, subscription_status, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      '',
      NULL,
      'free',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.email, SQLERRM;
  END;

  -- Auto-assign default 'user' role
  BEGIN
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'user', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: role insert failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Establish the trigger on auth.users insertion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.user_profiles TO anon;
GRANT SELECT ON TABLE public.user_roles TO anon;
