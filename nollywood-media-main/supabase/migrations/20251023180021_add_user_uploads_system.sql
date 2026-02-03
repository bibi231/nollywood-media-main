/*
  # User Content Upload System

  ## New Tables

  1. `user_uploads` - User-submitted content awaiting moderation
    - id, user_id, title, description, video_url, thumbnail_url
    - ai_verification_status, ai_confidence_score, ai_metadata
    - status (pending/approved/rejected/flagged)
    - rejection_reason, moderated_by, moderated_at
    
  2. `upload_metadata` - AI analysis of uploaded content
    - upload_id, analysis_type (content_safety/ai_detection/quality)
    - results (jsonb), confidence_score, passed

  ## Features
  - AI-generated content verification
  - Multi-step moderation workflow
  - Upload history tracking
  - Moderation queue for admins
  - Automatic status updates

  ## Security
  - RLS enabled
  - Users can only see/edit their own uploads
  - Admins can moderate all uploads
*/

-- User Uploads Table
CREATE TABLE IF NOT EXISTS user_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content Info
  title text NOT NULL,
  description text,
  logline text,
  genre text,
  tags text[] DEFAULT ARRAY[]::text[],
  runtime_min int,
  
  -- Media Files
  video_url text,
  thumbnail_url text,
  poster_url text,
  
  -- AI Verification
  ai_verification_status text DEFAULT 'pending',
  ai_confidence_score decimal(5,2),
  ai_metadata jsonb DEFAULT '{}'::jsonb,
  is_ai_generated boolean,
  creator_confirmation boolean DEFAULT false,
  
  -- Moderation
  status text DEFAULT 'pending',
  moderation_notes text,
  rejection_reason text,
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  
  -- Publishing
  published_film_id text REFERENCES films(id),
  published_at timestamptz,
  
  -- Tracking
  view_count int DEFAULT 0,
  like_count int DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Upload Metadata (AI Analysis Results)
CREATE TABLE IF NOT EXISTS upload_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,
  
  -- Analysis Details
  analysis_type text NOT NULL,
  provider text,
  results jsonb DEFAULT '{}'::jsonb,
  confidence_score decimal(5,2),
  passed boolean,
  
  -- Flags
  content_warnings text[] DEFAULT ARRAY[]::text[],
  detected_issues text[] DEFAULT ARRAY[]::text[],
  
  created_at timestamptz DEFAULT now()
);

-- Creator Profiles (Extended info for content creators)
CREATE TABLE IF NOT EXISTS creator_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Creator Info
  creator_name text NOT NULL,
  bio text,
  profile_image_url text,
  banner_url text,
  
  -- Stats
  total_uploads int DEFAULT 0,
  approved_uploads int DEFAULT 0,
  total_views int DEFAULT 0,
  follower_count int DEFAULT 0,
  
  -- Status
  verified boolean DEFAULT false,
  verified_at timestamptz,
  status text DEFAULT 'active',
  
  -- Social Links
  website_url text,
  twitter_handle text,
  instagram_handle text,
  youtube_channel text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Follows (Users can follow creators)
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Upload Views (Track who watched what)
CREATE TABLE IF NOT EXISTS upload_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES user_uploads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_status ON user_uploads(status);
CREATE INDEX IF NOT EXISTS idx_user_uploads_ai_status ON user_uploads(ai_verification_status);
CREATE INDEX IF NOT EXISTS idx_user_uploads_created_at ON user_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_metadata_upload_id ON upload_metadata(upload_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- RLS Policies

-- User Uploads
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads" 
  ON user_uploads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" 
  ON user_uploads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending uploads" 
  ON user_uploads FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all uploads" 
  ON user_uploads FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update all uploads" 
  ON user_uploads FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Anyone can view approved uploads" 
  ON user_uploads FOR SELECT 
  USING (status = 'approved');

-- Upload Metadata
ALTER TABLE upload_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upload metadata" 
  ON upload_metadata FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM user_uploads WHERE id = upload_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all metadata" 
  ON upload_metadata FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "System can insert metadata" 
  ON upload_metadata FOR INSERT 
  WITH CHECK (true);

-- Creator Profiles
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator profiles" 
  ON creator_profiles FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Users can manage own creator profile" 
  ON creator_profiles FOR ALL 
  USING (auth.uid() = user_id);

-- User Follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows" 
  ON user_follows FOR SELECT 
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage own follows" 
  ON user_follows FOR ALL 
  USING (auth.uid() = follower_id);

-- Upload Views
ALTER TABLE upload_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create views" 
  ON upload_views FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own views" 
  ON upload_views FOR SELECT 
  USING (auth.uid() = user_id);

-- Function to update creator stats
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_profiles
    SET total_uploads = total_uploads + 1
    WHERE user_id = NEW.user_id;
    
    IF NEW.status = 'approved' THEN
      UPDATE creator_profiles
      SET approved_uploads = approved_uploads + 1
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      UPDATE creator_profiles
      SET approved_uploads = approved_uploads + 1
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creator_stats_trigger
AFTER INSERT OR UPDATE ON user_uploads
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats();

-- Function to update follower count
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_profiles
    SET follower_count = follower_count + 1
    WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creator_profiles
    SET follower_count = follower_count - 1
    WHERE user_id = OLD.following_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_follower_count_trigger
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_count();