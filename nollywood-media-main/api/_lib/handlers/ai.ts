import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../auth.js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../rateLimit.js';
import { query } from '../db.js';

interface GenerationRequestBody {
    prompt: string;
    style: 'cinematic' | 'animated' | 'realistic' | 'documentary';
    duration: '5s' | '10s' | '15s';
    aspectRatio: '16:9' | '9:16' | '1:1';
    provider: 'gemini' | 'leonardo';
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
    cinematic: 'cinematic, dramatic lighting, film-quality, wide shots, depth of field',
    animated: 'animated, vibrant colors, stylized, cartoon-like, smooth motion',
    realistic: 'photorealistic, natural lighting, lifelike, high detail',
    documentary: 'documentary-style, steady camera, naturalistic, observational',
};

function buildPrompt(options: Omit<GenerationRequestBody, 'provider'>): string {
    return `${options.prompt}. Style: ${STYLE_DESCRIPTIONS[options.style] || ''}. African/Nollywood aesthetic.`;
}

const circuitState: Record<string, { failures: number; lastFailure: number; open: boolean }> = {
    gemini: { failures: 0, lastFailure: 0, open: false },
    leonardo: { failures: 0, lastFailure: 0, open: false },
};

async function checkServerQuota(userId: string) {
    let tier = 'free';
    try {
        const profiles = await query('SELECT subscription_status FROM user_profiles WHERE id = $1', [userId]);
        const status = profiles[0]?.subscription_status || 'free';
        if (['premium', 'pro'].includes(status)) tier = 'premium';
        else if (['basic', 'starter'].includes(status)) tier = 'basic';
    } catch { }
    const limit = { free: 1, basic: 5, premium: 999 }[tier] || 1;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    try {
        const result = await query('SELECT COUNT(*) as cnt FROM ai_generation_logs WHERE user_id = $1 AND created_at >= $2', [userId, todayStart.toISOString()]);
        const count = parseInt(result[0]?.cnt || '0');
        return { allowed: count < limit, remaining: Math.max(0, limit - count), limit };
    } catch { return { allowed: true, remaining: limit, limit }; }
}

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, { ...opts, signal: controller.signal }); }
    finally { clearTimeout(timer); }
}

export async function generate(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    try {
        const body: GenerationRequestBody = req.body;
        const { provider, ...options } = body;
        const quota = await checkServerQuota(user.userId);
        if (!quota.allowed) return res.status(429).json({ error: `Daily limit reached (${quota.limit}/day).`, remaining: quota.remaining, limit: quota.limit });

        const fullPrompt = buildPrompt(options);
        let operationId: string | undefined;

        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { aspect_ratio: options.aspectRatio, duration_seconds: parseInt(options.duration), sample_count: 1 } })
            });
            if (!response.ok) throw new Error(`Gemini error ${response.status}`);
            const data = await response.json();
            operationId = data.name || data.operationId || data.id;
        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            const response = await fetchWithTimeout('https://cloud.leonardo.ai/api/rest/v1/generations-text-to-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ prompt: fullPrompt, model: 'MOTION2', width: options.aspectRatio === '9:16' ? 576 : 1024, height: options.aspectRatio === '9:16' ? 1024 : 576, motionStrength: 5 })
            });
            if (!response.ok) throw new Error(`Leonardo error ${response.status}`);
            const data = await response.json();
            operationId = data.motionVideoGenerationJob?.generationId || data.generationId;
        }

        await query('INSERT INTO ai_generation_logs (user_id, model, prompt, result_url) VALUES ($1, $2, $3, $4)', [user.userId, provider, fullPrompt.substring(0, 500), 'pending']);
        return res.status(200).json({ operationId, provider, quotaRemaining: quota.remaining - 1 });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'AI generation failed.' });
    }
}

export async function status(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { provider, operationId } = req.query;
    if (!provider || !operationId || typeof provider !== 'string' || typeof operationId !== 'string') return res.status(400).json({ error: 'Missing provider or operationId' });
    const safeOpId = operationId.replace(/[^a-zA-Z0-9_\-\/\.]/g, '');

    try {
        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/operations/${safeOpId}?key=${key}`);
            const data = await response.json();
            if (data.done) {
                if (data.error) return res.status(200).json({ state: 'failed', error: data.error.message });
                const videoUri = data.response?.generatedVideos?.[0]?.uri || data.response?.predictions?.[0]?.videoUri;
                return res.status(200).json({ state: 'completed', progress: 100, videoUrl: videoUri });
            }
            return res.status(200).json({ state: 'processing', progress: data.metadata?.progress || 50 });
        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            const response = await fetchWithTimeout(`https://cloud.leonardo.ai/api/rest/v1/generations/${safeOpId}`, { headers: { 'Authorization': `Bearer ${key}` } });
            const data = await response.json();
            const generation = data.generations_by_pk;
            if (generation?.status === 'COMPLETE') return res.status(200).json({ state: 'completed', progress: 100, videoUrl: generation.generated_videos?.[0]?.url });
            if (generation?.status === 'FAILED') return res.status(200).json({ state: 'failed', error: 'Leonardo failed' });
            return res.status(200).json({ state: 'processing', progress: 50 });
        }
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Status check failed.' });
    }
}
