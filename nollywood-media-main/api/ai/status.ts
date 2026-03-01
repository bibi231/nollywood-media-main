import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, setCorsHeaders } from '../_lib/auth';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit';

// ═══ Timeout wrapper ═══
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit: 30 status polls per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ai-status:${clientIp}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Too many status checks. Please slow down polling.' });
    }

    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, operationId } = req.query;

        if (!provider || !operationId || typeof provider !== 'string' || typeof operationId !== 'string') {
            return res.status(400).json({ error: 'Missing provider or operationId' });
        }

        // Sanitize operationId to prevent injection
        const safeOpId = operationId.replace(/[^a-zA-Z0-9_\-\/\.]/g, '');

        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            if (!key) throw new Error('Gemini API key not configured.');

            const response = await fetchWithTimeout(
                `https://generativelanguage.googleapis.com/v1beta/operations/${safeOpId}?key=${key}`,
                {},
                15000
            );
            if (!response.ok) throw new Error(`Gemini status check failed: ${response.status}`);

            const data = await response.json();
            if (data.done) {
                if (data.error) return res.status(200).json({ state: 'failed', error: data.error.message, provider: 'gemini' });
                const videoUri = data.response?.generatedVideos?.[0]?.uri || data.response?.predictions?.[0]?.videoUri;
                return res.status(200).json({ state: 'completed', progress: 100, videoUrl: videoUri, provider: 'gemini' });
            }
            return res.status(200).json({ state: 'processing', progress: data.metadata?.progress || 50, provider: 'gemini' });

        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            if (!key) throw new Error('Leonardo API key not configured.');

            const response = await fetchWithTimeout(
                `https://cloud.leonardo.ai/api/rest/v1/generations/${safeOpId}`,
                { headers: { 'Authorization': `Bearer ${key}` } },
                15000
            );
            if (!response.ok) throw new Error(`Leonardo status check failed: ${response.status}`);

            const data = await response.json();
            const generation = data.generations_by_pk;

            if (generation?.status === 'COMPLETE') {
                const videoUrl = generation.generated_videos?.[0]?.url;
                if (!videoUrl) return res.status(200).json({ state: 'processing', progress: 95, provider: 'leonardo' });
                return res.status(200).json({ state: 'completed', progress: 100, videoUrl, provider: 'leonardo' });
            }
            if (generation?.status === 'FAILED') {
                return res.status(200).json({ state: 'failed', error: 'Leonardo generation failed', provider: 'leonardo' });
            }
            return res.status(200).json({ state: 'processing', progress: 50, provider: 'leonardo' });
        } else {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }
    } catch (err: any) {
        console.error('[AI] Status check error:', err.message);
        return res.status(500).json({ error: err.message || 'Status check failed.' });
    }
}
