import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getUserFromRequest, corsHeaders } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    try {
        const { filename, contentType, bucket } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'filename and contentType are required' });
        }

        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKey = process.env.R2_ACCESS_KEY_ID;
        const secretKey = process.env.R2_SECRET_ACCESS_KEY;
        const bucketName = process.env.R2_BUCKET_NAME || 'naijamation-media';
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
                message: 'R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
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

        const key = `${bucket || 'user-content'}/${user.userId}/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
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
