import * as dotenv from 'dotenv';
import { query } from './api/_lib/db.js';

dotenv.config({ path: '.env.local' });

async function getUsers() {
    try {
        const users = await query('SELECT id, display_name, email, role FROM user_profiles LIMIT 10;');
        console.log("Here are the test accounts currently in your Neon database:\n", JSON.stringify(users, null, 2));

        console.log("\nNote: We recently migrated from Supabase to Neon/Cloudflare.");
        console.log("If passwords aren't visible here, they are hashed via your custom auth endpoints.");
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        process.exit(0);
    }
}

getUsers();
