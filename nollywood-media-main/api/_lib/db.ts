import { neon } from '@neondatabase/serverless';

export function getDb() {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
        throw new Error('NEON_DATABASE_URL environment variable is not set');
    }
    return neon(url);
}

/** Run a parameterized query — neon() returns a callable, not a client */
export async function query(text: string, params: any[] = []) {
    const sql = getDb();
    // neon() is a tagged-template / callable function, NOT a pg Client
    // It returns an array of row objects directly
    return await sql(text, params);
}

