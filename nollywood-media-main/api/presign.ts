import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserFromRequest, setCorsHeaders } from './_lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from './_lib/rateLimit';

// ═══ FILE VALIDATION ═══
const ALLOWED_CONTENT_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'video/x-matroska', 'video/ogg',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.ps1', '.sh', '.php', '.jsp', '.asp', '.dll', '.so'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Rate limiting (10 uploads per 5 minutes)
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`presign:${clientIp}`, RATE_LIMITS.upload);
    if (!rl.allowed) {
        return res.status(429).json({ error: 'Upload rate limit exceeded. Try again later.' });
    }

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { filename, contentType, fileSize, bucket } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'filename and contentType are required' });
        }

        // ═══ FILE TYPE VALIDATION ═══
        if (!ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())) {
            return res.status(400).json({
                error: `File type "${contentType}" is not allowed. Accepted: video, image, audio files.`
            });
        }

        // ═══ EXTENSION VALIDATION ═══
        const ext = '.' + filename.split('.').pop()?.toLowerCase();
        if (DANGEROUS_EXTENSIONS.includes(ext)) {
            return res.status(400).json({ error: `File extension "${ext}" is not allowed.` });
        }

        // ═══ FILE SIZE VALIDATION ═══
        if (fileSize && fileSize > MAX_FILE_SIZE) {
            return res.status(400).json({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
            });
        }

        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKey = process.env.R2_ACCESS_KEY_ID;
        const secretKey = process.env.R2_SECRET_ACCESS_KEY;
        const bucketName = process.env.R2_BUCKET_NAME || 'naijamation';
        const publicUrl = process.env.R2_PUBLIC_URL;

        // If R2 is not configured, return a mock/local URL
        if (!accountId || !accessKey || !secretKey) {
            console.warn('R2 not configured — returning mock upload URL');
            const mockPath = `uploads/${user.userId}/${Date.now()}-${filename}`;
            return res.status(200).json({
                uploadUrl: null,
                publicUrl: `/mock-storage/${mockPath}`,
                path: mockPath,
                configured: false,
                message: 'R2 storage not configured.',
            });
        }

        const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
        });

        // Sanitize filename to prevent path traversal
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${bucket || 'user-content'}/${user.userId}/${Date.now()}-${safeFilename}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            ContentLength: fileSize || undefined,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        const filePublicUrl = publicUrl ? `${publicUrl}/${key}` : `https://${accountId}.r2.dev/${key}`;

        return res.status(200).json({
            uploadUrl,
            publicUrl: filePublicUrl,
            path: key,
            configured: true,
        });
    } catch (err: any) {
        console.error('Presign error:', err);
        return res.status(500).json({ error: err.message || 'Failed to generate upload URL' });
    }
}
