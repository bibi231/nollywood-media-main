import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as authHandlers from '../_lib/handlers/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'login':
            return authHandlers.login(req, res);
        case 'signup':
            return authHandlers.signup(req, res);
        case 'me':
            return authHandlers.me(req, res);
        case 'google':
            return authHandlers.google(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
