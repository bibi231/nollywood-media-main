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
        console.log('Adding hls_url column to films table...');
        await sql`ALTER TABLE films ADD COLUMN IF NOT EXISTS hls_url TEXT`;
        console.log('✅ Column added successfully or already exists.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}
main();
