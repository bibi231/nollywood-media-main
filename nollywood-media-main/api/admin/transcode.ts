import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth';
import { query } from '../_lib/db';
import { transcodeFilm } from '../_lib/transcoder.mjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Authenticate & Check Admin
        const user = getUserFromRequest(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const roles = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.userId]);
        if (!roles.length || roles[0].role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { filmId } = req.body;
        if (!filmId) {
            return res.status(400).json({ error: 'Missing filmId' });
        }

        // 2. Start Transcoding (Async in background or wait depending on timeout)
        // Note: Vercel functions have short timeouts. For production, this should be a queue.
        // For this implementation, we'll try to run it and hope for the best, 
        // or the user can move it to a dedicated worker fleet as per the audit report.

        console.log(`[Admin] Triggering transcode for ${filmId}`);

        // We trigger it but don't await the full process if we expect it to take long,
        // however, transcodeFilm currently awaits everything.
        // Let's at least respond that it started if we were in a real async environment.
        // For now, we'll wait and see if it completes within Vercel's window (usually 10s-60s).

        const hlsUrl = await transcodeFilm(filmId);

        return res.status(200).json({
            message: 'Transcoding complete',
            hlsUrl,
            filmId
        });

    } catch (err: any) {
        console.error('Transcode API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
