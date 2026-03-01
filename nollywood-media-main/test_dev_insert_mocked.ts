import handler from './api/query.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Manually inject the DB URL for our direct function test
process.env.NEON_DATABASE_URL = "postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function testDirectImport() {
    console.log("Mocking Vercel Request to api/query.ts WITH env injected...");

    // Create a deeply mocked Vercel Request object
    const mockReq = {
        method: 'POST',
        headers: {
            // No auth token, we just want to see if the table insert breaks at PostgreSQL or parsing
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
                visibility: "private"
                // Deliberately omitting user_id as the frontend would do if BOLA applies it, 
                // OR we can include one. Let's include the fake user to see SQL errors.
            }
        }
    } as unknown as VercelRequest;


    // We will bypass the `getUserFromRequest` check by literally hijacking the object in Node before running
    // The BOLA rules check `user?.role === 'admin'`. We will mock the auth library in-memory!
    const authMod = await import('./api/_lib/auth.js');
    (authMod as any).getUserFromRequest = () => ({
        userId: "00000000-0000-0000-0000-000000000000",
        role: "user"
    });

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
        end: function () { console.log("Done."); }
    } as unknown as VercelResponse;

    try {
        await handler(mockReq, mockRes);
    } catch (e) {
        console.error("Uncaught exception:", e);
    }
}

testDirectImport();
