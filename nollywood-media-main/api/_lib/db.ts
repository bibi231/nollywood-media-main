import { neon } from '@neondatabase/serverless';

export function getDb() {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    return sql;
}

/** Run a parameterized query — neon() returns a callable, not a client */
export async function query(text: string, params: any[] = []) {
    const sql = getDb();
    // neon() is a tagged-template / callable function, NOT a pg Client
    // It returns an array of row objects directly
    return await sql(text, params);
}

