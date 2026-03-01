/**
 * SERVER-SIDE CACHE — Phase 8
 * 
 * In-memory LRU cache for serverless functions.
 * Persists across warm invocations, resets on cold start.
 * 
 * For production at 100K+ MAU, replace with Upstash Redis:
 *   import { Redis } from '@upstash/redis'
 *   const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN })
 */

interface CacheEntry<T> {
    data: T;
    expires: number;
    hits: number;
}

const MAX_CACHE_SIZE = 500; // Max entries to prevent memory leaks
const store = new Map<string, CacheEntry<any>>();

// Evict oldest entries when cache is full
function evict() {
    if (store.size <= MAX_CACHE_SIZE) return;
    // Delete least recently used (lowest hits)
    const entries = Array.from(store.entries())
        .sort((a, b) => a[1].hits - b[1].hits);
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toDelete.forEach(([key]) => store.delete(key));
}

/**
 * Get a cached value. Returns null if expired or missing.
 */
export function cacheGet<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
        store.delete(key);
        return null;
    }
    entry.hits++;
    return entry.data;
}

/**
 * Set a cached value with TTL in seconds.
 */
export function cacheSet<T>(key: string, data: T, ttlSeconds: number = 60): void {
    evict();
    store.set(key, {
        data,
        expires: Date.now() + ttlSeconds * 1000,
        hits: 0,
    });
}

/**
 * Delete a specific cache entry or pattern.
 */
export function cacheDelete(keyOrPrefix: string, isPrefix: boolean = false): void {
    if (isPrefix) {
        for (const key of store.keys()) {
            if (key.startsWith(keyOrPrefix)) store.delete(key);
        }
    } else {
        store.delete(keyOrPrefix);
    }
}

/**
 * Get cache stats for monitoring.
 */
export function cacheStats() {
    let expired = 0;
    const now = Date.now();
    for (const entry of store.values()) {
        if (now > entry.expires) expired++;
    }
    return {
        size: store.size,
        maxSize: MAX_CACHE_SIZE,
        expired,
        utilization: Math.round((store.size / MAX_CACHE_SIZE) * 100),
    };
}

/**
 * Cache-through helper: returns cached data or fetches and caches.
 */
export async function cacheThrough<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    const cached = cacheGet<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    cacheSet(key, data, ttlSeconds);
    return data;
}

// Preset TTLs for different data types
export const CACHE_TTL = {
    /** Film catalog — changes rarely */
    catalog: 300,    // 5 minutes
    /** Trending/recommendations — moderate freshness */
    recommendations: 60,  // 1 minute
    /** User profiles — semi-static */
    profile: 120,    // 2 minutes
    /** Analytics — expensive queries */
    analytics: 600,  // 10 minutes
    /** Config/settings — almost never changes */
    config: 1800,    // 30 minutes
};
