const pg = require('pg');
const fs = require('fs');

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
    console.log('Connected to database');

    try {
        // 14.1 Add achievements array to user_profiles
        console.log('Adding achievements to user_profiles...');
        await client.query(`
      ALTER TABLE public.user_profiles 
      ADD COLUMN IF NOT EXISTS achievements text[] DEFAULT '{}'::text[];
    `);

        // 14.1 Create user_activity table
        console.log('Creating user_activity table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        target_id UUID,
        target_type TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        // Index for fast feed queries
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON public.user_activity(user_id, created_at DESC);
    `);

        // 14.2 Add is_staff_pick to films
        console.log('Adding is_staff_pick to films...');
        await client.query(`
      ALTER TABLE public.films 
      ADD COLUMN IF NOT EXISTS is_staff_pick boolean DEFAULT false;
    `);

        // 14.3 Add is_verified to user_profiles
        console.log('Adding is_verified to user_profiles...');
        await client.query(`
      ALTER TABLE public.user_profiles 
      ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
    `);

        // 14.3 Add is_members_only to films
        console.log('Adding is_members_only to films...');
        await client.query(`
      ALTER TABLE public.films 
      ADD COLUMN IF NOT EXISTS is_members_only boolean DEFAULT false;
    `);

        console.log('Successfully completed Phase 14 schema migrations.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
