import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, corsHeaders } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Handling CORS
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. Auth Check
    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Supabase JWT.' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, operationId } = req.query;

        if (!provider || !operationId || typeof provider !== 'string' || typeof operationId !== 'string') {
            return res.status(400).json({ error: 'Missing provider or operationId' });
        }

        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            if (!key) throw new Error('Gemini API key not configured on server.');

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/operations/${operationId}?key=${key}`);
            if (!response.ok) throw new Error(`Gemini status check failed: ${response.status}`);

            const data = await response.json();
            if (data.done) {
                if (data.error) return res.status(200).json({ state: 'failed', error: data.error.message, provider: 'gemini' });
                const videoUri = data.response?.generatedVideos?.[0]?.uri || data.response?.predictions?.[0]?.videoUri;
                return res.status(200).json({ state: 'completed', progress: 100, videoUrl: videoUri, provider: 'gemini' });
            }
            return res.status(200).json({ state: 'processing', progress: data.metadata?.progress || 50, provider: 'gemini' });

        } else if (provider === 'seedance') {
            const key = process.env.VITE_UNIFICALLY_API_KEY;
            if (!key) throw new Error('Unifically/Seedance API key not configured on server.');

            const response = await fetch(`https://api.unifically.com/v1/video/generations/${operationId}`, {
                headers: { 'Authorization': `Bearer ${key}` },
            });
            if (!response.ok) throw new Error(`Seedance status check failed: ${response.status}`);

            const data = await response.json();
            if (data.status === 'completed' || data.status === 'succeeded') {
                const videoUrl = data.output?.url || data.video_url || data.result?.url;
                return res.status(200).json({ state: 'completed', progress: 100, videoUrl, provider: 'seedance' });
            }
            if (data.status === 'failed') {
                return res.status(200).json({ state: 'failed', error: data.error || 'Generation failed', provider: 'seedance' });
            }
            return res.status(200).json({ state: 'processing', progress: data.progress || 50, provider: 'seedance' });

        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            if (!key) throw new Error('Leonardo API key not configured on server.');

            const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${operationId}`, {
                headers: { 'Authorization': `Bearer ${key}` },
            });
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
            return res.status(400).json({ error: `Unknown provider specified: ${provider}` });
        }
    } catch (err: any) {
        console.error('Server side status check error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error during status check.' });
    }
}
