/**
 * Server-side Rate Limiter for Vercel Serverless Functions
 * Uses in-memory sliding window — resets per cold start
 * For production at scale, replace with Redis/Upstash
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number;
    /** Window duration in seconds */
    windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { limit: 60, windowSeconds: 60 };

/**
 * Check rate limit for an IP or identifier
 * Returns { allowed, remaining, resetAt } 
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const key = identifier;
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + config.windowSeconds * 1000 };
        store.set(key, entry);
    }

    entry.count++;

    return {
        allowed: entry.count <= config.limit,
        remaining: Math.max(0, config.limit - entry.count),
        resetAt: entry.resetAt,
    };
}

/**
 * Get client IP from Vercel request
 */
export function getClientIp(req: any): string {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

// Preset configs for different endpoint types
export const RATE_LIMITS = {
    /** General API queries */
    query: { limit: 120, windowSeconds: 60 } as RateLimitConfig,
    /** Auth endpoints (login/signup) */
    auth: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
    /** File uploads */
    upload: { limit: 10, windowSeconds: 300 } as RateLimitConfig,
    /** AI generation */
    ai: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
    /** Write operations (insert/update/delete) */
    write: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
};
