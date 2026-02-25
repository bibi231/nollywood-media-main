import { neon } from '@neondatabase/serverless';

export function getDb() {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    return sql;
}

/** Run a parameterized query using sql.query() */
export async function query(text: string, params: any[] = []) {
    const sql = getDb();
    const result = await sql.query(text, params);
    return result.rows ?? result;
}
