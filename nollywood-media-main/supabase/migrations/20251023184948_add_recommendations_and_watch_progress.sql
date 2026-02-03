/*
  # Add Recommendations and Watch Progress System

  1. New Tables
    - `watch_progress`
      - Tracks exactly where user stopped in each video
      - `user_id` (uuid, references auth.users)
      - `film_id` (text, references films)
      - `progress_seconds` (integer)
      - `duration_seconds` (integer)
      - `last_watched` (timestamptz)
      - `completed` (boolean)
    
    - `user_preferences`
      - Stores user content preferences
      - `user_id` (uuid, primary key)
      - `favorite_genres` (text array)
      - `watched_genres` (text array)
      - `preferred_language` (text)
      - `updated_at` (timestamptz)
    
    - `trending_content`
      - Caches trending content calculations
      - `film_id` (text, references films)
      - `trend_score` (decimal)
      - `views_24h` (integer)
      - `views_7d` (integer)
      - `calculated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Watch Progress Table
CREATE TABLE IF NOT EXISTS watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id text REFERENCES films(id) ON DELETE CASCADE,
  progress_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  last_watched timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  UNIQUE(user_id, film_id)
);

ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch progress"
  ON watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch progress"
  ON watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress"
  ON watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_last_watched ON watch_progress(last_watched DESC);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres text[] DEFAULT '{}',
  watched_genres text[] DEFAULT '{}',
  preferred_language text DEFAULT 'English',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trending Content Table
CREATE TABLE IF NOT EXISTS trending_content (
  film_id text PRIMARY KEY REFERENCES films(id) ON DELETE CASCADE,
  trend_score decimal(10,2) DEFAULT 0,
  views_24h integer DEFAULT 0,
  views_7d integer DEFAULT 0,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE trending_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trending content"
  ON trending_content FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_trending_score ON trending_content(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_calculated ON trending_content(calculated_at DESC);

-- Function to update user preferences based on watch history
CREATE OR REPLACE FUNCTION update_user_preferences()
RETURNS trigger AS $$
BEGIN
  -- Update user preferences when they complete watching something
  IF NEW.completed = true THEN
    INSERT INTO user_preferences (user_id, watched_genres)
    SELECT 
      NEW.user_id,
      ARRAY[f.genre]
    FROM films f
    WHERE f.id = NEW.film_id
    ON CONFLICT (user_id) 
    DO UPDATE SET
      watched_genres = ARRAY(
        SELECT DISTINCT unnest(
          user_preferences.watched_genres || EXCLUDED.watched_genres
        )
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_preferences_on_watch
  AFTER INSERT OR UPDATE ON watch_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences();

-- Function to calculate trending scores (run periodically)
CREATE OR REPLACE FUNCTION calculate_trending_scores()
RETURNS void AS $$
BEGIN
  -- Calculate trending based on recent views and engagement
  INSERT INTO trending_content (film_id, trend_score, views_24h, views_7d, calculated_at)
  SELECT 
    f.id as film_id,
    (
      COALESCE(views_24h.count, 0) * 10 + 
      COALESCE(views_7d.count, 0) * 2 +
      COALESCE(f.views, 0) * 0.1
    ) as trend_score,
    COALESCE(views_24h.count, 0) as views_24h,
    COALESCE(views_7d.count, 0) as views_7d,
    now() as calculated_at
  FROM films f
  LEFT JOIN (
    SELECT film_id, COUNT(*) as count
    FROM playback_events
    WHERE created_at > now() - interval '24 hours'
    GROUP BY film_id
  ) views_24h ON views_24h.film_id = f.id
  LEFT JOIN (
    SELECT film_id, COUNT(*) as count
    FROM playback_events
    WHERE created_at > now() - interval '7 days'
    GROUP BY film_id
  ) views_7d ON views_7d.film_id = f.id
  ON CONFLICT (film_id)
  DO UPDATE SET
    trend_score = EXCLUDED.trend_score,
    views_24h = EXCLUDED.views_24h,
    views_7d = EXCLUDED.views_7d,
    calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
