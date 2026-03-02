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
  monetization_status TEXT DEFAULT 'none', -- none, eligible, pending, approved, rejected
  watch_time_sec BIGINT DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
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
  hls_url TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'unlisted', 'archived')),
  is_short BOOLEAN DEFAULT false,
  vertical_aspect BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
  is_short BOOLEAN DEFAULT false,
  vertical_aspect BOOLEAN DEFAULT false,
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

-- ═══ Creator Posts (Community Tab) ═══
CREATE TABLE IF NOT EXISTS creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Creator Post Likes ═══
CREATE TABLE IF NOT EXISTS creator_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES creator_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ═══ Creator Post Comments ═══
CREATE TABLE IF NOT EXISTS creator_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES creator_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
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
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- ═══ AI Generation Logs (Rate Limiting) ═══
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT,
  model TEXT,
  result_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_date ON ai_generation_logs(user_id, created_at);

-- ═══ Subscription Plans ═══
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  interval TEXT DEFAULT 'month',
  trial_days INTEGER DEFAULT 0,
  features TEXT[],
  max_streams INTEGER DEFAULT 1,
  max_download INTEGER DEFAULT 0,
  video_quality TEXT DEFAULT 'SD',
  ads_enabled BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Subscriptions ═══
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  paystack_subscription_id TEXT,
  paystack_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ═══ Seed Subscription Plans ═══
INSERT INTO subscription_plans (code, name, description, price, features, video_quality, ads_enabled)
VALUES 
('FREE', 'Free', 'Basic access with ads', 0, ARRAY['Standard access', '1 simultaneous stream'], '480p', true),
('BASIC', 'Basic', 'HD streaming, no ads', 5, ARRAY['HD streaming', 'Ad-free experience', '5 AI generations/day', '2 simultaneous streams'], '720p', false),
('PREMIUM', 'Premium', 'Ultra HD + AI Perks', 15, ARRAY['4K Ultra HD', 'Unlimited AI generations', '4 simultaneous streams', 'Offline downloads'], '4K', false)
ON CONFLICT (code) DO NOTHING;

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_films_status ON films(status);
CREATE INDEX IF NOT EXISTS idx_films_genre ON films(genre);
CREATE INDEX IF NOT EXISTS idx_films_region ON films(setting_region);
CREATE INDEX IF NOT EXISTS idx_films_created ON films(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON user_content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_film ON film_comments(film_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_events_type_created ON playback_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_progress_updated ON watch_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_films_uploaded_by ON films(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_film_comments_user ON film_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_film_likes_film ON film_likes(film_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

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

-- PHASE 14 SCHEMA ADDITIONS
-- Achievements and Verification
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}'::text[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- User Activity Table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);

-- Staff Picks and Members Only
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS is_staff_pick boolean DEFAULT false;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS is_members_only boolean DEFAULT false;

-- Notification Levels
ALTER TABLE public.user_follows ADD COLUMN IF NOT EXISTS notification_level text DEFAULT 'personalized';

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  read boolean DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch Later Queue
CREATE TABLE IF NOT EXISTS public.watch_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  film_id UUID REFERENCES public.films(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, film_id)
);
-- ═══ PHASE 5: NATIVE ADVERTISER MARKETPLACE ═══

-- Advertiser Profiles
CREATE TABLE IF NOT EXISTS advertiser_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected')),
  budget_total NUMERIC NOT NULL DEFAULT 0,
  budget_remaining NUMERIC NOT NULL DEFAULT 0,
  pricing_model TEXT DEFAULT 'CPM' CHECK (pricing_model IN ('CPM', 'CPC')),
  price_per_unit NUMERIC DEFAULT 0,
  daily_budget NUMERIC DEFAULT 0,
  daily_spend NUMERIC DEFAULT 0,
  last_pacing_reset TIMESTAMPTZ DEFAULT now(),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  frequency_cap INTEGER DEFAULT 0, -- 0 means unlimited
  priority_weight INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Units (Creatives)
CREATE TABLE IF NOT EXISTS ad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns.id ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('banner', 'video_preroll', 'native_feed')),
  content_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Targeting
CREATE TABLE IF NOT EXISTS ad_targeting (
  campaign_id UUID PRIMARY KEY REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  geo_countries TEXT[] DEFAULT '{}',
  device_types TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Logs (Impressions & Clicks)
CREATE TABLE IF NOT EXISTS ad_logs (
  id BIGSERIAL PRIMARY KEY,
  ad_unit_id UUID REFERENCES ad_units(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_id UUID, -- Optional, for non-logged-in users
  event_type TEXT CHECK (event_type IN ('impression', 'click')),
  ip_address TEXT,
  user_agent TEXT,
  geo_country TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_logs_ad_unit ON ad_logs(ad_unit_id);
CREATE INDEX IF NOT EXISTS idx_ad_logs_created_at ON ad_logs(created_at);

-- ═══ Creator Earnings ═══
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance_total NUMERIC DEFAULT 0,
  balance_pending NUMERIC DEFAULT 0,
  revenue_ads NUMERIC DEFAULT 0,
  revenue_subscriptions NUMERIC DEFAULT 0,
  revenue_tips NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Payment Transactions ═══
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, success, failed, refunded
  provider TEXT, -- paystack, paypal, stripe
  target_type TEXT, -- subscription, tip, ad_budget
  target_id UUID,
  transaction_ref TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Payout History ═══
CREATE TABLE IF NOT EXISTS payout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, processing, paid, failed
  payout_method TEXT,
  payout_details JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ More Indexes ═══
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref ON payment_transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_payout_history_creator ON payout_history(creator_id);
-- ═══ Monetization Applications ═══
CREATE TABLE IF NOT EXISTS monetization_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Comment Reports ═══
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL, -- spam, harassment, hate_speech, other
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Moderator Actions ═══
CREATE TABLE IF NOT EXISTS moderator_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- delete_comment, ban_user, shadowban, warn
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL, -- comment, user, film
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ Indexes for new tables ═══
CREATE INDEX IF NOT EXISTS idx_monetization_apps_user ON monetization_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_moderator ON moderator_actions(moderator_id);

-- ─── ENGAGEMENT & ML RECOMMENDATIONS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content_id UUID NOT NULL, -- Generic content ID (film or user upload)
  content_type TEXT NOT NULL, -- 'film' or 'user_content'
  event_type TEXT NOT NULL, -- 'view', 'watch_time', 'like', 'share', 'complete'
  value NUMERIC DEFAULT 0, -- Generic value (e.g., watch time in seconds)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_scores (
  user_id UUID REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_engagement_content ON engagement_metrics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_scores_user ON recommendation_scores(user_id, score DESC);

-- Trending Velocity Calculation
CREATE OR REPLACE FUNCTION calculate_trending_velocity(cid UUID, ctype TEXT)
RETURNS NUMERIC AS $$
DECLARE
  velocity NUMERIC;
BEGIN
  SELECT COUNT(*) INTO velocity
  FROM engagement_metrics
  WHERE content_id = cid 
    AND content_type = ctype
    AND created_at > now() - INTERVAL '24 hours';
  RETURN velocity;
END;
$$ LANGUAGE plpgsql;
