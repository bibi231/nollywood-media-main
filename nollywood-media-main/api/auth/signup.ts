import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { signToken, corsHeaders } from '../_lib/auth.js';
import * as bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password, display_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'This email is already registered. Try signing in instead.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        const name = display_name || email.split('@')[0];

        // Create user
        const result = await query(
            `INSERT INTO users (email, encrypted_password, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
            [email.trim().toLowerCase(), hashedPassword, name]
        );

        const user = result[0];

        // Ensure user_profiles row
        const hasProfile = await query(`SELECT id FROM user_profiles WHERE id = $1`, [user.id]);
        if (hasProfile.length === 0) {
            await query(
                `INSERT INTO user_profiles (id, email, display_name) VALUES ($1, $2, $3)`,
                [user.id, user.email, name]
            );
        }

        // Auto-create creator profile
        const hasCreatorProfile = await query(`SELECT user_id FROM creator_profiles WHERE user_id = $1`, [user.id]);
        if (hasCreatorProfile.length === 0) {
            await query(
                `INSERT INTO creator_profiles (id, user_id, channel_name) VALUES ($1, $1, $2)`,
                [user.id, display_name || email.split('@')[0]]
            );
        }

        // Create role
        const hasRole = await query(`SELECT user_id FROM user_roles WHERE user_id = $1`, [user.id]);
        if (hasRole.length === 0) {
            await query(
                `INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')`,
                [user.id]
            );
        }

        // Generate JWT
        const roleResult = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
        const role = roleResult[0]?.role || 'user';

        const token = signToken({ userId: user.id, email: user.email, role });

        return res.status(200).json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: { display_name: name },
                },
                session: { access_token: token },
            },
            error: null,
        });
    } catch (err: any) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
