-- ============================================================================
-- NOLLYWOOD MEDIA PLATFORM - COMPLETE DATABASE SETUP
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENSURE USER PROFILES TABLE EXISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  favorite_genres TEXT[] DEFAULT '{}',
  social_links JSONB,
  is_creator BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are readable" ON user_profiles
  FOR SELECT USING (true);

-- ============================================================================
-- 2. WATCHLIST TABLE (for bookmarking films)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, film_id)
);

ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist" ON user_watchlist
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. WATCH HISTORY & PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, film_id)
);

ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch progress" ON watch_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress" ON watch_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. FILM COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS film_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE film_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable" ON film_comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments" ON film_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON film_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON film_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. COMMENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES film_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are publicly readable" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. FILM RATINGS TABLE (aggregated ratings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS film_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID NOT NULL UNIQUE REFERENCES films(id) ON DELETE CASCADE,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  five_star INTEGER DEFAULT 0,
  four_star INTEGER DEFAULT 0,
  three_star INTEGER DEFAULT 0,
  two_star INTEGER DEFAULT 0,
  one_star INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE film_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Film ratings are public" ON film_ratings
  FOR SELECT USING (true);

-- ============================================================================
-- 7. USER FOLLOWS TABLE (for creators/channels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_upload', 'new_comment', 'new_follower', 'like', 'mention')),
  title TEXT NOT NULL,
  message TEXT,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_film_id UUID REFERENCES films(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. USER UPLOADS TABLE (for user-generated content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_content_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  genre TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_content_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved uploads are public" ON user_content_uploads
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can create uploads" ON user_content_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON user_content_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. STUDIO ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS studio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  total_watch_time_hours NUMERIC DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  total_content INTEGER DEFAULT 0,
  recent_views_48h INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE studio_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own analytics" ON studio_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 11. CREATOR PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  channel_description TEXT,
  channel_avatar TEXT,
  subscriber_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator profiles are public" ON creator_profiles
  FOR SELECT USING (true);

CREATE POLICY "Creators can update own profile" ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 12. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC(10, 2) NOT NULL,
  price_ngn NUMERIC(12, 2),
  duration_days INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are public" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

-- ============================================================================
-- 13. USER SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 14. PLAYBACK EVENTS TABLE (for analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS playback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('play', 'pause', 'resume', 'seek', 'complete')),
  timestamp_seconds INTEGER,
  session_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create playback events" ON playback_events
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- INSERT SAMPLE FILMS
-- ============================================================================
INSERT INTO films (
  title, logline, synopsis, genre, rating, release_year, runtime_min,
  setting_region, languages_audio, languages_subtitles, cast_members,
  director, studio_label, tags, video_url, poster_url, thumbnail_url,
  status, created_at
) VALUES
-- Film 1
('The King''s Dilemma', 
  'A young prince must choose between love and duty',
  'In a fictional African kingdom, Prince Kwame falls in love with a commoner, but his father demands he marry for political alliance. A tale of sacrifice and true love.',
  ARRAY['Drama', 'Romance'],
  'PG-13',
  2023,
  118,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Chiwetel Ejiofor', 'Lupita Nyong''o', 'Idris Elba'],
  'Amma Asante',
  'Nollywood Studios',
  ARRAY['drama', 'romance', 'african'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300',
  'published',
  NOW()
),
-- Film 2
('Lagos Nights', 
  'A detective uncovers dark secrets in the city',
  'Detective Yetunde returns to her hometown Lagos to solve her sister''s mysterious disappearance, uncovering a web of corruption and betrayal.',
  ARRAY['Thriller', 'Crime'],
  'R',
  2023,
  125,
  'Nigeria',
  ARRAY['English', 'Yoruba'],
  ARRAY['English'],
  ARRAY['Genevieve Nnaji', 'Kunle Remi'],
  'Niyi Akinmolayan',
  'Nollywood Studios',
  ARRAY['thriller', 'mystery', 'crime'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300',
  'published',
  NOW()
),
-- Film 3
('Heritage', 
  'A family fights to preserve their ancestral home',
  'When a wealthy developer threatens to demolish a historic family compound, the three sisters must unite to save their inheritance and cultural legacy.',
  ARRAY['Drama', 'Family'],
  'PG',
  2023,
  142,
  'Nigeria',
  ARRAY['English', 'Igbo'],
  ARRAY['English'],
  ARRAY['Funke Akindele', 'Ini Edo', 'Chidi Mokeme'],
  'Bolanle Austen-Peters',
  'EbonyLife Films',
  ARRAY['drama', 'family', 'cultural'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=400&h=600',
  'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=200&h=300',
  'published',
  NOW()
),
-- Film 4
('Code Red', 
  'Young hackers must stop a cyber terrorist',
  'A team of brilliant young tech enthusiasts in Lagos discover a hacker plotting to shut down the country''s power grid. They must use their skills to stop him before midnight.',
  ARRAY['Action', 'Sci-Fi', 'Thriller'],
  'PG-13',
  2023,
  108,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Timini Egbuson', 'Sharon Ooja', 'Adesua Etomi-Wellington'],
  'Jade Osiberu',
  'Netflix Africa',
  ARRAY['action', 'scifi', 'thriller', 'tech'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300',
  'published',
  NOW()
),
-- Film 5
('The Last Dance', 
  'A former dancer makes one final comeback',
  'After a career-ending injury, Zainab, a celebrated dancer, gets an unexpected opportunity to perform one last time. She must overcome her fears and physical limitations.',
  ARRAY['Drama', 'Romance'],
  'PG',
  2022,
  115,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Osas Ighodaro', 'Stan Nze', 'Mawuli Gavor'],
  'Abba Makama',
  'Nollywood Studios',
  ARRAY['drama', 'dance', 'romance'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300',
  'published',
  NOW()
),
-- Film 6
('Mothers of Akure', 
  'Three mothers navigate life, love, and loss',
  'In the town of Akure, three mothers from different generations share their stories of resilience, sacrifice, and the bonds that hold families together.',
  ARRAY['Drama'],
  'PG',
  2023,
  128,
  'Nigeria',
  ARRAY['English', 'Yoruba'],
  ARRAY['English'],
  ARRAY['Patience Ozokwor', 'Judith Audu', 'Toyin Abraham'],
  'Kene Mkparu',
  'EbonyLife Films',
  ARRAY['drama', 'family', 'nigerian'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=400&h=600',
  'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=200&h=300',
  'published',
  NOW()
),
-- Film 7
('The Wedding', 
  'A dream wedding becomes a nightmare',
  'Just days before her perfect wedding, Amina discovers her fiancé has a dark secret. She must decide between love and truth.',
  ARRAY['Romance', 'Drama', 'Thriller'],
  'PG-13',
  2023,
  105,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Bisola Aiyeola', 'Ikechukwu Onunaku', 'Deyemi Okanlawon'],
  'Adekunle Adejuyigbe',
  'Nollywood Studios',
  ARRAY['romance', 'wedding', 'drama'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=300',
  'published',
  NOW()
),
-- Film 8
('Redemption Song', 
  'A reformed criminal tries to start over',
  'Chidi, released after 15 years in prison, struggles to reintegrate into society while seeking forgiveness from those he wronged.',
  ARRAY['Drama'],
  'R',
  2023,
  132,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Onyeka Onwenu', 'Segun Arinze', 'Nonso Diobi'],
  'Mezie Emeka',
  'Nollywood Studios',
  ARRAY['drama', 'redemption', 'crime'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&h=600',
  'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=200&h=300',
  'published',
  NOW()
),
-- Film 9
('Golden Hearts', 
  'Two strangers meet and change each other''s lives',
  'When Adekunle, a successful businessman, meets Zara, a free-spirited artist, they discover that sometimes the best things in life cannot be planned.',
  ARRAY['Romance', 'Comedy'],
  'PG',
  2023,
  98,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Banky W', 'Adesua Etomi-Wellington', 'Ebube Obio'],
  'Jadesola Osiberu',
  'EbonyLife Films',
  ARRAY['romance', 'comedy', 'nigerian'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300',
  'published',
  NOW()
),
-- Film 10
('Shadows of Power', 
  'A politician''s rise to power comes at a great cost',
  'Tunde''s ambition to become governor forces him to make moral compromises that threaten to destroy his family and soul.',
  ARRAY['Drama', 'Thriller'],
  'R',
  2023,
  138,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Sanni Mustapha', 'Jide Kosoko', 'Dakore Egbuson'],
  'Kunle Afolayan',
  'Kunle Afolayan Films',
  ARRAY['drama', 'political', 'thriller'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300',
  'published',
  NOW()
);

-- Add more variations if needed
INSERT INTO films (
  title, logline, synopsis, genre, rating, release_year, runtime_min,
  setting_region, languages_audio, languages_subtitles, cast_members,
  director, studio_label, tags, video_url, poster_url, thumbnail_url,
  status, created_at
) VALUES
('The Rise', 
  'From streets to success',
  'A young entrepreneur fights her way from poverty to build a thriving tech business in Lagos.',
  ARRAY['Drama', 'Inspirational'],
  'PG',
  2023,
  112,
  'Nigeria',
  ARRAY['English'],
  ARRAY['English'],
  ARRAY['Toke Makinwa', 'Lateef Adedimeji'],
  'Temitope Bolatito',
  'Nollywood Studios',
  ARRAY['drama', 'inspirational', 'business'],
  'https://sample-video.mp4',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600',
  'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300',
  'published',
  NOW()
);

-- ============================================================================
-- INSERT SAMPLE SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO subscription_plans (name, description, price_usd, price_ngn, duration_days, features, is_active)
VALUES
  ('Free', 'Access to free films with ads', 0, 0, 0, ARRAY['Ad-supported content', 'SD quality', 'Limited catalog'], TRUE),
  ('Basic', 'Watch ad-free with HD quality', 4.99, 8000, 30, ARRAY['Ad-free streaming', 'HD 720p', 'Full catalog', 'Offline downloads (3 films)'], TRUE),
  ('Premium', 'Unlimited streaming in 4K', 12.99, 20000, 30, ARRAY['Ad-free streaming', '4K UHD', 'Full catalog', 'Offline downloads (10 films)', 'Multi-device access'], TRUE),
  ('Family', 'Up to 6 profiles for your family', 16.99, 27000, 30, ARRAY['Ad-free streaming', '4K UHD', 'Full catalog', '6 simultaneous streams', 'Parental controls', 'Offline downloads (15 films)'], TRUE);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_film_id ON user_watchlist(film_id);

CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_film_id ON watch_progress(film_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_last_watched ON watch_progress(last_watched);

CREATE INDEX IF NOT EXISTS idx_film_comments_film_id ON film_comments(film_id);
CREATE INDEX IF NOT EXISTS idx_film_comments_user_id ON film_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_film_comments_created_at ON film_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_status ON user_content_uploads(status);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- SQL SETUP COMPLETE!
-- ============================================================================
-- All tables created successfully. You can now:
-- 1. Sign up users via the app
-- 2. Add films to watchlist
-- 3. Track watch progress
-- 4. Leave comments and ratings
-- 5. Follow creators
-- 6. Subscribe to plans
-- 
-- To verify setup, run:
-- SELECT * FROM films LIMIT 10;
-- ============================================================================
