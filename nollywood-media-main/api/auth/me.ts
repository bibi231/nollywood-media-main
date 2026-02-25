import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { getUserFromRequest, corsHeaders } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
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
