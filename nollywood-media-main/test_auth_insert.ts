import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function simulateFrontendUploadRequest() {
    console.log("Generating Mock JWT token...");

    // We must use the exact JWT secret defined in the Vercel env
    // We can simulate an admin token to bypass all user-specific blocks
    const fakeUserId = "00000000-0000-0000-0000-000000000000";

    const mockPayload = {
        sub: fakeUserId,
        role: "authenticated",
        user_metadata: { role: "admin" },
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    };

    // Hardcoded secret for local testing based on user's env configuration
    const mockSecret = process.env.JWT_SECRET || "super-secret-jwt-token-with-at-least-32-characters-long";

    const token = jwt.sign(mockPayload, mockSecret);
    console.log("Token generated:", token);

    console.log("Simulating an HTTP POST to /api/query for an Upload Insert...");

    try {
        const uploadPayload = {
            table: "user_content_uploads",
            operation: "insert",
            data: {
                title: "Fake Test Video Title",
                description: "This is a frontend test description",
                category: "Film",
                tags: ["test", "ai"],
                video_filename: "fake_file.mov",
                video_path: `user123/1740798380844-48v9p6v.mov`,
                video_url: "https://example.r2.cloudflarestorage.com/video.mov",
                thumbnail_path: null,
                thumbnail_url: null,
                file_size: 40960,
                status: "processing",
                moderation_status: "pending",
                visibility: "private"
            }
        };

        const response = await fetch('http://localhost:3000/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(uploadPayload)
        });

        const data = await response.json();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

simulateFrontendUploadRequest();
