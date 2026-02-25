/**
 * AI Video Generation Rate Limiter
 * Free users: 1 generation per day
 * Basic subscribers: 5 per day
 * Premium subscribers: Unlimited
 */

import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetTime: Date;
    tier: SubscriptionTier;
}

const TIER_LIMITS: Record<SubscriptionTier, number> = {
    free: 1,
    basic: 5,
    premium: Infinity,
};

/**
 * Get the user's subscription tier from their profile.
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
        const { data } = await supabase
            .from('user_profiles')
            .select('subscription_status')
            .eq('id', userId)
            .maybeSingle();

        const status = data?.subscription_status || 'free';

        if (status === 'premium' || status === 'pro') return 'premium';
        if (status === 'basic' || status === 'starter') return 'basic';
        return 'free';
    } catch {
        return 'free';
    }
}

/**
 * Check if the user is allowed to generate an AI video.
 * Uses localStorage for client-side tracking (backed by the day boundary).
 */
export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier];

    // Premium users are always allowed
    if (limit === Infinity) {
        return { allowed: true, remaining: Infinity, limit, resetTime: getNextMidnight(), tier };
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const storageKey = `ai_gen_count_${userId}_${today}`;

    const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const remaining = Math.max(0, limit - currentCount);

    return {
        allowed: currentCount < limit,
        remaining,
        limit,
        resetTime: getNextMidnight(),
        tier,
    };
}

/**
 * Record a successful generation attempt.
 */
export function recordAIGeneration(userId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `ai_gen_count_${userId}_${today}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    localStorage.setItem(storageKey, String(currentCount + 1));
}

function getNextMidnight(): Date {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight;
}
