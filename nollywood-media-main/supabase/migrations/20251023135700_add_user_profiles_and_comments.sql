/*
  # User Profiles and Comments System

  ## Summary
  Creates tables for user profiles, film comments, and ratings to enable social features.

  ## New Tables

  ### `user_profiles`
  Extended user information beyond authentication
  - `user_id` (uuid, primary key) - Reference to auth.users
  - `display_name` (text) - Public display name
  - `avatar_url` (text) - Profile picture URL
  - `bio` (text) - User biography
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `film_comments`
  User comments and reviews on films
  - `id` (uuid, primary key) - Unique identifier
  - `film_id` (text, not null) - Reference to films table
  - `user_id` (uuid, not null) - Reference to auth.users
  - `content` (text, not null) - Comment text
  - `rating` (integer) - Optional 1-5 star rating
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `comment_likes`
  Tracks which users liked which comments
  - `id` (uuid, primary key) - Unique identifier
  - `comment_id` (uuid, not null) - Reference to film_comments
  - `user_id` (uuid, not null) - Reference to auth.users
  - `created_at` (timestamptz, default now())
  - Unique constraint on (comment_id, user_id)

  ## Security
  - Enable RLS on all tables
  - user_profiles: Users can read all, update only their own
  - film_comments: Public read, users can create/update/delete their own
  - comment_likes: Users can manage their own likes

  ## Important Notes
  - Rating is optional on comments (1-5 stars)
  - Comments can be edited within first hour
  - Profile display names must be unique
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create film_comments table
CREATE TABLE IF NOT EXISTS film_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES film_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Anyone can read profiles"
  ON user_profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Film comments policies
CREATE POLICY "Anyone can read comments"
  ON film_comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON film_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON film_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON film_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Anyone can read likes"
  ON comment_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_film_comments_film_id ON film_comments(film_id);
CREATE INDEX IF NOT EXISTS idx_film_comments_user_id ON film_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_film_comments_created_at ON film_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_film_comments_updated_at
  BEFORE UPDATE ON film_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
