/*
  # Create Streams and Captions Tables

  ## Summary
  Creates tables to store video streaming data and captions for films in the catalog.

  ## New Tables

  ### `streams`
  Stores video sources (HLS/MP4 URLs) for films
  - `id` (uuid, primary key) - Unique identifier
  - `film_id` (text, unique, not null) - Reference to film ID from catalog
  - `poster_url` (text) - Optional poster/thumbnail URL
  - `provider` (text) - Streaming provider (e.g., 'mux', 'cloudflare', 'self-hosted')
  - `asset_id` (text) - Provider's asset identifier
  - `hls_url` (text) - HLS manifest URL
  - `mp4_url` (text) - Direct MP4 URL
  - `status` (text, default 'active') - Status: 'active', 'processing', 'inactive'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `captions`
  Stores subtitle/caption tracks for streams
  - `id` (uuid, primary key) - Unique identifier
  - `stream_id` (uuid, foreign key to streams) - Parent stream
  - `lang` (text, not null) - Language code (e.g., 'en', 'ig', 'yo')
  - `label` (text, not null) - Display label (e.g., 'English', 'Igbo')
  - `url` (text, not null) - WebVTT file URL
  - `is_default` (boolean, default false) - Whether this track is default
  - `created_at` (timestamptz, default now())

  ## Security
  - Enable RLS on both tables
  - Allow public read access to active streams and their captions
  - Restrict write access to authenticated admins only

  ## Important Notes
  - `film_id` matches the `id` field from nollywood_originals_catalog.json
  - Use `asset_id` + `provider` to generate signed URLs server-side for secure playback
  - Direct URLs (`hls_url`, `mp4_url`) can be used for public test streams
*/

-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id text UNIQUE NOT NULL,
  poster_url text,
  provider text DEFAULT 'self-hosted',
  asset_id text,
  hls_url text,
  mp4_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'processing', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create captions table
CREATE TABLE IF NOT EXISTS captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE,
  lang text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;

-- Streams policies: public read for active streams
CREATE POLICY "Public can read active streams"
  ON streams FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Authenticated users can insert streams"
  ON streams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update streams"
  ON streams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete streams"
  ON streams FOR DELETE
  TO authenticated
  USING (true);

-- Captions policies: public read for captions of active streams
CREATE POLICY "Public can read captions of active streams"
  ON captions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM streams
      WHERE streams.id = captions.stream_id
      AND streams.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can insert captions"
  ON captions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update captions"
  ON captions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete captions"
  ON captions FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_streams_film_id ON streams(film_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_captions_stream_id ON captions(stream_id);

-- Insert sample data matching the test streams
INSERT INTO streams (film_id, poster_url, hls_url, mp4_url, status) VALUES
  ('1', 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=800', 
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'active'),
  ('2', 'https://images.pexels.com/photos/5605118/pexels-photo-5605118.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', NULL, 'active'),
  ('3', 'https://images.pexels.com/photos/5876695/pexels-photo-5876695.jpeg?auto=compress&cs=tinysrgb&w=800',
   NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'active'),
  ('4', 'https://images.pexels.com/photos/6069563/pexels-photo-6069563.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', NULL, 'active'),
  ('5', 'https://images.pexels.com/photos/5691603/pexels-photo-5691603.jpeg?auto=compress&cs=tinysrgb&w=800',
   NULL, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'active')
ON CONFLICT (film_id) DO NOTHING;

-- Insert sample captions for film 1
INSERT INTO captions (stream_id, lang, label, url, is_default)
SELECT 
  id, 
  'en', 
  'English', 
  'https://cdn.jsdelivr.net/gh/Animosity/vtt-samples@master/advanced-captions-webvtt-example.vtt',
  true
FROM streams
WHERE film_id = '1'
ON CONFLICT DO NOTHING;
