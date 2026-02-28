import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function migrate() {
    console.log("Starting Migration...");
    try {
        await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS is_members_only boolean DEFAULT false;`;
        console.log("Updated films table.");

        try {
            await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';`;
            console.log("Updated user_profiles table (added missing column).");
        } catch (e: any) {
            console.log("user_profiles subscription_status might already exist, skipping.", e.message);
        }

        console.log("Migration Complete!");
    } catch (e) {
        console.error("Migration Error:", e);
    }
}

migrate();
