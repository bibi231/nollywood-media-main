export default function handler(req: any, res: any) {
    res.status(200).json({
        status: 'ok',
        message: 'Minimal health check working',
        time: new Date().toISOString(),
        env_db: !!process.env.NEON_DATABASE_URL
    });
}
