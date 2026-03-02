import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_lib/auth.js';
import * as paystackHandlers from '../_lib/handlers/paystack.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { route } = req.query;

    switch (route) {
        case 'initialize':
            return paystackHandlers.initialize(req, res);
        case 'verify':
            return paystackHandlers.verify(req, res);
        default:
            return res.status(404).json({ error: 'Endpoint not found' });
    }
}
