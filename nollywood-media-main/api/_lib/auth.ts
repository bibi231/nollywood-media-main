import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is not set. Using dev default.');
}

const SECRET = JWT_SECRET || 'naijamation-dev-secret-change-in-production';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export function signToken(payload: JWTPayload): string {
    return sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return verify(token, SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

/** Extract and verify JWT from Authorization header */
export function getUserFromRequest(req: VercelRequest): JWTPayload | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return verifyToken(auth.slice(7));
}

/** CORS headers for API responses */
export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://*.r2.cloudflarestorage.com; media-src 'self' https://*.r2.cloudflarestorage.com; connect-src 'self' https://*.supabase.co https://api.paystack.co;",
    };
}
