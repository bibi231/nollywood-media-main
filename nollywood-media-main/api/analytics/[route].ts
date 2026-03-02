import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as analyticsHandlers from '../_lib/handlers/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'log':
            return analyticsHandlers.log(req, res);
        case 'recommendations':
            return analyticsHandlers.recommendations(req, res);
        case 'counts':
            return analyticsHandlers.counts(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
