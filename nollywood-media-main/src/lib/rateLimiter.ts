/**
 * Simple client-side rate limiter to prevent spamming actions.
 * Note: This is a frontend-only measure. Backend RLS and 
 * Supabase built-in rate limits remain the primary security.
 */

type RateLimitEntry = {
    count: number;
    lastAttempt: number;
};

const storage = new Map<string, RateLimitEntry>();

export const rateLimit = (
    key: string,
    limit: number = 5,
    windowMs: number = 60000 // 1 minute window
): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const entry = storage.get(key);

    if (!entry) {
        storage.set(key, { count: 1, lastAttempt: now });
        return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    // If window expired, reset
    if (now - entry.lastAttempt > windowMs) {
        entry.count = 1;
        entry.lastAttempt = now;
        return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
    }

    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.lastAttempt + windowMs
        };
    }

    entry.count += 1;
    return {
        allowed: true,
        remaining: limit - entry.count,
        resetTime: entry.lastAttempt + windowMs
    };
};
