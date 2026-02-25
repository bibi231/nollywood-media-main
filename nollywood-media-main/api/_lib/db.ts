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
        // The Neon driver requires .query() for parameterized calls
        // vs tagged template literals
        return await (sql as any).query(text, params);
    } catch (err: any) {
        console.error(`Database query failed: ${text}`, err);
        throw err;
    }
}

