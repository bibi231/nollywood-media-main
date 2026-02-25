-- ════════════════════════════════════════════════════════════════
-- NAIJAMATION: COMPREHENSIVE AUTH FIX SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor (Dashboard → SQL Editor)
-- ════════════════════════════════════════════════════════════════

-- ═══ STEP 0: Enable pgcrypto (required for password hashing) ═══
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══ STEP 1: Fix the handle_new_user trigger ═══
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, bio, avatar_url, subscription_status, created_at, updated_at)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      '', NULL, 'free', NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.email, SQLERRM;
  END;

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══ STEP 2: Ensure required columns ═══
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ═══ STEP 3: Permissions ═══
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.user_profiles TO anon;
GRANT SELECT ON TABLE public.user_roles TO anon;

-- ═══ STEP 4: Seeding helper function ═══
CREATE OR REPLACE FUNCTION public.seed_user(
  p_email TEXT, p_password TEXT, p_display_name TEXT, p_role TEXT DEFAULT 'user'
) RETURNS void AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = p_email;

  IF uid IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf'::text)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = uid;
    RAISE NOTICE 'Updated existing user: %', p_email;
  ELSE
    uid := gen_random_uuid();
    ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new
    ) VALUES (
      uid, '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf'::text)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      format('{"display_name":"%s"}', p_display_name)::jsonb,
      'authenticated', 'authenticated', now(), now(), '', '', ''
    );

    ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
    RAISE NOTICE 'Created new user: % (id: %)', p_email, uid;
  END IF;

  -- Ensure profile + role exist
  INSERT INTO public.user_profiles (id, email, display_name, bio, avatar_url, subscription_status, created_at, updated_at)
  VALUES (uid, p_email, p_display_name, '', NULL, 'free', now(), now())
  ON CONFLICT (id) DO UPDATE SET email = p_email, display_name = p_display_name, updated_at = now();

  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (uid, p_role, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET role = p_role, updated_at = now();

  RAISE NOTICE 'User % → role: %', p_email, p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══ STEP 5: Seed all accounts ═══
SELECT public.seed_user('peterjohn2343@gmail.com', 'Fishbabyl12', 'Peter John', 'admin');
SELECT public.seed_user('admin@naijamation.com', 'NaijaAdmin2024!', 'NaijaMation Admin', 'admin');
SELECT public.seed_user('bitrus@gadzama.com', 'admin00', 'Bitrus Gadzama', 'admin');
SELECT public.seed_user('viewer1@naijamation.com', 'Password123!', 'Demo Viewer', 'user');
SELECT public.seed_user('creator1@naijamation.com', 'Password123!', 'Demo Creator', 'user');
SELECT public.seed_user('testuser@naijamation.com', 'Password123!', 'Test User', 'user');

-- ═══ STEP 6: Cleanup ═══
DROP FUNCTION IF EXISTS public.seed_user;

-- ═══ STEP 7: Verify ═══
SELECT u.email, u.email_confirmed_at IS NOT NULL as confirmed, r.role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
ORDER BY u.created_at;
