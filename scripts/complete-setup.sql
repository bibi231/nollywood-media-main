-- ============================================================================
-- NOLLYWOOD MEDIA PLATFORM - COMPLETE ONE-SHOT DATABASE SETUP
-- Copy and paste EVERYTHING below into Supabase SQL Editor and run
-- This includes all migrations + data in one script
-- ============================================================================

-- ============================================================================
-- CREATE FILMS TABLE (REQUIRED FIRST)
-- ============================================================================
CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  logline TEXT,
  synopsis TEXT,
  genre TEXT[] DEFAULT '{}',
  rating TEXT,
  release_year INTEGER,
  runtime_min INTEGER,
  setting_region TEXT,
  languages_audio TEXT[] DEFAULT '{}',
  languages_subtitles TEXT[] DEFAULT '{}',
  cast_members TEXT[] DEFAULT '{}',
  director TEXT,
  studio_label TEXT,
  tags TEXT[] DEFAULT '{}',
  video_url TEXT,
  poster_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'unlisted' CHECK (status IN ('published', 'unlisted', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE STREAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('hls', 'dash', 'mp4')),
  quality TEXT CHECK (quality IN ('480p', '720p', '1080p', '4k')),
  bitrate_kbps INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE CAPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  url TEXT NOT NULL,
  format TEXT CHECK (format IN ('vtt', 'srt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE USER ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'creator', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREATE USER PROFILES TABLE
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

-- ============================================================================
-- CREATE WATCHLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, film_id)
);

-- ============================================================================
-- CREATE WATCH PROGRESS TABLE
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

-- ============================================================================
-- CREATE FILM COMMENTS TABLE
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

-- ============================================================================
-- CREATE COMMENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES film_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- CREATE FILM RATINGS TABLE
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

-- ============================================================================
-- CREATE USER FOLLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================================
-- CREATE NOTIFICATIONS TABLE
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

-- ============================================================================
-- CREATE USER CONTENT UPLOADS TABLE
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

-- ============================================================================
-- CREATE STUDIO ANALYTICS TABLE
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

-- ============================================================================
-- CREATE CREATOR PROFILES TABLE
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

-- ============================================================================
-- CREATE SUBSCRIPTION PLANS TABLE
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

-- ============================================================================
-- CREATE USER SUBSCRIPTIONS TABLE
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

-- ============================================================================
-- CREATE PLAYBACK EVENTS TABLE
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

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Films (public read)
CREATE POLICY "Films are public" ON films FOR SELECT USING (true);

-- User Profiles
CREATE POLICY "Users can read their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public profiles readable" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlist
CREATE POLICY "Users manage own watchlist" ON user_watchlist FOR ALL USING (auth.uid() = user_id);

-- Watch Progress
CREATE POLICY "Users view own progress" ON watch_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON watch_progress FOR ALL USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are public" ON film_comments FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users create comments" ON film_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON film_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON film_comments FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes
CREATE POLICY "Likes are public" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON comment_likes FOR ALL USING (auth.uid() = user_id);

-- Ratings
CREATE POLICY "Ratings are public" ON film_ratings FOR SELECT USING (true);

-- Follows
CREATE POLICY "Follows are public" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- Notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- User Uploads
CREATE POLICY "Approved uploads public" ON user_content_uploads FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Users create uploads" ON user_content_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own uploads" ON user_content_uploads FOR UPDATE USING (auth.uid() = user_id);

-- Studio Analytics
CREATE POLICY "Creators view own analytics" ON studio_analytics FOR SELECT USING (auth.uid() = user_id);

-- Creator Profiles
CREATE POLICY "Profiles are public" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators update own profile" ON creator_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Subscription Plans
CREATE POLICY "Plans are public" ON subscription_plans FOR SELECT USING (is_active = TRUE);

-- User Subscriptions
CREATE POLICY "Users view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Playback Events
CREATE POLICY "Create playback events" ON playback_events FOR INSERT WITH CHECK (true);

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert 11 Sample Films
INSERT INTO films (title, logline, synopsis, genre, rating, release_year, runtime_min, setting_region, languages_audio, languages_subtitles, cast_members, director, studio_label, tags, video_url, poster_url, thumbnail_url, status, created_at)
VALUES
('The King''s Dilemma', 'A young prince must choose between love and duty', 'In a fictional African kingdom, Prince Kwame falls in love with a commoner, but his father demands he marry for political alliance. A tale of sacrifice and true love.', ARRAY['Drama', 'Romance'], 'PG-13', 2023, 118, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Chiwetel Ejiofor', 'Lupita Nyong''o', 'Idris Elba'], 'Amma Asante', 'Nollywood Studios', ARRAY['drama', 'romance', 'african'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300', 'published', NOW()),
('Lagos Nights', 'A detective uncovers dark secrets in the city', 'Detective Yetunde returns to her hometown Lagos to solve her sister''s mysterious disappearance, uncovering a web of corruption and betrayal.', ARRAY['Thriller', 'Crime'], 'R', 2023, 125, 'Nigeria', ARRAY['English', 'Yoruba'], ARRAY['English'], ARRAY['Genevieve Nnaji', 'Kunle Remi'], 'Niyi Akinmolayan', 'Nollywood Studios', ARRAY['thriller', 'mystery', 'crime'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300', 'published', NOW()),
('Heritage', 'A family fights to preserve their ancestral home', 'When a wealthy developer threatens to demolish a historic family compound, the three sisters must unite to save their inheritance and cultural legacy.', ARRAY['Drama', 'Family'], 'PG', 2023, 142, 'Nigeria', ARRAY['English', 'Igbo'], ARRAY['English'], ARRAY['Funke Akindele', 'Ini Edo', 'Chidi Mokeme'], 'Bolanle Austen-Peters', 'EbonyLife Films', ARRAY['drama', 'family', 'cultural'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=400&h=600', 'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=200&h=300', 'published', NOW()),
('Code Red', 'Young hackers must stop a cyber terrorist', 'A team of brilliant young tech enthusiasts in Lagos discover a hacker plotting to shut down the country''s power grid. They must use their skills to stop him before midnight.', ARRAY['Action', 'Sci-Fi', 'Thriller'], 'PG-13', 2023, 108, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Timini Egbuson', 'Sharon Ooja', 'Adesua Etomi-Wellington'], 'Jade Osiberu', 'Netflix Africa', ARRAY['action', 'scifi', 'thriller', 'tech'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300', 'published', NOW()),
('The Last Dance', 'A former dancer makes one final comeback', 'After a career-ending injury, Zainab, a celebrated dancer, gets an unexpected opportunity to perform one last time. She must overcome her fears and physical limitations.', ARRAY['Drama', 'Romance'], 'PG', 2022, 115, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Osas Ighodaro', 'Stan Nze', 'Mawuli Gavor'], 'Abba Makama', 'Nollywood Studios', ARRAY['drama', 'dance', 'romance'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300', 'published', NOW()),
('Mothers of Akure', 'Three mothers navigate life, love, and loss', 'In the town of Akure, three mothers from different generations share their stories of resilience, sacrifice, and the bonds that hold families together.', ARRAY['Drama'], 'PG', 2023, 128, 'Nigeria', ARRAY['English', 'Yoruba'], ARRAY['English'], ARRAY['Patience Ozokwor', 'Judith Audu', 'Toyin Abraham'], 'Kene Mkparu', 'EbonyLife Films', ARRAY['drama', 'family', 'nigerian'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=400&h=600', 'https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=200&h=300', 'published', NOW()),
('The Wedding', 'A dream wedding becomes a nightmare', 'Just days before her perfect wedding, Amina discovers her fiancé has a dark secret. She must decide between love and truth.', ARRAY['Romance', 'Drama', 'Thriller'], 'PG-13', 2023, 105, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Bisola Aiyeola', 'Ikechukwu Onunaku', 'Deyemi Okanlawon'], 'Adekunle Adejuyigbe', 'Nollywood Studios', ARRAY['romance', 'wedding', 'drama'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=300', 'published', NOW()),
('Redemption Song', 'A reformed criminal tries to start over', 'Chidi, released after 15 years in prison, struggles to reintegrate into society while seeking forgiveness from those he wronged.', ARRAY['Drama'], 'R', 2023, 132, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Onyeka Onwenu', 'Segun Arinze', 'Nonso Diobi'], 'Mezie Emeka', 'Nollywood Studios', ARRAY['drama', 'redemption', 'crime'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&h=600', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=200&h=300', 'published', NOW()),
('Golden Hearts', 'Two strangers meet and change each other''s lives', 'When Adekunle, a successful businessman, meets Zara, a free-spirited artist, they discover that sometimes the best things in life cannot be planned.', ARRAY['Romance', 'Comedy'], 'PG', 2023, 98, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Banky W', 'Adesua Etomi-Wellington', 'Ebube Obio'], 'Jadesola Osiberu', 'EbonyLife Films', ARRAY['romance', 'comedy', 'nigerian'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300', 'published', NOW()),
('Shadows of Power', 'A politician''s rise to power comes at a great cost', 'Tunde''s ambition to become governor forces him to make moral compromises that threaten to destroy his family and soul.', ARRAY['Drama', 'Thriller'], 'R', 2023, 138, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Sanni Mustapha', 'Jide Kosoko', 'Dakore Egbuson'], 'Kunle Afolayan', 'Kunle Afolayan Films', ARRAY['drama', 'political', 'thriller'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=300', 'published', NOW()),
('The Rise', 'From streets to success', 'A young entrepreneur fights her way from poverty to build a thriving tech business in Lagos.', ARRAY['Drama', 'Inspirational'], 'PG', 2023, 112, 'Nigeria', ARRAY['English'], ARRAY['English'], ARRAY['Toke Makinwa', 'Lateef Adedimeji'], 'Temitope Bolatito', 'Nollywood Studios', ARRAY['drama', 'inspirational', 'business'], 'https://sample-video.mp4', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600', 'https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=200&h=300', 'published', NOW());

-- Insert Subscription Plans
INSERT INTO subscription_plans (name, description, price_usd, price_ngn, duration_days, features, is_active)
VALUES
('Free', 'Access to free films with ads', 0, 0, 0, ARRAY['Ad-supported content', 'SD quality', 'Limited catalog'], TRUE),
('Basic', 'Watch ad-free with HD quality', 4.99, 8000, 30, ARRAY['Ad-free streaming', 'HD 720p', 'Full catalog', 'Offline downloads (3 films)'], TRUE),
('Premium', 'Unlimited streaming in 4K', 12.99, 20000, 30, ARRAY['Ad-free streaming', '4K UHD', 'Full catalog', 'Offline downloads (10 films)', 'Multi-device access'], TRUE),
('Family', 'Up to 6 profiles for your family', 16.99, 27000, 30, ARRAY['Ad-free streaming', '4K UHD', 'Full catalog', '6 simultaneous streams', 'Parental controls', 'Offline downloads (15 films)'], TRUE);

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_films_status ON films(status);
CREATE INDEX idx_films_genre ON films USING GIN(genre);
CREATE INDEX idx_films_release_year ON films(release_year);
CREATE INDEX idx_streams_film_id ON streams(film_id);
CREATE INDEX idx_captions_film_id ON captions(film_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_film_id ON user_watchlist(film_id);
CREATE INDEX idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX idx_watch_progress_film_id ON watch_progress(film_id);
CREATE INDEX idx_watch_progress_last_watched ON watch_progress(last_watched);
CREATE INDEX idx_film_comments_film_id ON film_comments(film_id);
CREATE INDEX idx_film_comments_user_id ON film_comments(user_id);
CREATE INDEX idx_film_comments_created_at ON film_comments(created_at);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_user_uploads_user_id ON user_content_uploads(user_id);
CREATE INDEX idx_user_uploads_status ON user_content_uploads(status);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_playback_events_film_id ON playback_events(film_id);

-- ============================================================================
-- DONE! 
-- ============================================================================
-- All 14 tables created with RLS policies and 11 sample films loaded!
-- You can now use the app with full database functionality.
-- ============================================================================
