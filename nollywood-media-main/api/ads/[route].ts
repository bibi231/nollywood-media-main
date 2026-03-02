import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as adsHandlers from '../_lib/handlers/ads.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'serve':
            return adsHandlers.serve(req, res);
        case 'log':
            return adsHandlers.log(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
