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
        const data = await sql`SELECT id, title FROM films`;
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
main();
