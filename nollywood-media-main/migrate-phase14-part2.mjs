import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const dbUrlLine = envContent.split('\n').find(l => l.startsWith('NEON_DATABASE_URL='));
let DATABASE_URL = dbUrlLine ? dbUrlLine.split(/=(.+)/)[1].trim() : null;

if (!DATABASE_URL) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

if (DATABASE_URL.includes('?sslmode=require')) {
    DATABASE_URL = DATABASE_URL.replace('?sslmode=require', '');
}

const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: true
});

async function run() {
    await client.connect();
    console.log('Connected to database for part 2 migrations');

    try {
        console.log('Adding notification_level to user_follows...');
        await client.query(`
      ALTER TABLE public.user_follows 
      ADD COLUMN IF NOT EXISTS notification_level text DEFAULT 'personalized';
    `);

        console.log('Creating notifications table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        link TEXT,
        read boolean DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        console.log('Creating watch_later table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.watch_later (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        film_id UUID REFERENCES public.films(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, film_id)
      );
    `);

        console.log('Successfully completed Phase 14 Part 2 schema migrations.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
