/**
 * Multi-Provider AI Video Generation Service
 * Supports: Gemini Veo (primary), Seedance via Unifically (fallback 1), Leonardo AI (fallback 2)
 * Automatically falls through to the next provider on failure.
 */

export interface VideoGenerationOptions {
    prompt: string;
    duration: '5s' | '10s' | '15s';
    aspectRatio: '16:9' | '9:16' | '1:1';
    style: 'cinematic' | 'animated' | 'realistic' | 'documentary';
}

export interface GenerationResult {
    success: boolean;
    videoUrl?: string;
    error?: string;
    operationId?: string;
    provider?: string;
}

export interface GenerationStatus {
    state: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    videoUrl?: string;
    error?: string;
    provider?: string;
}

// ─── Backend API Routes ────────────────────────────────────────────────────────
const GENERATE_API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/ai/generate` : '/api/ai/generate';
const STATUS_API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/ai/status` : '/api/ai/status';

import { supabase } from './supabase';

// ─── Provider availability ──────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'seedance' | 'leonardo';

export function getAvailableProviders(): AIProvider[] {
    // We assume all providers are available on the backend; the backend will throw an explicit error if its keys are missing.
    return ['gemini', 'seedance', 'leonardo'];
}

export function isAIGenerationAvailable(): boolean {
    return getAvailableProviders().length > 0;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

const STYLE_DESCRIPTIONS: Record<string, string> = {
    cinematic: 'cinematic, dramatic lighting, film-quality, wide shots, depth of field',
    animated: 'animated, vibrant colors, stylized, cartoon-like, smooth motion',
    realistic: 'photorealistic, natural lighting, lifelike, high detail',
    documentary: 'documentary-style, steady camera, naturalistic, observational',
};

function buildPrompt(options: VideoGenerationOptions): string {
    return `${options.prompt}. Style: ${STYLE_DESCRIPTIONS[options.style]}. African/Nollywood aesthetic.`;
}

// ─── API Proxies ────────────────────────────────────────────────────────────

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Authentication required');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
}

// ─── Gemini Veo Provider ────────────────────────────────────────────────────

async function generateWithGemini(options: VideoGenerationOptions): Promise<GenerationResult> {
    const headers = await getAuthHeaders();
    const response = await fetch(GENERATE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...options, provider: 'gemini' }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    return { success: true, operationId: data.operationId, provider: 'gemini' };
}

async function checkGeminiStatus(operationId: string): Promise<GenerationStatus> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${STATUS_API_URL}?provider=gemini&operationId=${operationId}`, { headers });
    if (!response.ok) throw new Error(`Gemini status check failed: ${response.status}`);
    return await response.json();
}

// ─── Seedance via Unifically Provider ───────────────────────────────────────

async function generateWithSeedance(options: VideoGenerationOptions): Promise<GenerationResult> {
    const headers = await getAuthHeaders();
    const response = await fetch(GENERATE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...options, provider: 'seedance' }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Seedance API error ${response.status}`);
    }

    const data = await response.json();
    return { success: true, operationId: data.operationId, provider: 'seedance' };
}

async function checkSeedanceStatus(operationId: string): Promise<GenerationStatus> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${STATUS_API_URL}?provider=seedance&operationId=${operationId}`, { headers });
    if (!response.ok) throw new Error(`Seedance status check failed: ${response.status}`);
    return await response.json();
}

// ─── Leonardo AI Provider ───────────────────────────────────────────────────

async function generateWithLeonardo(options: VideoGenerationOptions): Promise<GenerationResult> {
    const headers = await getAuthHeaders();
    const response = await fetch(GENERATE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...options, provider: 'leonardo' }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `Leonardo API error ${response.status}`);
    }

    const data = await response.json();
    return { success: true, operationId: data.operationId, provider: 'leonardo' };
}

async function checkLeonardoStatus(operationId: string): Promise<GenerationStatus> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${STATUS_API_URL}?provider=leonardo&operationId=${operationId}`, { headers });
    if (!response.ok) throw new Error(`Leonardo status check failed: ${response.status}`);
    return await response.json();
}

// ─── Public API (round-robin with fallback) ─────────────────────────────────

const PROVIDER_GENERATORS: Record<AIProvider, (opts: VideoGenerationOptions) => Promise<GenerationResult>> = {
    gemini: generateWithGemini,
    seedance: generateWithSeedance,
    leonardo: generateWithLeonardo,
};

const PROVIDER_STATUS_CHECKERS: Record<AIProvider, (id: string) => Promise<GenerationStatus>> = {
    gemini: checkGeminiStatus,
    seedance: checkSeedanceStatus,
    leonardo: checkLeonardoStatus,
};

// Round-robin counter — persisted in localStorage so it survives page reloads
function getAndAdvanceRoundRobin(providerCount: number): number {
    const key = 'ai_provider_round_robin';
    const current = parseInt(localStorage.getItem(key) || '0', 10) % providerCount;
    localStorage.setItem(key, String(current + 1));
    return current;
}

/**
 * Start a video generation request.
 * Uses ROUND-ROBIN rotation to spread API credits across all providers.
 * Each call starts with the next provider in the chain; if it fails, it falls through.
 */
export async function generateVideo(
    options: VideoGenerationOptions,
    preferredProvider?: AIProvider
): Promise<GenerationResult> {
    const providers = getAvailableProviders();

    if (providers.length === 0) {
        return {
            success: false,
            error: 'No AI API keys configured. Add VITE_GEMINI_API_KEY, VITE_UNIFICALLY_API_KEY, or VITE_LEONARDO_API_KEY to .env.local',
        };
    }

    let ordered: AIProvider[];

    if (preferredProvider && providers.includes(preferredProvider)) {
        // Explicit preference overrides round-robin
        ordered = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
    } else {
        // Round-robin: rotate the starting provider each call
        const startIndex = getAndAdvanceRoundRobin(providers.length);
        ordered = [...providers.slice(startIndex), ...providers.slice(0, startIndex)];
    }

    console.log(`🔄 Provider order this call: ${ordered.join(' → ')}`);
    const errors: string[] = [];

    for (const provider of ordered) {
        try {
            console.log(`🎬 Trying ${provider} for video generation...`);
            const result = await PROVIDER_GENERATORS[provider](options);
            if (result.success) {
                console.log(`✅ ${provider} accepted the request`);
                return result;
            }
            errors.push(`${provider}: ${result.error}`);
        } catch (err: any) {
            console.warn(`⚠️ ${provider} failed:`, err.message);
            errors.push(`${provider}: ${err.message}`);
        }
    }

    return {
        success: false,
        error: `All providers failed:\n${errors.join('\n')}`,
    };
}

/**
 * Check the status of a generation operation.
 * You must pass the provider that was used to start the generation.
 */
export async function checkGenerationStatus(
    operationId: string,
    provider: AIProvider = 'gemini'
): Promise<GenerationStatus> {
    try {
        return await PROVIDER_STATUS_CHECKERS[provider](operationId);
    } catch (err: any) {
        return { state: 'failed', error: err.message, provider };
    }
}
