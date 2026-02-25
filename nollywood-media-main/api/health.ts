import { neon } from '@neondatabase/serverless';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

export default function handler(req: any, res: any) {
    res.status(200).json({
        status: 'ok',
        message: 'Health check with all imports',
        time: new Date().toISOString(),
        env_db: !!process.env.NEON_DATABASE_URL,
        has_neon: !!neon,
        has_jwt: !!jwt,
        has_bcrypt: !!bcrypt
    });
}
