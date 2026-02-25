import { neon } from '@neondatabase/serverless';

export function getDb() {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
        console.error('CRITICAL: NEON_DATABASE_URL is not set!');
        throw new Error('NEON_DATABASE_URL environment variable is not set');
    }
    return neon(url);
}

/** Run a parameterized query — neon() returns a callable, not a client */
export async function query(text: string, params: any[] = []) {
    try {
        const sql = getDb();
        // neon() is a tagged-template / callable function
        // Casting to any to avoid TS issues with the dual-overload signature
        return await (sql as any)(text, params);
    } catch (err: any) {
        console.error(`Database query failed: ${text}`, err);
        throw err;
    }
}

