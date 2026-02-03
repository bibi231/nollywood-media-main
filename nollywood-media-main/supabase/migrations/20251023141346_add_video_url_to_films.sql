-- Add video_url column to films table
ALTER TABLE films ADD COLUMN IF NOT EXISTS video_url text;