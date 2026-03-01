import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, setCorsHeaders } from '../_lib/auth';
import { checkRateLimit, getClientIp } from '../_lib/rateLimit';
import { query } from '../_lib/db';

/**
 * WATCH STREAK & REFERRAL SYSTEM — Phase 10
 * 
 * Endpoints:
 *   ?action=streak        — Get/update user's watch streak
 *   ?action=check-in      — Record daily check-in (extends streak)
 *   ?action=referral-code  — Get user's referral code
 *   ?action=apply-referral — Apply a referral code
 *   ?action=referral-stats — Get referral statistics
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`growth:${clientIp}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

    const action = (req.query.action as string) || (req.body?.action as string);

    try {
        switch (action) {
            case 'streak':
                return res.status(200).json(await getWatchStreak(user.userId));
            case 'check-in':
                return res.status(200).json(await recordCheckIn(user.userId));
            case 'referral-code':
                return res.status(200).json(await getReferralCode(user.userId));
            case 'apply-referral':
                if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
                return res.status(200).json(await applyReferral(user.userId, req.body?.code));
            case 'referral-stats':
                return res.status(200).json(await getReferralStats(user.userId));
            default:
                return res.status(400).json({ error: 'Invalid action. Use: streak, check-in, referral-code, apply-referral, referral-stats' });
        }
    } catch (err: any) {
        console.error('[Growth] Error:', err.message);
        return res.status(500).json({ error: 'Internal error' });
    }
}

// ═══════════════════════════════════════════════════════
// WATCH STREAKS
// ═══════════════════════════════════════════════════════

async function getWatchStreak(userId: string) {
    // Ensure streak columns exist (graceful migration)
    try {
        const result = await query(
            `SELECT streak_days, last_streak_date, longest_streak 
             FROM user_profiles WHERE id = $1`,
            [userId]
        );

        if (!result[0]) {
            return { data: { streakDays: 0, lastDate: null, longestStreak: 0, milestones: [] }, error: null };
        }

        const { streak_days = 0, last_streak_date, longest_streak = 0 } = result[0];

        // Check if streak is still active (within last 36 hours to be forgiving)
        const lastDate = last_streak_date ? new Date(last_streak_date) : null;
        const hoursSince = lastDate ? (Date.now() - lastDate.getTime()) / (1000 * 60 * 60) : Infinity;
        const isActive = hoursSince <= 36;

        const currentStreak = isActive ? streak_days : 0;

        // Calculate milestones
        const milestones = [];
        if (currentStreak >= 3) milestones.push({ days: 3, label: '🔥 3-Day Streak', achieved: true });
        if (currentStreak >= 7) milestones.push({ days: 7, label: '⚡ Weekly Warrior', achieved: true });
        if (currentStreak >= 14) milestones.push({ days: 14, label: '💪 Fortnight Force', achieved: true });
        if (currentStreak >= 30) milestones.push({ days: 30, label: '👑 Monthly Master', achieved: true });

        // Next milestone
        const nextMilestones = [3, 7, 14, 30, 60, 100].filter(m => m > currentStreak);
        if (nextMilestones.length > 0) {
            milestones.push({ days: nextMilestones[0], label: `Next: ${nextMilestones[0]}-day streak`, achieved: false, remaining: nextMilestones[0] - currentStreak });
        }

        return {
            data: { streakDays: currentStreak, lastDate: last_streak_date, longestStreak: longest_streak, isActive, milestones },
            error: null,
        };
    } catch {
        return { data: { streakDays: 0, lastDate: null, longestStreak: 0, milestones: [] }, error: null };
    }
}

async function recordCheckIn(userId: string) {
    try {
        const existing = await query(
            'SELECT streak_days, last_streak_date, longest_streak FROM user_profiles WHERE id = $1',
            [userId]
        );

        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const current = existing[0] || { streak_days: 0, last_streak_date: null, longest_streak: 0 };

        // Already checked in today?
        if (current.last_streak_date) {
            const lastDate = new Date(current.last_streak_date).toISOString().split('T')[0];
            if (lastDate === today) {
                return { data: { message: 'Already checked in today', streakDays: current.streak_days }, error: null };
            }
        }

        // Calculate new streak
        let newStreak = 1;
        if (current.last_streak_date) {
            const lastDate = new Date(current.last_streak_date);
            const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
            if (hoursSince <= 36) {
                newStreak = (current.streak_days || 0) + 1;
            }
        }

        const longestStreak = Math.max(newStreak, current.longest_streak || 0);

        await query(
            `UPDATE user_profiles 
             SET streak_days = $1, last_streak_date = $2, longest_streak = $3 
             WHERE id = $4`,
            [newStreak, now.toISOString(), longestStreak, userId]
        );

        // Check for milestone rewards
        const rewardMilestones = [7, 30];
        let reward = null;
        if (rewardMilestones.includes(newStreak)) {
            // Grant bonus AI generations
            const bonusGenerations = newStreak >= 30 ? 5 : 3;
            reward = { type: 'ai_generations', amount: bonusGenerations, milestone: newStreak };
        }

        return {
            data: { streakDays: newStreak, longestStreak, reward, message: `Streak: ${newStreak} days!` },
            error: null,
        };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

// ═══════════════════════════════════════════════════════
// REFERRAL SYSTEM
// ═══════════════════════════════════════════════════════

async function getReferralCode(userId: string) {
    try {
        // Check if user already has a referral code
        const existing = await query(
            'SELECT referral_code FROM user_profiles WHERE id = $1',
            [userId]
        );

        if (existing[0]?.referral_code) {
            return {
                data: {
                    code: existing[0].referral_code,
                    url: `https://naijamation.vercel.app/ref/${existing[0].referral_code}`,
                },
                error: null,
            };
        }

        // Generate unique code: first 4 chars of email + 4 random chars
        const code = userId.substring(0, 4) + Math.random().toString(36).substring(2, 6);

        await query(
            'UPDATE user_profiles SET referral_code = $1 WHERE id = $2',
            [code.toUpperCase(), userId]
        );

        return {
            data: {
                code: code.toUpperCase(),
                url: `https://naijamation.vercel.app/ref/${code.toUpperCase()}`,
            },
            error: null,
        };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

async function applyReferral(userId: string, code: string) {
    if (!code || code.length < 4) {
        return { data: null, error: 'Invalid referral code' };
    }

    try {
        // Find referrer
        const referrer = await query(
            'SELECT id FROM user_profiles WHERE referral_code = $1',
            [code.toUpperCase()]
        );

        if (!referrer[0]) {
            return { data: null, error: 'Referral code not found' };
        }

        if (referrer[0].id === userId) {
            return { data: null, error: 'Cannot use your own referral code' };
        }

        // Check if already referred
        const existingRef = await query(
            'SELECT id FROM user_referrals WHERE referred_user_id = $1',
            [userId]
        );

        if (existingRef[0]) {
            return { data: null, error: 'You have already used a referral code' };
        }

        // Record referral
        await query(
            `INSERT INTO user_referrals (referrer_id, referred_user_id, referral_code, created_at) 
             VALUES ($1, $2, $3, NOW())`,
            [referrer[0].id, userId, code.toUpperCase()]
        );

        return {
            data: { message: 'Referral applied! You both get 3 bonus AI generations.', referrerId: referrer[0].id },
            error: null,
        };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}

async function getReferralStats(userId: string) {
    try {
        const stats = await query(
            `SELECT COUNT(*) as total_referrals 
             FROM user_referrals 
             WHERE referrer_id = $1`,
            [userId]
        );

        const recent = await query(
            `SELECT ur.created_at, up.display_name 
             FROM user_referrals ur 
             LEFT JOIN user_profiles up ON ur.referred_user_id = up.id 
             WHERE ur.referrer_id = $1 
             ORDER BY ur.created_at DESC LIMIT 10`,
            [userId]
        );

        return {
            data: {
                totalReferrals: parseInt(stats[0]?.total_referrals || '0'),
                bonusGenerationsEarned: parseInt(stats[0]?.total_referrals || '0') * 3,
                recentReferrals: recent,
            },
            error: null,
        };
    } catch (err: any) {
        return { data: { totalReferrals: 0, bonusGenerationsEarned: 0, recentReferrals: [] }, error: null };
    }
}
