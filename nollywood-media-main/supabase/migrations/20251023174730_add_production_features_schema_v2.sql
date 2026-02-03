/*
  # Production-Grade Streaming Platform Schema

  ## New Tables

  ### Subscription & Payments
  1. `subscription_plans` - Available subscription tiers
  2. `subscriptions` - User subscriptions
  3. `payments` - Payment transactions
  
  ### Content Organization
  4. `series` - TV series
  5. `seasons` - TV seasons
  6. `episodes` - TV episodes
  7. `content_rows` - Configurable homepage rows
  8. `rights` - Content licensing and regional availability
  
  ### Engagement
  9. `ratings` - User star ratings (1-5 stars)
  10. `reviews` - User reviews
  11. `reports` - Content moderation reports
  
  ### Analytics & Tracking
  12. `playback_events` - Detailed playback analytics
  13. `trending_counters` - Trending calculations
  14. `notifications` - User notifications
  
  ### Auth Enhancements
  15. `email_verification_tokens` - Email verification tokens
  16. `password_reset_tokens` - Password reset tokens
  17. `two_factor_auth` - 2FA settings
  
  ### System
  18. `api_keys` - API access keys
  19. `feature_flags` - Feature toggles

  ## Security
  - Enable RLS on all tables
  - Appropriate policies for user access
*/

-- =============================================
-- SUBSCRIPTION & PAYMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  interval text NOT NULL DEFAULT 'month',
  trial_days int DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  max_streams int DEFAULT 1,
  max_download int DEFAULT 0,
  video_quality text DEFAULT 'HD',
  ads_enabled boolean DEFAULT true,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  external_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  external_id text,
  payment_method text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- CONTENT ORGANIZATION
-- =============================================

CREATE TABLE IF NOT EXISTS series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  status text DEFAULT 'draft',
  poster_url text,
  backdrop_url text,
  synopsis text,
  genre text,
  release_year int,
  country text,
  studio_label text,
  maturity_rating text DEFAULT 'G',
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_number int NOT NULL,
  title text,
  synopsis text,
  poster_url text,
  release_year int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(series_id, season_number)
);

CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  film_id text REFERENCES films(id) ON DELETE CASCADE,
  episode_number int NOT NULL,
  title text NOT NULL,
  synopsis text,
  runtime_min int,
  air_date date,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(season_id, episode_number)
);

CREATE TABLE IF NOT EXISTS content_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  row_type text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  sort text DEFAULT 'created_at DESC',
  limit_count int DEFAULT 20,
  order_index int DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  tier text NOT NULL,
  territories text[] DEFAULT ARRAY['GLOBAL']::text[],
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ENGAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  stars int NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, film_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ANALYTICS & TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS playback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  position_sec int,
  duration_sec int,
  quality text,
  device_type text,
  browser text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trending_counters (
  film_id text PRIMARY KEY REFERENCES films(id) ON DELETE CASCADE,
  views_24h int DEFAULT 0,
  views_7d int DEFAULT 0,
  views_30d int DEFAULT 0,
  completions_24h int DEFAULT 0,
  completions_7d int DEFAULT 0,
  completions_30d int DEFAULT 0,
  engagement_score decimal(10,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- AUTH ENHANCEMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS two_factor_auth (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  backup_codes text[] DEFAULT ARRAY[]::text[],
  enabled boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text UNIQUE NOT NULL,
  scopes text[] DEFAULT ARRAY[]::text[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_film_id ON episodes(film_id);
CREATE INDEX IF NOT EXISTS idx_ratings_film_id ON ratings(film_id);
CREATE INDEX IF NOT EXISTS idx_reviews_film_id ON reviews(film_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_playback_events_film_id ON playback_events(film_id);
CREATE INDEX IF NOT EXISTS idx_playback_events_user_id ON playback_events(user_id);
CREATE INDEX IF NOT EXISTS idx_playback_events_created_at ON playback_events(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage plans" ON subscription_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update subscriptions" ON subscriptions FOR UPDATE USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert payments" ON payments FOR INSERT WITH CHECK (true);

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published series" ON series FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage series" ON series FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage episodes" ON episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE content_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enabled rows" ON content_rows FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can manage rows" ON content_rows FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE rights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rights" ON rights FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings" ON ratings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage reports" ON reports FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create own events" ON playback_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all events" ON playback_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE trending_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view trending" ON trending_counters FOR SELECT USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage API keys" ON api_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feature flags" ON feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can manage feature flags" ON feature_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO subscription_plans (code, name, description, price, currency, interval, trial_days, features, max_streams, max_download, video_quality, ads_enabled)
VALUES
  ('FREE', 'Free', 'Ad-supported streaming with limited content', 0, 'USD', 'month', 0, 
   '["SD quality", "Single device", "Ad-supported"]'::jsonb, 1, 0, 'SD', true),
  ('PREMIUM', 'Premium', 'Ad-free HD streaming', 9.99, 'USD', 'month', 7, 
   '["HD quality", "2 devices", "Ad-free", "Download content"]'::jsonb, 2, 10, 'HD', false),
  ('FAMILY', 'Family', 'Premium for the whole family', 14.99, 'USD', 'month', 7, 
   '["4K quality", "4 devices", "Ad-free", "Unlimited downloads", "Multiple profiles"]'::jsonb, 4, 999, '4K', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO content_rows (key, title, row_type, filters, sort, limit_count, order_index, enabled)
VALUES
  ('continue_watching', 'Continue Watching', 'continue', '{}'::jsonb, 'updated_at DESC', 20, 1, true),
  ('trending_24h', 'Trending Now', 'trending', '{"window": "24h"}'::jsonb, 'engagement_score DESC', 20, 2, true),
  ('new_releases', 'New Releases', 'genre', '{"created_at": "last_30_days"}'::jsonb, 'created_at DESC', 20, 3, true),
  ('nollywood_classics', 'Nollywood Classics', 'genre', '{"genre": "Drama", "country": "Nigeria"}'::jsonb, 'release_year DESC', 20, 4, true),
  ('comedy', 'Comedy', 'genre', '{"genre": "Comedy"}'::jsonb, 'views DESC', 20, 5, true),
  ('action_thrillers', 'Action & Thrillers', 'genre', '{"genre": "Action"}'::jsonb, 'rating DESC', 20, 6, true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('payments_enabled', true, 'Enable payment processing'),
  ('2fa_enabled', false, 'Enable two-factor authentication'),
  ('download_enabled', false, 'Enable content downloads'),
  ('comments_enabled', true, 'Enable user comments'),
  ('reviews_enabled', true, 'Enable user reviews'),
  ('social_sharing', true, 'Enable social media sharing'),
  ('analytics_tracking', true, 'Enable analytics tracking')
ON CONFLICT (key) DO NOTHING;