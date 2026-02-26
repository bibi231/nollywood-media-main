import { neon } from '@neondatabase/serverless';
import fs from 'fs';

let DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!DATABASE_URL && fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/NEON_DATABASE_URL=([^\s]+)/);
    if (match) DATABASE_URL = match[1];
}

const sql = neon(DATABASE_URL);

async function main() {
    try {
        const filmId = 'a2adaee1-e523-45f2-93d3-4842368e02d0';
        const hlsUrl = 'https://cc99aec08b4a7e7d896a63a83ee0f206.r2.cloudflarestorage.com/naijamation-media/hls/a2adaee1-e523-45f2-93d3-4842368e02d0/master.m3u8';

        console.log(`Updating ${filmId} with ${hlsUrl}...`);
        const result = await sql`UPDATE films SET hls_url = ${hlsUrl} WHERE id = ${filmId} RETURNING id, title, hls_url`;
        console.log('Update Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}
main();
