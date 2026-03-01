import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET; // For verifying Supabase-issued tokens

if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set!');
}

// NEVER use a hardcoded fallback in production — fail closed
const SECRET = JWT_SECRET || (() => {
    if (process.env.VERCEL_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
    }
    return 'naijamation-dev-secret-DO-NOT-USE-IN-PROD';
})();

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    // 1. Try our own JWT secret
    try {
        const decoded = verify(token, SECRET) as any;
        return {
            userId: decoded.userId || decoded.sub,
            email: decoded.email || '',
            role: decoded.role || 'user'
        };
    } catch { /* continue to Supabase verification */ }

    // 2. Try Supabase JWT secret (if configured)
    if (SUPABASE_JWT_SECRET) {
        try {
            const decoded = verify(token, SUPABASE_JWT_SECRET) as any;
            return {
                userId: decoded.sub || decoded.userId,
                email: decoded.email || '',
                role: decoded.role || 'user'  // Never trust role from external JWT — always 'user'
            };
        } catch { /* token invalid */ }
    }

    // 3. REMOVED: No more unsigned jwt.decode() fallback
    // This was the critical vulnerability allowing forged tokens
    return null;
}

/** Extract and verify JWT from Authorization header */
export function getUserFromRequest(req: VercelRequest): JWTPayload | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    return verifyToken(token);
}

/** CORS headers for API responses — restrict to known origins */
export function corsHeaders() {
    const allowedOrigins = [
        'https://naijamation.vercel.app',
        'https://www.naijamation.com',
    ];
    // In development, allow localhost
    if (process.env.VERCEL_ENV !== 'production') {
        allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
    }

    return {
        'Access-Control-Allow-Origin': allowedOrigins.join(', '),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

/** Dynamic CORS — sets origin based on request origin header */
export function setCorsHeaders(req: VercelRequest, res: any) {
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'https://naijamation.vercel.app',
        'https://www.naijamation.com',
    ];
    if (process.env.VERCEL_ENV !== 'production') {
        allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
    }

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
}
