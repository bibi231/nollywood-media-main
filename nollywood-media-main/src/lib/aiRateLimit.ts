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
 * Uses database ai_generation_logs for tamper-proof counting.
 */
export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
    const tier = await getUserTier(userId);
    const limit = TIER_LIMITS[tier];

    // Premium users are always allowed
    if (limit === Infinity) {
        return { allowed: true, remaining: Infinity, limit, resetTime: getNextMidnight(), tier };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Query logs for the current day
    const { count, error } = await supabase
        .from('ai_generation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString());

    if (error) {
        console.error('Error checking AI rate limit:', error);
        // Fallback to allowing if DB check fails, but log it
        return { allowed: true, remaining: 1, limit, resetTime: getNextMidnight(), tier };
    }

    const currentCount = count || 0;
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
 * Record a successful generation attempt in the database.
 */
export async function recordAIGeneration(userId: string, opts?: { prompt?: string; model?: string; resultUrl?: string }): Promise<void> {
    await supabase.from('ai_generation_logs').insert({
        user_id: userId,
        prompt: opts?.prompt,
        model: opts?.model,
        result_url: opts?.resultUrl
    });
}

function getNextMidnight(): Date {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight;
}
