import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db.js';
import { signToken, setCorsHeaders, getUserFromRequest, corsHeaders } from '../auth.js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../rateLimit.js';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import pkg from 'jsonwebtoken';
const { sign } = pkg;

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'naijamation-dev-secret-change-in-production';

export async function login(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limit: 10 login attempts per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth);
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const users = await query(
            'SELECT id, email, encrypted_password, display_name FROM users WHERE email = $1',
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        let valid = false;
        try {
            valid = await bcrypt.compare(password, user.encrypted_password);
        } catch {
            const pgCheck = await query(
                "SELECT (encrypted_password = crypt($1, encrypted_password)) as valid FROM users WHERE id = $2",
                [password, user.id]
            );
            valid = pgCheck[0]?.valid === true;
        }

        if (!valid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const roleResult = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
        const role = roleResult[0]?.role || 'user';

        const token = signToken({ userId: user.id, email: user.email, role });

        return res.status(200).json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: { display_name: user.display_name },
                },
                session: { access_token: token },
            },
            error: null,
        });
    } catch (err: any) {
        console.error('Login error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}

export async function signup(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password, display_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'This email is already registered. Try signing in instead.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const name = display_name || email.split('@')[0];

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

export async function me(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const jwtUser = getUserFromRequest(req);
    if (!jwtUser) {
        return res.status(200).json({ data: { session: null, user: null }, error: null });
    }

    try {
        const users = await query(
            `SELECT u.id, u.email, u.display_name, u.created_at,
              p.bio, p.avatar_url, p.subscription_status,
              r.role
       FROM users u
       LEFT JOIN user_profiles p ON p.id = u.id
       LEFT JOIN user_roles r ON r.user_id = u.id
       WHERE u.id = $1`,
            [jwtUser.userId]
        );

        if (users.length === 0) {
            return res.status(200).json({ data: { session: null, user: null }, error: null });
        }

        const user = users[0];

        return res.status(200).json({
            data: {
                session: { access_token: req.headers.authorization?.slice(7) },
                user: {
                    id: user.id,
                    email: user.email,
                    user_metadata: { display_name: user.display_name },
                    role: user.role || 'user',
                    profile: {
                        bio: user.bio,
                        avatar_url: user.avatar_url,
                        subscription_status: user.subscription_status,
                    },
                },
            },
            error: null,
        });
    } catch (err: any) {
        console.error('Auth/me error:', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function google(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID token is required' });
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

        let user: any;
        const users = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (users.length === 0) {
            const newUsers = await query(
                'INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING *',
                [email, name]
            );
            user = newUsers[0];

            await query(
                'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
                [user.id, 'user']
            );
        } else {
            user = users[0];
        }

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
        });

    } catch (err: any) {
        console.error('❌ Google Auth Error:', err);
        return res.status(401).json({ error: 'Invalid Google token or authentication failed' });
    }
}
