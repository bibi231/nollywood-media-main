import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as aiHandlers from '../_lib/handlers/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'generate':
            return aiHandlers.generate(req, res);
        case 'status':
            return aiHandlers.status(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
