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

// ─── API Keys ───────────────────────────────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const UNIFICALLY_API_KEY = import.meta.env.VITE_UNIFICALLY_API_KEY as string | undefined;
const LEONARDO_API_KEY = import.meta.env.VITE_LEONARDO_API_KEY as string | undefined;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const UNIFICALLY_BASE = 'https://api.unifically.com/v1';
const LEONARDO_BASE = 'https://cloud.leonardo.ai/api/rest/v1';

// ─── Provider availability ──────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'seedance' | 'leonardo';

export function getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (GEMINI_API_KEY) providers.push('gemini');
    if (UNIFICALLY_API_KEY) providers.push('seedance');
    if (LEONARDO_API_KEY) providers.push('leonardo');
    return providers;
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

// ─── Gemini Veo Provider ────────────────────────────────────────────────────

async function generateWithGemini(options: VideoGenerationOptions): Promise<GenerationResult> {
    if (!GEMINI_API_KEY) {
        return { success: false, error: 'Gemini API key not configured', provider: 'gemini' };
    }

    const prompt = buildPrompt(options);

    const response = await fetch(
        `${GEMINI_BASE}/models/veo-2.0-generate-001:predictLongRunning?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                    aspectRatio: options.aspectRatio,
                    durationSeconds: parseInt(options.duration),
                    sampleCount: 1,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    return {
        success: true,
        operationId: data.name || data.operationId,
        provider: 'gemini',
    };
}

async function checkGeminiStatus(operationId: string): Promise<GenerationStatus> {
    if (!GEMINI_API_KEY) return { state: 'failed', error: 'API key not configured', provider: 'gemini' };

    const response = await fetch(`${GEMINI_BASE}/operations/${operationId}?key=${GEMINI_API_KEY}`);
    if (!response.ok) throw new Error(`Gemini status check failed: ${response.status}`);

    const data = await response.json();

    if (data.done) {
        if (data.error) return { state: 'failed', error: data.error.message, provider: 'gemini' };
        const videoUri =
            data.response?.generatedVideos?.[0]?.uri ||
            data.response?.predictions?.[0]?.videoUri;
        return { state: 'completed', progress: 100, videoUrl: videoUri, provider: 'gemini' };
    }

    return { state: 'processing', progress: data.metadata?.progress || 50, provider: 'gemini' };
}

// ─── Seedance via Unifically Provider ───────────────────────────────────────

async function generateWithSeedance(options: VideoGenerationOptions): Promise<GenerationResult> {
    if (!UNIFICALLY_API_KEY) {
        return { success: false, error: 'Unifically API key not configured', provider: 'seedance' };
    }

    const prompt = buildPrompt(options);

    const response = await fetch(`${UNIFICALLY_BASE}/video/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNIFICALLY_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'seedance-1.0',
            prompt,
            duration: parseInt(options.duration),
            aspect_ratio: options.aspectRatio,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Unifically API error ${response.status}`);
    }

    const data = await response.json();
    return {
        success: true,
        operationId: data.id || data.task_id,
        provider: 'seedance',
    };
}

async function checkSeedanceStatus(operationId: string): Promise<GenerationStatus> {
    if (!UNIFICALLY_API_KEY) return { state: 'failed', error: 'API key not configured', provider: 'seedance' };

    const response = await fetch(`${UNIFICALLY_BASE}/video/generations/${operationId}`, {
        headers: { 'Authorization': `Bearer ${UNIFICALLY_API_KEY}` },
    });

    if (!response.ok) throw new Error(`Seedance status check failed: ${response.status}`);

    const data = await response.json();

    if (data.status === 'completed' || data.status === 'succeeded') {
        const videoUrl = data.output?.url || data.video_url || data.result?.url;
        return { state: 'completed', progress: 100, videoUrl, provider: 'seedance' };
    }

    if (data.status === 'failed') {
        return { state: 'failed', error: data.error || 'Generation failed', provider: 'seedance' };
    }

    return { state: 'processing', progress: data.progress || 50, provider: 'seedance' };
}

// ─── Leonardo AI Provider ───────────────────────────────────────────────────

async function generateWithLeonardo(options: VideoGenerationOptions): Promise<GenerationResult> {
    if (!LEONARDO_API_KEY) {
        return { success: false, error: 'Leonardo API key not configured', provider: 'leonardo' };
    }

    const prompt = buildPrompt(options);

    // Leonardo uses image-to-motion, so we first generate a keyframe image
    const response = await fetch(`${LEONARDO_BASE}/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LEONARDO_API_KEY}`,
        },
        body: JSON.stringify({
            prompt,
            modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8', // Leonardo Diffusion XL
            width: options.aspectRatio === '9:16' ? 576 : 1024,
            height: options.aspectRatio === '9:16' ? 1024 : 576,
            num_images: 1,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Leonardo API error ${response.status}`);
    }

    const data = await response.json();
    return {
        success: true,
        operationId: data.sdGenerationJob?.generationId || data.generationId,
        provider: 'leonardo',
    };
}

async function checkLeonardoStatus(operationId: string): Promise<GenerationStatus> {
    if (!LEONARDO_API_KEY) return { state: 'failed', error: 'API key not configured', provider: 'leonardo' };

    const response = await fetch(`${LEONARDO_BASE}/generations/${operationId}`, {
        headers: { 'Authorization': `Bearer ${LEONARDO_API_KEY}` },
    });

    if (!response.ok) throw new Error(`Leonardo status check failed: ${response.status}`);

    const data = await response.json();
    const generation = data.generations_by_pk;

    if (generation?.status === 'COMPLETE') {
        const imageUrl = generation.generated_images?.[0]?.url;
        return { state: 'completed', progress: 100, videoUrl: imageUrl, provider: 'leonardo' };
    }

    if (generation?.status === 'FAILED') {
        return { state: 'failed', error: 'Leonardo generation failed', provider: 'leonardo' };
    }

    return { state: 'processing', progress: 50, provider: 'leonardo' };
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
