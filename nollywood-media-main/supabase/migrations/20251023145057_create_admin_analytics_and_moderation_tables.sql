/*
  # Admin Portal Analytics and Moderation Schema

  1. New Tables
    - `analytics_daily` - Daily aggregated analytics data
    - `device_analytics` - Device breakdown statistics
    - `film_analytics` - Per-film analytics
    - `comment_reports` - User-reported comments  
    - `content_ratings` - Age ratings and compliance
    - `upload_jobs` - File upload and transcode tracking
    - `transcode_logs` - Detailed transcode logs
    - `user_actions` - Moderation actions log

  2. Security
    - Enable RLS on all tables
    - Admin-only access policies for all tables
*/

-- Analytics Daily Table
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  dau integer DEFAULT 0,
  total_watch_time_minutes integer DEFAULT 0,
  avg_bitrate_mbps numeric DEFAULT 0,
  error_rate_percent numeric DEFAULT 0,
  plays_count integer DEFAULT 0,
  completions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Device Analytics Table
CREATE TABLE IF NOT EXISTS device_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('mobile', 'tv', 'desktop', 'tablet')),
  user_count integer DEFAULT 0,
  watch_time_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, device_type)
);

-- Film Analytics Table
CREATE TABLE IF NOT EXISTS film_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  completions integer DEFAULT 0,
  avg_watch_time_minutes integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(film_id, date)
);

-- Comment Reports Table (references film_comments)
CREATE TABLE IF NOT EXISTS comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES film_comments(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('hate', 'spam', 'harassment', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'reviewed')),
  moderator_id uuid REFERENCES auth.users(id),
  moderator_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Content Ratings Table
CREATE TABLE IF NOT EXISTS content_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text NOT NULL UNIQUE REFERENCES films(id) ON DELETE CASCADE,
  suggested_rating text CHECK (suggested_rating IN ('G', 'PG', 'PG-13', 'R', 'NC-17')),
  applied_rating text CHECK (applied_rating IN ('G', 'PG', 'PG-13', 'R', 'NC-17')),
  descriptors text[] DEFAULT '{}',
  territories_allowed text[] DEFAULT '{}',
  territories_pending text[] DEFAULT '{}',
  parental_tier text CHECK (parental_tier IN ('kids', 'teen', 'mature')),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Upload Jobs Table
CREATE TABLE IF NOT EXISTS upload_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  film_id text REFERENCES films(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('uploading', 'queued', 'transcoding', 'completed', 'failed')),
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  target_formats text[] DEFAULT '{}',
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_size_mb integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Transcode Logs Table
CREATE TABLE IF NOT EXISTS transcode_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_job_id uuid NOT NULL REFERENCES upload_jobs(id) ON DELETE CASCADE,
  log_level text NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Actions Table
CREATE TABLE IF NOT EXISTS user_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('block', 'shadowban', 'mute', 'warn', 'restore')),
  reason text NOT NULL,
  duration_hours integer,
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcode_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all tables
CREATE POLICY "Admins can read analytics_daily"
  ON analytics_daily FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert analytics_daily"
  ON analytics_daily FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read device_analytics"
  ON device_analytics FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can read film_analytics"
  ON film_analytics FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can read comment_reports"
  ON comment_reports FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can create comment_reports"
  ON comment_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can update comment_reports"
  ON comment_reports FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read content_ratings"
  ON content_ratings FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage content_ratings"
  ON content_ratings FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read upload_jobs"
  ON upload_jobs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage upload_jobs"
  ON upload_jobs FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can read transcode_logs"
  ON transcode_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can read user_actions"
  ON user_actions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create user_actions"
  ON user_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_device_analytics_date ON device_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_film_analytics_film_date ON film_analytics(film_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_ratings_film ON content_ratings(film_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_user_actions_target ON user_actions(target_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_content_ratings_updated_at
  BEFORE UPDATE ON content_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
