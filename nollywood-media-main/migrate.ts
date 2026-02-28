import { query } from './api/_lib/db.js';

async function migrate() {
    console.log("Running Phase 14 migrations...");

    try {
        await query(`
      CREATE TABLE IF NOT EXISTS watch_later (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
        film_id uuid REFERENCES films(id) ON DELETE CASCADE,
        added_at timestamp DEFAULT now(),
        UNIQUE(user_id, film_id)
      )
    `);
        console.log("✅ watch_later table created/verified");

        await query(`
      CREATE TABLE IF NOT EXISTS user_tips (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
        creator_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
        amount numeric NOT NULL,
        status text DEFAULT 'pending',
        created_at timestamp DEFAULT now()
      )
    `);
        console.log("✅ user_tips table created/verified");

        console.log("Migration complete!");
    } catch (err: any) {
        console.error("Migration error:", err);
    } finally {
        process.exit(0);
    }
}

migrate();
