/*
  # Add status column to films table

  1. Changes
    - Add status column to films table with default 'published'
    - Add check constraint for valid status values
    - Update existing films to have 'published' status
    
  2. Notes
    - Status values: 'draft', 'published', 'archived', 'unlisted'
    - Default is 'published' for backward compatibility
*/

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'films' AND column_name = 'status'
  ) THEN
    ALTER TABLE films ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'films_status_check'
  ) THEN
    ALTER TABLE films ADD CONSTRAINT films_status_check 
    CHECK (status IN ('draft', 'published', 'archived', 'unlisted'));
  END IF;
END $$;

-- Update any existing NULL status to 'published'
UPDATE films SET status = 'published' WHERE status IS NULL;
