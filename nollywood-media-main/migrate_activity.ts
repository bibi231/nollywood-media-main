import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function migrate() {
    console.log("Starting Activity Feed Migration...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS user_activity (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                action_type TEXT NOT NULL,
                target_id UUID,
                target_type TEXT,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `;
        console.log("Created user_activity table.");

        await sql`CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);`;
        console.log("Created user_activity indexes.");

        // Let's create a trigger to automatically populate it when a film is uploaded
        // We'll just do a basic trigger for film uploads first.
        try {
            await sql`
                CREATE OR REPLACE FUNCTION log_film_upload_activity()
                RETURNS TRIGGER AS $$
                BEGIN
                    INSERT INTO user_activity (user_id, action_type, target_id, target_type, metadata)
                    VALUES (
                        NEW.user_id,
                        'uploaded_video',
                        NEW.id,
                        'film',
                        jsonb_build_object('video_title', NEW.title)
                    );
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `;
            await sql`DROP TRIGGER IF EXISTS trg_film_upload_activity ON films;`;
            await sql`
                CREATE TRIGGER trg_film_upload_activity
                AFTER INSERT ON films
                FOR EACH ROW
                EXECUTE FUNCTION log_film_upload_activity();
            `;
            console.log("Created automatic trigger for film uploads.");
        } catch (e: any) {
            console.log("Could not create trigger, might need superuser or different setup:", e.message);
        }

        console.log("Migration Complete!");
    } catch (e) {
        console.error("Migration Error:", e);
    }
}

migrate();
