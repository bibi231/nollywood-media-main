import fetch from 'node-fetch';

async function simulateFrontendUploadRequest() {
    console.log("Simulating an HTTP POST to /api/query for an Upload Insert...");

    try {
        // Construct the exact identical payload the frontend sends in `Upload.tsx`
        const uploadPayload = {
            table: "user_content_uploads",
            operation: "insert",
            data: {
                title: "Fake Test Video Title",
                description: "This is a frontend test description",
                category: "Film",
                tags: ["test", "ai"],
                video_filename: "fake_file.mov",
                video_path: "user123/1740798380844-48v9p6v.mov",
                video_url: "https://example.r2.cloudflarestorage.com/video.mov",
                thumbnail_path: null,
                thumbnail_url: null,
                file_size: 40960,
                status: "processing",
                moderation_status: "pending",
                visibility: "private",
            }
        };

        // We must fetch from our local dev server to trigger the Vercel function
        // (Assuming the user has standard Next/Vite dev running. We'll try hitting vercel dev via localhost:3000 or the local proxy)
        const response = await fetch('http://localhost:3000/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We're omitting the Authorization token to see if it's a structural 500 error vs auth
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
