import { neon } from '@neondatabase/serverless';
import fs from 'fs';

let DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!DATABASE_URL && fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/NEON_DATABASE_URL=([^\s]+)/);
    if (match) DATABASE_URL = match[1];
}

const sql = neon(DATABASE_URL);

async function main() {
    try {
        console.log('Adding new columns...');
        await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS vertical_aspect BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;`;

        await sql`ALTER TABLE user_content_uploads ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE user_content_uploads ADD COLUMN IF NOT EXISTS vertical_aspect BOOLEAN DEFAULT false;`;

        console.log('Creating community post tables...');
        await sql`CREATE TABLE IF NOT EXISTS creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`;
        await sql`CREATE TABLE IF NOT EXISTS creator_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES creator_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);`;
        await sql`CREATE TABLE IF NOT EXISTS creator_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES creator_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`;

        console.log('Creating dislikes tables...');
        await sql`CREATE TABLE IF NOT EXISTS film_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(film_id, user_id)
);`;
        await sql`CREATE TABLE IF NOT EXISTS comment_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES film_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);`;

        console.log('✅ Schema updates applied successfully.');
    } catch (e) {
        console.error('❌ Error applying schema:', e.message);
    }
}
main();
