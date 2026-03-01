import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, corsHeaders } from '../_lib/auth.js';

// Define the shape of the request payload based on the frontend's expectations
interface GenerationRequestBody {
    prompt: string;
    style: 'cinematic' | 'animated' | 'realistic' | 'documentary';
    duration: '5s' | '10s' | '15s';
    aspectRatio: '16:9' | '9:16' | '1:1';
    provider: 'gemini' | 'seedance' | 'leonardo';
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
    cinematic: 'cinematic, dramatic lighting, film-quality, wide shots, depth of field',
    animated: 'animated, vibrant colors, stylized, cartoon-like, smooth motion',
    realistic: 'photorealistic, natural lighting, lifelike, high detail',
    documentary: 'documentary-style, steady camera, naturalistic, observational',
};

function buildPrompt(options: Omit<GenerationRequestBody, 'provider'>): string {
    return `${options.prompt}. Style: ${STYLE_DESCRIPTIONS[options.style]}. African/Nollywood aesthetic.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Handling CORS for Vercel Serverless environment
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. Authentication Block
    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Supabase JWT.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body: GenerationRequestBody = req.body;
        const { provider, ...options } = body;
        const fullPrompt = buildPrompt(options);

        // 3. Provider Switching Logic — API Keys are safely evaluated ONLY on the backend
        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            if (!key) throw new Error('Gemini API key not configured on server.');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: fullPrompt }],
                        parameters: {
                            aspect_ratio: options.aspectRatio,
                            duration_seconds: parseInt(options.duration),
                            sample_count: 1,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error?.message || `Gemini API error ${response.status}`);
            }

            const data = await response.json();
            return res.status(200).json({ operationId: data.name || data.operationId || data.id, provider: 'gemini' });

        } else if (provider === 'seedance') {
            const key = process.env.VITE_UNIFICALLY_API_KEY;
            if (!key) throw new Error('Unifically/Seedance API key not configured on server.');

            const response = await fetch(`https://api.unifically.com/v1/video/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({
                    model: 'seedance-1.0',
                    prompt: fullPrompt,
                    duration: parseInt(options.duration),
                    aspect_ratio: options.aspectRatio,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error?.message || `Unifically API error ${response.status}`);
            }

            const data = await response.json();
            return res.status(200).json({ operationId: data.id || data.task_id, provider: 'seedance' });

        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            if (!key) throw new Error('Leonardo API key not configured on server.');

            const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations-text-to-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    model: 'MOTION2',
                    width: options.aspectRatio === '9:16' ? 576 : 1024,
                    height: options.aspectRatio === '9:16' ? 1024 : 576,
                    motionStrength: 5,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData?.error?.message || `Leonardo API error ${response.status}`);
            }

            const data = await response.json();
            return res.status(200).json({ operationId: data.motionVideoGenerationJob?.generationId || data.generationId, provider: 'leonardo' });

        } else {
            return res.status(400).json({ error: `Unknown provider specified: ${provider}` });
        }

    } catch (err: any) {
        console.error('Server side generation error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error during video generation.' });
    }
}
