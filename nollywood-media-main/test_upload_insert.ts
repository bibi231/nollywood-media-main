import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function testUploadInsert() {
    console.log("Starting Simulated Upload Insert...");
    try {
        // Fetch a valid user ID to use for the test
        const users = await sql`SELECT id FROM user_profiles LIMIT 1`;
        if (users.length === 0) {
            console.log("No users found to test with.");
            return;
        }

        const testUserId = users[0].id;
        console.log(`Using user ID: ${testUserId}`);

        const result = await sql`
            INSERT INTO user_content_uploads (
                user_id,
                title,
                description,
                category,
                tags,
                video_filename,
                video_path,
                video_url,
                file_size,
                status,
                moderation_status,
                visibility
            ) VALUES (
                ${testUserId},
                'Test Upload',
                'Test Description',
                'Film',
                ARRAY['test', 'video'],
                'test_video.mp4',
                'test_path/test_video.mp4',
                'https://example.com/test_video.mp4',
                1024,
                'processing',
                'pending',
                'private'
            ) RETURNING *;
        `;

        console.log("Insert Successful:", result);

        // Clean up
        await sql`DELETE FROM user_content_uploads WHERE id = ${result[0].id};`;
        console.log("Cleanup Successful.");

    } catch (e: any) {
        console.error("Insert Failed with exactly this error:");
        console.error(e);
        console.error(e.message);
    }
}

testUploadInsert();
