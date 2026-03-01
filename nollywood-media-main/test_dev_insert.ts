import handler from './api/query.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function testDirectImport() {
    console.log("Mocking Vercel Request to api/query.ts...");

    // Create a deeply mocked Vercel Request object
    const mockReq = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            // Mock an admin payload to bypass auth for this trace test
            'authorization': 'Bearer MOCK_ADMIN_TOKEN'
        },
        body: {
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
                user_id: "00000000-0000-0000-0000-000000000000" // mocked
            }
        }
    } as unknown as VercelRequest;

    // Create a mocked Vercel Response object
    const mockRes = {
        setHeader: (key: string, value: string) => { },
        status: function (code: number) {
            console.log("Returned HTTP Status:", code);
            return this;
        },
        json: function (data: any) {
            console.log("Returned JSON Response:");
            console.log(JSON.stringify(data, null, 2));
            return this;
        },
        end: function () {
            console.log("Response Ended.");
        }
    } as unknown as VercelResponse;

    try {
        // We override the getUserFromRequest import via jest/sinon in a real test,
        // but here we just want to see the SQL error trace or if it crashes before SQL.
        // We have BOLA rules, so we need a valid userId.
        // Let's just run it!
        await handler(mockReq, mockRes);
    } catch (e) {
        console.error("Handler threw uncaught exception:", e);
    }
}

testDirectImport();
