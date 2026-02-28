import pg from 'pg';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
const dbUrlLine = envContent.split('\n').find(l => l.startsWith('NEON_DATABASE_URL='));
const DATABASE_URL = dbUrlLine ? dbUrlLine.split(/=(.+)/)[1].trim() : null;

if (!DATABASE_URL) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}

const client = new pg.Client({
    connectionString: DATABASE_URL,
});

async function run() {
    await client.connect();

    const userRes = await client.query('SELECT user_id FROM user_profiles LIMIT 1');
    if (userRes.rows.length === 0) {
        console.log("No users found");
        process.exit(1);
    }

    const userId = userRes.rows[0].user_id;

    await client.query(`
    INSERT INTO user_content_uploads (
      user_id, title, description, category, tags, video_url, source, status, moderation_status, visibility
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
  `, [
        userId,
        'Cinematic Lagos Skyline (Veo Generated)',
        'A cinematic establishing shot of a futuristic Lagos skyline at night, glowing neon lights, flying vehicles, 4k resolution. (Generated via Gemini Veo)',
        'Animation',
        ['ai-generated', 'cinematic', 'lagos', 'veo'],
        'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'ai',
        'ready',
        'approved',
        'public'
    ]);

    console.log("Successfully inserted Veo mock video for user", userId);
    await client.end();
}

run().catch(console.error);
