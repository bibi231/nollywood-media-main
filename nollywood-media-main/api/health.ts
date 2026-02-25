import { neon } from '@neondatabase/serverless';

export default function handler(req: any, res: any) {
    res.status(200).json({
        status: 'ok',
        message: 'Health check with neon import',
        time: new Date().toISOString(),
        env_db: !!process.env.NEON_DATABASE_URL,
        has_neon: !!neon
    });
}
