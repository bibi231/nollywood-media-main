-- NAIJAMATION PHASE 7 MIGRATIONS
-- Consolidated migration for Settings, Playlists, Blog, and AI features

-- 1. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications JSONB DEFAULT '{"email": true, "push": true, "updates": true, "marketing": false, "security": true}'::jsonb,
    privacy JSONB DEFAULT '{"profile_visibility": "public", "show_watchlist": true, "show_history": false}'::jsonb,
    playback JSONB DEFAULT '{"theme": "system", "quality": "auto", "autoplay": true}'::jsonb,
    content_preferences JSONB DEFAULT '{"language": "en", "maturity_rating": "PG-13", "subtitles": true, "region": "NG"}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" 
ON public.user_settings FOR ALL 
USING (auth.uid() = user_id);

-- 2. Playlists Tables
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playlist_films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    film_id UUID REFERENCES public.films(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, film_id)
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own playlists" 
ON public.playlists FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public playlists" 
ON public.playlists FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can manage films in their playlists" 
ON public.playlist_films FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = playlist_films.playlist_id 
        AND user_id = auth.uid()
    )
);

-- 3. Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES auth.users(id),
    cover_image TEXT,
    category TEXT,
    tags TEXT[],
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (published = true);

-- 4. AI Video Generation Tracking
-- Add source column to user_uploads to track AI generated content
DO $$ 
BEGIN 
    -- Check if the table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_uploads') THEN
        -- Check if the column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' AND table_name='user_uploads' AND column_name='source') THEN
            ALTER TABLE public.user_uploads ADD COLUMN source TEXT DEFAULT 'upload';
        END IF;
    END IF;
END $$;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_playlists
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
