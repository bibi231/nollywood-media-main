/*
  # Add poster_path field to films table

  1. Changes
    - Add poster_path column to films table to store storage path
    - Keep poster_url for backwards compatibility (will be generated from path)
    
  2. Notes
    - poster_path stores the storage bucket path
    - poster_url stores the public URL (can be generated dynamically)
*/

-- Add poster_path column to films table
ALTER TABLE films ADD COLUMN IF NOT EXISTS poster_path text;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_films_poster_path ON films(poster_path) WHERE poster_path IS NOT NULL;
