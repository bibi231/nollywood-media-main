/**
 * CDN CACHE HEADERS — Phase 8
 * 
 * Applies intelligent cache-control headers based on content type.
 * Works with Cloudflare CDN and Vercel Edge Network.
 */

import type { VercelResponse } from '@vercel/node';

export interface CacheConfig {
    /** Cache duration for CDN (edge) in seconds */
    edge: number;
    /** Cache duration for browser in seconds */
    browser: number;
    /** Whether to allow stale content while revalidating */
    staleWhileRevalidate?: number;
    /** Whether content varies by auth state */
    varyAuth?: boolean;
}

// Preset cache policies
export const CDN_POLICIES = {
    /** Static catalog data — cache aggressively */
    catalog: { edge: 300, browser: 60, staleWhileRevalidate: 600 },
    /** User-specific data — no CDN cache */
    private: { edge: 0, browser: 0, varyAuth: true },
    /** Trending/recommendations — short cache */
    dynamic: { edge: 60, browser: 30, staleWhileRevalidate: 120 },
    /** API responses — moderate */
    api: { edge: 30, browser: 10, staleWhileRevalidate: 60 },
    /** Never cache */
    noCache: { edge: 0, browser: 0 },
};

/**
 * Apply cache-control headers to API response.
 */
export function setCacheHeaders(res: VercelResponse, config: CacheConfig): void {
    if (config.edge === 0 && config.browser === 0) {
        // No caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    } else {
        const parts: string[] = [];

        if (config.varyAuth) {
            parts.push('private');
        } else {
            parts.push('public');
        }

        parts.push(`max-age=${config.browser}`);
        parts.push(`s-maxage=${config.edge}`);

        if (config.staleWhileRevalidate) {
            parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
        }

        res.setHeader('Cache-Control', parts.join(', '));
    }

    // Vary headers for proper cache key differentiation
    const varyHeaders = ['Accept-Encoding'];
    if (config.varyAuth) varyHeaders.push('Authorization');
    res.setHeader('Vary', varyHeaders.join(', '));

    // Surrogate-Control for CDN-specific caching (Cloudflare)
    if (config.edge > 0) {
        res.setHeader('CDN-Cache-Control', `max-age=${config.edge}`);
    }
}
