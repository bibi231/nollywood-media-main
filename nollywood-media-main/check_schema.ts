import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function checkSchema() {
    try {
        console.log("Fetching schema for user_content_uploads...");
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_content_uploads'
        `;
        console.table(result);
    } catch (e) {
        console.error(e);
    }
}

checkSchema();
