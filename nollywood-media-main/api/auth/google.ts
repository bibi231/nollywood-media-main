import { OAuth2Client } from 'google-auth-library';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { query } from '../_lib/db.js';
import { corsHeaders } from '../_lib/auth.js';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'naijamation-dev-secret-change-in-production';

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        return res.status(200).json({}, { headers: corsHeaders() });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' }, { headers: corsHeaders() });
    }

    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID token is required' }, { headers: corsHeaders() });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token');
        }

        const email = payload.email.toLowerCase();
        const name = payload.name || email.split('@')[0];

        // 1. Find or create user
        let user: any;
        const users = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (users.length === 0) {
            // Create user
            const newUsers = await query(
                'INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING *',
                [email, name]
            );
            user = newUsers[0];

            // Add default 'user' role
            await query(
                'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
                [user.id, 'user']
            );
        } else {
            user = users[0];
        }

        // 2. Generate JWT
        const token = sign(
            { userId: user.id, email: user.email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: { display_name: user.display_name },
                },
                session: {
                    access_token: token,
                    token_type: 'bearer',
                    expires_in: 604800,
                    user: {
                        id: user.id,
                        email: user.email,
                        user_metadata: { display_name: user.display_name },
                    }
                }
            },
            error: null
        }, { headers: corsHeaders() });

    } catch (err: any) {
        console.error('❌ Google Auth Error:', err);
        return res.status(401).json({ error: 'Invalid Google token or authentication failed' }, { headers: corsHeaders() });
    }
}
