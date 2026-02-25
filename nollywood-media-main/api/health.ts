import { neon } from '@neondatabase/serverless';
import * as jwt from 'jsonwebtoken';

export default function handler(req: any, res: any) {
    res.status(200).json({
        status: 'ok',
        message: 'Health check with neon and jwt imports',
        time: new Date().toISOString(),
        env_db: !!process.env.NEON_DATABASE_URL,
        has_neon: !!neon,
        has_jwt: !!jwt
    });
}
