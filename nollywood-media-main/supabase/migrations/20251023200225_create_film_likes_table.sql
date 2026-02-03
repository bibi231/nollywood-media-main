/*
  # Create film_likes table for like/dislike functionality

  1. New Tables
    - `film_likes`
      - `id` (uuid, primary key)
      - `film_id` (text, foreign key to films)
      - `user_id` (uuid, foreign key to auth.users)
      - `like_type` (text, 'like' or 'dislike')
      - `created_at` (timestamp)
      - Unique constraint on (film_id, user_id)
      
  2. Security
    - Enable RLS on `film_likes` table
    - Users can INSERT own likes
    - Users can UPDATE own likes
    - Users can DELETE own likes
    - Anyone can SELECT to see like counts
*/

-- Create film_likes table
CREATE TABLE IF NOT EXISTS film_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  like_type text NOT NULL CHECK (like_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(film_id, user_id)
);

-- Enable RLS
ALTER TABLE film_likes ENABLE ROW LEVEL SECURITY;

-- Policies for film_likes
CREATE POLICY "Users can insert own likes"
  ON film_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own likes"
  ON film_likes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON film_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
  ON film_likes
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_film_likes_film_id ON film_likes(film_id);
CREATE INDEX IF NOT EXISTS idx_film_likes_user_id ON film_likes(user_id);
