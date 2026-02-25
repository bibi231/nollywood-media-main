import type { VercelRequest, VercelResponse } from '@vercel/node';
import { corsHeaders, signToken } from '../_lib/auth';
import { query } from '../_lib/db';

/**
 * Google OAuth — verify Google ID Token and create/login user
 * POST /api/auth/google  { idToken: string }
 *
 * The frontend uses the Google Identity Services (GIS) popup to get an
 * ID token, then sends it here for server-side verification.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
            .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            .end();
    }

    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { idToken, credential } = req.body || {};
        const token = idToken || credential;

        if (!token) {
            return res.status(400).json({ error: 'Missing Google ID token' });
        }

        // Verify the Google ID token using Google's tokeninfo endpoint
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

        if (!googleRes.ok) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const googleUser = await googleRes.json();

        // Validate the token
        if (!googleUser.email || googleUser.email_verified !== 'true') {
            return res.status(401).json({ error: 'Google email not verified' });
        }

        const email = googleUser.email.toLowerCase();
        const displayName = googleUser.name || googleUser.given_name || email.split('@')[0];
        const avatarUrl = googleUser.picture || null;

        // Check if user exists
        const existing = await query(`SELECT id, email, display_name FROM users WHERE email = $1`, [email]);

        let userId: string;

        if (existing.length > 0) {
            // Existing user — update avatar if they don't have one
            userId = existing[0].id;
            if (avatarUrl) {
                await query(`UPDATE user_profiles SET avatar_url = COALESCE(NULLIF(avatar_url, ''), $1), updated_at = now() WHERE id = $2`, [avatarUrl, userId]);
            }
        } else {
            // New user — create account (no password needed for OAuth)
            const userResult = await query(
                `INSERT INTO users (email, encrypted_password, display_name) VALUES ($1, $2, $3) RETURNING id`,
                [email, '__GOOGLE_OAUTH__', displayName]
            );
            userId = userResult[0].id;

            // Create profile
            await query(
                `INSERT INTO user_profiles (id, email, display_name, avatar_url) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
                [userId, email, displayName, avatarUrl]
            );

            // Create role
            await query(
                `INSERT INTO user_roles (user_id, role) VALUES ($1, 'user') ON CONFLICT (user_id) DO NOTHING`,
                [userId]
            );
        }

        // Get role
        const roleResult = await query(`SELECT role FROM user_roles WHERE user_id = $1`, [userId]);
        const role = roleResult[0]?.role || 'user';

        // Sign JWT
        const jwt = signToken({ userId, email, role });

        return res.status(200).json({
            data: {
                user: {
                    id: userId,
                    email,
                    user_metadata: { display_name: displayName, avatar_url: avatarUrl },
                },
                session: {
                    access_token: jwt,
                    user: {
                        id: userId,
                        email,
                        user_metadata: { display_name: displayName, avatar_url: avatarUrl },
                    },
                },
            },
        });
    } catch (err: any) {
        console.error('Google auth error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
