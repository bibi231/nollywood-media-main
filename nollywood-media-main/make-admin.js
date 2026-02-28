import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.NEON_DATABASE_URL);

async function makeAdmin() {
    try {
        // Find the test user ID
        const userRes = await sql`SELECT id FROM users WHERE email = 'testuser9@example.com' LIMIT 1`;
        if (userRes.length === 0) {
            console.log('Test user not found');
            return;
        }
        const userId = userRes[0].id;

        // Update or insert role in user_roles
        await sql`
      INSERT INTO user_roles (user_id, role) 
      VALUES (${userId}, 'admin') 
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin'
    `;

        console.log('Successfully elevated testuser9@example.com to admin.');
    } catch (error) {
        console.error('Error:', error);
    }
}

makeAdmin();
