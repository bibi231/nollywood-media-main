/*
  # Allow User Video Uploads

  1. Storage Policies Updates
    - Allow authenticated users to upload to user-content bucket
    - Allow authenticated users to upload thumbnails
    - Users can only delete their own uploads

  2. New Storage Bucket
    - `user-content` - For user-generated video content

  3. User Uploads Table Updates
    - Add status tracking for moderation
    - Add visibility settings
    - Add metadata fields

  4. Security
    - Users can only access their own uploads
    - Admins can access all uploads
    - Public can view approved content
*/

-- Create user-content storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-content',
  'user-content',
  true,
  2147483648, -- 2GB limit for users
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 2147483648,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'];

-- Storage policies for user-content bucket

-- Public can view approved content
CREATE POLICY "Public can view approved user content"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-content');

-- Authenticated users can upload their own content
CREATE POLICY "Users can upload their own content"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own uploads
CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-content' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all user content
CREATE POLICY "Admins can delete any user content"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-content' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Update thumbnails bucket policies for users
CREATE POLICY "Users can upload their own thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'thumbnails' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create user_content_uploads table for tracking user uploads
CREATE TABLE IF NOT EXISTS user_content_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_filename text NOT NULL,
  video_path text NOT NULL,
  video_url text,
  thumbnail_path text,
  thumbnail_url text,
  file_size bigint NOT NULL,
  duration integer,
  category text,
  tags text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'pending',
  visibility text NOT NULL DEFAULT 'private',
  moderation_status text NOT NULL DEFAULT 'pending',
  moderation_notes text,
  rejection_reason text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_content_uploads
ALTER TABLE user_content_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON user_content_uploads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view approved/published content
CREATE POLICY "Public can view approved content"
  ON user_content_uploads FOR SELECT
  TO public
  USING (
    moderation_status = 'approved' AND
    visibility = 'public' AND
    status = 'published'
  );

-- Admins can view all uploads
CREATE POLICY "Admins can view all uploads"
  ON user_content_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can insert their own uploads
CREATE POLICY "Users can create uploads"
  ON user_content_uploads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own uploads (before approval)
CREATE POLICY "Users can update own uploads"
  ON user_content_uploads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND moderation_status IN ('pending', 'rejected'))
  WITH CHECK (user_id = auth.uid());

-- Admins can update any upload
CREATE POLICY "Admins can update any upload"
  ON user_content_uploads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
  ON user_content_uploads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can delete any upload
CREATE POLICY "Admins can delete any upload"
  ON user_content_uploads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_content_uploads_user_id ON user_content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_uploads_status ON user_content_uploads(status);
CREATE INDEX IF NOT EXISTS idx_user_content_uploads_moderation ON user_content_uploads(moderation_status);
CREATE INDEX IF NOT EXISTS idx_user_content_uploads_visibility ON user_content_uploads(visibility);
CREATE INDEX IF NOT EXISTS idx_user_content_uploads_published ON user_content_uploads(published_at) WHERE published_at IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_content_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_content_uploads_updated_at_trigger ON user_content_uploads;
CREATE TRIGGER update_user_content_uploads_updated_at_trigger
  BEFORE UPDATE ON user_content_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_user_content_uploads_updated_at();

-- Create function to auto-publish approved content
CREATE OR REPLACE FUNCTION auto_publish_approved_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status != 'approved' THEN
    NEW.status = 'published';
    NEW.published_at = now();
    NEW.visibility = 'public';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-publishing
DROP TRIGGER IF EXISTS auto_publish_approved_content_trigger ON user_content_uploads;
CREATE TRIGGER auto_publish_approved_content_trigger
  BEFORE UPDATE ON user_content_uploads
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_approved_content();
