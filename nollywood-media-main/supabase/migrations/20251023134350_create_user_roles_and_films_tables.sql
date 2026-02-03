/*
  # Create User Roles and Films Tables

  ## Summary
  Creates comprehensive tables for user management, role-based access control, and film catalog management in the database.

  ## New Tables

  ### `user_roles`
  Stores user role assignments for access control
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, not null) - Reference to auth.users
  - `role` (text, not null) - Role name: 'user', 'admin', 'super_admin'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - Unique constraint on user_id to ensure one role per user

  ### `films`
  Stores complete film catalog with all metadata
  - `id` (text, primary key) - Film identifier matching catalog
  - `title` (text, not null) - Film title
  - `poster_url` (text) - URL to poster image
  - `logline` (text, not null) - Short description
  - `synopsis` (text) - Full synopsis
  - `genre` (text, not null) - Primary genre
  - `release_year` (integer, not null) - Year of release
  - `runtime_min` (integer, not null) - Duration in minutes
  - `rating` (text, not null) - Content rating
  - `setting_region` (text, not null) - Geographic region
  - `languages_audio` (text, not null) - Available audio languages
  - `languages_subtitles` (text, not null) - Available subtitle languages
  - `cast_members` (text) - Cast members
  - `director` (text) - Director name
  - `studio_label` (text, not null) - Production studio
  - `tags` (text) - Comma-separated tags
  - `content_type` (text) - Content type classification
  - `availability_note` (text) - Availability information
  - `licensing_note` (text) - Licensing information
  - `views` (integer, default 0) - View count
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `user_watchlist`
  Stores user's saved films for watching later
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, not null) - Reference to auth.users
  - `film_id` (text, not null) - Reference to films table
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, film_id)

  ### `watch_progress`
  Tracks user progress through films
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, not null) - Reference to auth.users
  - `film_id` (text, not null) - Reference to films table
  - `progress_seconds` (numeric, not null) - Current position in seconds
  - `duration_seconds` (numeric, not null) - Total duration
  - `completed` (boolean, default false) - Whether film was finished
  - `last_watched` (timestamptz, default now()) - Last watch timestamp
  - Unique constraint on (user_id, film_id)

  ## Security
  - Enable RLS on all tables
  - user_roles: Only admins can modify, users can read their own role
  - films: Public read access, only admins can write
  - user_watchlist: Users can only access their own watchlist
  - watch_progress: Users can only access their own progress

  ## Important Notes
  - Initial admin users must be added manually via direct database access
  - Films table replaces static JSON catalog for dynamic content management
  - View counts are incremented when users watch content
  - Watch progress auto-updates during video playback
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create films table
CREATE TABLE IF NOT EXISTS films (
  id text PRIMARY KEY,
  title text NOT NULL,
  poster_url text,
  logline text NOT NULL,
  synopsis text,
  genre text NOT NULL,
  release_year integer NOT NULL,
  runtime_min integer NOT NULL,
  rating text NOT NULL,
  setting_region text NOT NULL,
  languages_audio text NOT NULL,
  languages_subtitles text NOT NULL,
  cast_members text,
  director text,
  studio_label text NOT NULL,
  tags text,
  content_type text,
  availability_note text,
  licensing_note text,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_watchlist table
CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, film_id)
);

-- Create watch_progress table
CREATE TABLE IF NOT EXISTS watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  progress_seconds numeric NOT NULL DEFAULT 0,
  duration_seconds numeric NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  last_watched timestamptz DEFAULT now(),
  UNIQUE(user_id, film_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can read their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Films policies
CREATE POLICY "Anyone can read films"
  ON films FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert films"
  ON films FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update films"
  ON films FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete films"
  ON films FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Watchlist policies
CREATE POLICY "Users can read own watchlist"
  ON user_watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON user_watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON user_watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Watch progress policies
CREATE POLICY "Users can read own progress"
  ON watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_films_genre ON films(genre);
CREATE INDEX IF NOT EXISTS idx_films_release_year ON films(release_year);
CREATE INDEX IF NOT EXISTS idx_films_rating ON films(rating);
CREATE INDEX IF NOT EXISTS idx_films_setting_region ON films(setting_region);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_film_id ON user_watchlist(film_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_film_id ON watch_progress(film_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_films_updated_at
  BEFORE UPDATE ON films
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
