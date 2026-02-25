-- ═══════════════════════════════════════════════════════════════
-- NAIJAMATION: NEON DATABASE SCHEMA
-- Run against Neon PostgreSQL to set up all tables
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══ Users (replaces Supabase auth.users) ═══
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  email_confirmed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ User Profiles ═══
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ User Roles ═══
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Films ═══
CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  logline TEXT,
  synopsis TEXT,
  genre TEXT,
  release_year INTEGER,
  runtime_min INTEGER,
  rating TEXT,
  setting_region TEXT,
  languages_audio TEXT,
  languages_subtitles TEXT,
  cast_members TEXT,
  director TEXT,
  studio_label TEXT,
  tags TEXT[],
  poster_url TEXT DEFAULT '',
  poster_path TEXT,
  thumbnail_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'unlisted', 'archived')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Film Comments ═══
CREATE TABLE IF NOT EXISTS film_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Comment Likes ═══
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ═══ Film Likes ═══
CREATE TABLE IF NOT EXISTS film_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  like_type TEXT DEFAULT 'like' CHECK (like_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(film_id, user_id)
);

-- ═══ Content Ratings ═══
CREATE TABLE IF NOT EXISTS content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(film_id, user_id)
);

-- ═══ User Content Uploads ═══
CREATE TABLE IF NOT EXISTS user_content_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  video_filename TEXT,
  video_path TEXT,
  video_url TEXT,
  thumbnail_path TEXT,
  thumbnail_url TEXT,
  file_size BIGINT DEFAULT 0,
  status TEXT DEFAULT 'processing',
  moderation_status TEXT DEFAULT 'pending',
  visibility TEXT DEFAULT 'private',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Also used as user_uploads alias
CREATE OR REPLACE VIEW user_uploads AS SELECT * FROM user_content_uploads;

-- ═══ Watch History ═══
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT now(),
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false
);

-- ═══ Watchlists ═══
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, film_id)
);

-- ═══ User Follows ═══
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- ═══ Creator Profiles ═══
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_name TEXT,
  channel_description TEXT,
  channel_art_url TEXT,
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  total_views INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ User Preferences ═══
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_genres TEXT[],
  preferred_regions TEXT[],
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Notifications ═══
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Playback Events (analytics) ═══
CREATE TABLE IF NOT EXISTS playback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID,
  user_id UUID,
  event_type TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Trending Content (materialized) ═══
CREATE TABLE IF NOT EXISTS trending_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  period TEXT DEFAULT 'daily',
  calculated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Content Reports ═══
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT,
  content_id UUID,
  reporter_id UUID REFERENCES users(id),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Playlists ═══
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Watch Progress ═══
CREATE TABLE IF NOT EXISTS watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, film_id)
);

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_films_status ON films(status);
CREATE INDEX IF NOT EXISTS idx_films_genre ON films(genre);
CREATE INDEX IF NOT EXISTS idx_films_created ON films(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON user_content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_film ON film_comments(film_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ═══ Seed admin user ═══
INSERT INTO users (id, email, encrypted_password, display_name)
VALUES (
  gen_random_uuid(),
  'bitrus@gadzama.com',
  crypt('admin00', gen_salt('bf')),
  'Bitrus Gadzama'
) ON CONFLICT (email) DO NOTHING;

-- Set admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'bitrus@gadzama.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Create admin profile
INSERT INTO user_profiles (id, email, display_name)
SELECT id, email, display_name FROM users WHERE email = 'bitrus@gadzama.com'
ON CONFLICT (id) DO NOTHING;

-- Seed additional test users
INSERT INTO users (id, email, encrypted_password, display_name)
VALUES (
  gen_random_uuid(),
  'admin@naijamation.com',
  crypt('NaijaAdmin2024!', gen_salt('bf')),
  'NaijaMation Admin'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@naijamation.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO user_profiles (id, email, display_name)
SELECT id, email, display_name FROM users WHERE email = 'admin@naijamation.com'
ON CONFLICT (id) DO NOTHING;
