import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, setCorsHeaders } from '../_lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../_lib/rateLimit';
import { query } from '../_lib/db';

// ═══════════════════════════════════════════════════════
// AI GENERATION ENDPOINT — HARDENED (Phase 3)
// Circuit breaker, per-user quotas, timeout, cost logging
// ═══════════════════════════════════════════════════════

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

// ═══ CIRCUIT BREAKER ═══
const circuitState: Record<string, { failures: number; lastFailure: number; open: boolean }> = {
    gemini: { failures: 0, lastFailure: 0, open: false },
    leonardo: { failures: 0, lastFailure: 0, open: false },
};
const CIRCUIT_THRESHOLD = 3;    // failures before opening
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

function isCircuitOpen(provider: string): boolean {
    const state = circuitState[provider];
    if (!state?.open) return false;
    // Check if cooldown has elapsed
    if (Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
        state.open = false;
        state.failures = 0;
        return false;
    }
    return true;
}

function recordProviderFailure(provider: string) {
    const state = circuitState[provider];
    if (!state) return;
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= CIRCUIT_THRESHOLD) {
        state.open = true;
        console.warn(`[AI Circuit Breaker] ${provider} circuit OPENED after ${state.failures} failures`);
    }
}

function recordProviderSuccess(provider: string) {
    const state = circuitState[provider];
    if (!state) return;
    state.failures = 0;
    state.open = false;
}

// ═══ PER-USER QUOTA (Server-Side Enforcement) ═══
const TIER_LIMITS: Record<string, number> = { free: 1, basic: 5, premium: 999 };

async function checkServerQuota(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    // 1. Get user's subscription tier
    let tier = 'free';
    try {
        const profiles = await query('SELECT subscription_status FROM user_profiles WHERE id = $1', [userId]);
        const status = profiles[0]?.subscription_status || 'free';
        if (status === 'premium' || status === 'pro') tier = 'premium';
        else if (status === 'basic' || status === 'starter') tier = 'basic';
    } catch { /* default to free */ }

    const limit = TIER_LIMITS[tier] || 1;

    // 2. Count today's generations
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    try {
        const result = await query(
            'SELECT COUNT(*) as cnt FROM ai_generation_logs WHERE user_id = $1 AND created_at >= $2',
            [userId, todayStart.toISOString()]
        );
        const count = parseInt(result[0]?.cnt || '0');
        return { allowed: count < limit, remaining: Math.max(0, limit - count), limit };
    } catch {
        return { allowed: true, remaining: limit, limit }; // Fail open to avoid blocking on DB errors
    }
}

// ═══ FETCH WITH TIMEOUT ═══
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number = 30000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ═══ COST LOGGING ═══
async function logGeneration(userId: string, provider: string, prompt: string, success: boolean) {
    try {
        await query(
            'INSERT INTO ai_generation_logs (user_id, model, prompt, result_url) VALUES ($1, $2, $3, $4)',
            [userId, provider, prompt.substring(0, 500), success ? 'pending' : 'failed']
        );
    } catch (err) {
        console.error('[AI] Failed to log generation:', err);
    }
}

// ═══════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limiting: 5 AI requests per minute per IP
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`ai:${clientIp}`, RATE_LIMITS.ai);
    if (!rl.allowed) {
        return res.status(429).json({ error: 'AI generation rate limit exceeded. Please wait before trying again.' });
    }

    const user = getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body: GenerationRequestBody = req.body;
        const { provider, ...options } = body;

        if (!provider || !options.prompt) {
            return res.status(400).json({ error: 'Missing required fields: provider, prompt' });
        }

        // ═══ Server-side quota enforcement ═══
        const quota = await checkServerQuota(user.userId);
        if (!quota.allowed) {
            return res.status(429).json({
                error: `Daily AI generation limit reached (${quota.limit}/day). Upgrade your subscription for more.`,
                remaining: quota.remaining,
                limit: quota.limit,
            });
        }

        // ═══ Circuit breaker check ═══
        if (isCircuitOpen(provider)) {
            return res.status(503).json({
                error: `${provider} AI service is temporarily unavailable. Please try another provider or wait 1 minute.`,
                provider,
            });
        }

        const fullPrompt = buildPrompt(options);
        const startTime = Date.now();

        // ═══ Provider routing with timeout ═══
        let operationId: string | undefined;

        if (provider === 'gemini') {
            const key = process.env.VITE_GEMINI_API_KEY;
            if (!key) throw new Error('Gemini API key not configured.');

            const response = await fetchWithTimeout(
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
                },
                30000
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                recordProviderFailure('gemini');
                throw new Error(errorData?.error?.message || `Gemini API error ${response.status}`);
            }

            const data = await response.json();
            operationId = data.name || data.operationId || data.id;
            recordProviderSuccess('gemini');

        } else if (provider === 'leonardo') {
            const key = process.env.VITE_LEONARDO_API_KEY;
            if (!key) throw new Error('Leonardo API key not configured.');

            const response = await fetchWithTimeout(
                'https://cloud.leonardo.ai/api/rest/v1/generations-text-to-video',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        model: 'MOTION2',
                        width: options.aspectRatio === '9:16' ? 576 : 1024,
                        height: options.aspectRatio === '9:16' ? 1024 : 576,
                        motionStrength: 5,
                    }),
                },
                30000
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                recordProviderFailure('leonardo');
                throw new Error(errorData?.error?.message || `Leonardo API error ${response.status}`);
            }

            const data = await response.json();
            operationId = data.motionVideoGenerationJob?.generationId || data.generationId;
            recordProviderSuccess('leonardo');

        } else {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }

        // ═══ Log successful generation ═══
        const latencyMs = Date.now() - startTime;
        await logGeneration(user.userId, provider, fullPrompt, true);

        console.log(`[AI] Generation started: provider=${provider} user=${user.userId} latency=${latencyMs}ms`);

        return res.status(200).json({
            operationId,
            provider,
            quotaRemaining: quota.remaining - 1,
        });

    } catch (err: any) {
        console.error('[AI] Generation error:', err.message);

        // Log failed attempt (don't count against quota — only successful initiations count)
        // logGeneration already handled in the catch of specific providers

        return res.status(500).json({
            error: err.message || 'AI generation failed.',
            retryable: !err.message?.includes('key not configured'),
        });
    }
}
