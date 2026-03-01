/**
 * WAF-LIKE REQUEST FILTERING — Phase 11
 * 
 * Application-layer firewall that blocks:
 * - SQL injection patterns
 * - XSS payloads
 * - Path traversal attempts
 * - Known bad user agents (scrapers, exploit tools)
 * - Oversized payloads
 * 
 * This runs BEFORE any business logic.
 * For production at scale, use Cloudflare WAF in front.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WafResult {
    blocked: boolean;
    reason?: string;
    rule?: string;
}

// ═══ DETECTION PATTERNS ═══
const SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database|where)\b)/i,
    /(--|#|;)\s*(drop|delete|update|alter|select)/i,
    /'\s*(or|and)\s*'?\s*(1|true)\s*=\s*'?\s*(1|true)/i,
    /'\s*(or|and)\s*''=/i,
    /\bWAITFOR\s+DELAY\b/i,
    /\bBENCHMARK\s*\(/i,
    /\bSLEEP\s*\(/i,
];

const XSS_PATTERNS = [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on(error|load|click|mouseover|focus|blur)\s*=/i,
    /eval\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /document\.(cookie|write|location)/i,
    /window\.(location|open)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /%252e%252e/i,
    /etc\/passwd/i,
    /proc\/self/i,
    /windows\/system32/i,
];

const BAD_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /zgrab/i,
    /dirbuster/i,
    /gobuster/i,
    /nuclei/i,
    /hydra/i,
    /havij/i,
];

/**
 * Inspect a request for malicious patterns.
 */
export function inspectRequest(req: VercelRequest): WafResult {
    // 1. Check User-Agent
    const ua = req.headers['user-agent'] || '';
    for (const pattern of BAD_USER_AGENTS) {
        if (pattern.test(ua)) {
            return { blocked: true, reason: 'Blocked user agent', rule: 'bad-ua' };
        }
    }

    // 2. Check URL/query params
    const fullUrl = req.url || '';
    const queryString = Object.values(req.query || {}).join(' ');
    const checkString = `${fullUrl} ${queryString}`;

    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(checkString)) {
            return { blocked: true, reason: 'Path traversal detected', rule: 'path-traversal' };
        }
    }

    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(checkString)) {
            return { blocked: true, reason: 'SQL injection pattern detected', rule: 'sqli' };
        }
    }

    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(checkString)) {
            return { blocked: true, reason: 'XSS pattern detected', rule: 'xss' };
        }
    }

    // 3. Check request body (POST/PUT)
    if (req.body && typeof req.body === 'object') {
        const bodyStr = JSON.stringify(req.body);

        // Payload size check (1MB max for API requests)
        if (bodyStr.length > 1_000_000) {
            return { blocked: true, reason: 'Payload too large', rule: 'size' };
        }

        for (const pattern of SQL_INJECTION_PATTERNS) {
            if (pattern.test(bodyStr)) {
                return { blocked: true, reason: 'SQL injection in body', rule: 'sqli-body' };
            }
        }

        for (const pattern of XSS_PATTERNS) {
            if (pattern.test(bodyStr)) {
                return { blocked: true, reason: 'XSS in body', rule: 'xss-body' };
            }
        }
    }

    return { blocked: false };
}

/**
 * WAF middleware — call at the top of any handler.
 * Returns true if request was blocked (handler should return early).
 */
export function wafGuard(req: VercelRequest, res: VercelResponse): boolean {
    const result = inspectRequest(req);
    if (result.blocked) {
        console.warn(`[WAF] Blocked: ${result.rule} — ${result.reason} — IP: ${req.headers['x-forwarded-for'] || 'unknown'}`);
        res.status(403).json({ error: 'Request blocked by security policy' });
        return true;
    }
    return false;
}

/**
 * Set security headers on every response.
 * Call this in every handler alongside setCorsHeaders.
 */
export function setSecurityHeaders(res: VercelResponse): void {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://imasdk.googleapis.com https://pagead2.googlesyndication.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "media-src 'self' blob: https:",
        "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://api.unifically.com https://cloud.leonardo.ai wss://*.supabase.co",
        "frame-src https://imasdk.googleapis.com https://pagead2.googlesyndication.com",
    ].join('; '));

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}
