/*
  # Enhance User Profiles
  
  1. Changes
    - Add more fields to user_profiles table:
      - bio (text) - User biography
      - city (text) - User's city
      - country (text) - User's country
      - date_of_birth (date) - User's birth date
      - phone_number (text) - Contact number
      - favorite_genres (text[]) - Array of favorite genres
      - social_links (jsonb) - Social media links
    
  2. Notes
    - All new fields are nullable to maintain backward compatibility
    - Uses IF NOT EXISTS to prevent errors on re-run
*/

DO $$ 
BEGIN
  -- Add bio field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;

  -- Add city field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;

  -- Add country field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text;
  END IF;

  -- Add date_of_birth field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth date;
  END IF;

  -- Add phone_number field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_number text;
  END IF;

  -- Add favorite_genres field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'favorite_genres'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN favorite_genres text[] DEFAULT '{}';
  END IF;

  -- Add social_links field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'social_links'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
