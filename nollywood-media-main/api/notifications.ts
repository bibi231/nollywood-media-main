import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, setCorsHeaders } from '../_lib/auth';
import { query } from '../_lib/db';
import crypto from 'crypto';

/**
 * PUSH NOTIFICATION SUBSCRIPTION API — Phase 10
 * 
 * Manages Web Push API subscriptions.
 * Endpoints:
 *   POST ?action=subscribe     — Register push subscription
 *   POST ?action=unsubscribe   — Remove push subscription
 *   GET  ?action=preferences   — Get notification preferences
 *   POST ?action=preferences   — Update notification preferences
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const action = req.query.action as string || req.body?.action;

    try {
        switch (action) {
            case 'subscribe': {
                if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
                const { subscription } = req.body;
                if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid push subscription' });

                // Hash the endpoint for deduplication
                const endpointHash = crypto.createHash('sha256').update(subscription.endpoint).digest('hex').substring(0, 32);

                await query(
                    `INSERT INTO push_subscriptions (user_id, endpoint_hash, subscription_data, created_at, last_active)
                     VALUES ($1, $2, $3, NOW(), NOW())
                     ON CONFLICT (endpoint_hash) DO UPDATE SET 
                       subscription_data = $3, last_active = NOW(), user_id = $1`,
                    [user.userId, endpointHash, JSON.stringify(subscription)]
                );

                return res.status(200).json({ data: { subscribed: true }, error: null });
            }

            case 'unsubscribe': {
                if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
                const { endpoint } = req.body;
                if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

                const endpointHash = crypto.createHash('sha256').update(endpoint).digest('hex').substring(0, 32);
                await query('DELETE FROM push_subscriptions WHERE endpoint_hash = $1', [endpointHash]);

                return res.status(200).json({ data: { subscribed: false }, error: null });
            }

            case 'preferences': {
                if (req.method === 'GET') {
                    const prefs = await query(
                        `SELECT new_content, comments, likes, system_updates, weekly_digest, marketing
                         FROM notification_preferences WHERE user_id = $1`,
                        [user.userId]
                    );

                    // Default preferences if none exist
                    const defaults = {
                        new_content: true,
                        comments: true,
                        likes: true,
                        system_updates: true,
                        weekly_digest: true,
                        marketing: false,
                    };

                    return res.status(200).json({ data: prefs[0] || defaults, error: null });
                }

                if (req.method === 'POST') {
                    const { new_content, comments, likes, system_updates, weekly_digest, marketing } = req.body;

                    await query(
                        `INSERT INTO notification_preferences (user_id, new_content, comments, likes, system_updates, weekly_digest, marketing, updated_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                         ON CONFLICT (user_id) DO UPDATE SET 
                           new_content = $2, comments = $3, likes = $4, 
                           system_updates = $5, weekly_digest = $6, marketing = $7, updated_at = NOW()`,
                        [user.userId, new_content ?? true, comments ?? true, likes ?? true, system_updates ?? true, weekly_digest ?? true, marketing ?? false]
                    );

                    return res.status(200).json({ data: { updated: true }, error: null });
                }

                return res.status(405).json({ error: 'GET or POST required' });
            }

            case 'vapid-key': {
                // Return public VAPID key for client-side subscription
                const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
                return res.status(200).json({ data: { vapidPublicKey }, error: null });
            }

            default:
                return res.status(400).json({ error: 'Invalid action. Use: subscribe, unsubscribe, preferences, vapid-key' });
        }
    } catch (err: any) {
        console.error('[Notifications] Error:', err.message);
        return res.status(500).json({ error: 'Internal error' });
    }
}
