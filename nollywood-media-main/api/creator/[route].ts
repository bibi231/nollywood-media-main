import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as creatorHandlers from '../_lib/handlers/creator.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'earnings':
            return creatorHandlers.earnings(req, res);
        case 'monetization-apply':
            return creatorHandlers.monetizationApply(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
