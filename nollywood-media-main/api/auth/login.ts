import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db.js';
import { signToken, setCorsHeaders } from '../_lib/auth.js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../_lib/rateLimit.js';
import * as bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
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

        // Verify password — support both bcryptjs and pgcrypto hashes
        let valid = false;
        try {
            valid = await bcrypt.compare(password, user.encrypted_password);
        } catch {
            // pgcrypto hash — do server-side comparison
            const pgCheck = await query(
                "SELECT (encrypted_password = crypt($1, encrypted_password)) as valid FROM users WHERE id = $2",
                [password, user.id]
            );
            valid = pgCheck[0]?.valid === true;
        }

        if (!valid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Get role
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
