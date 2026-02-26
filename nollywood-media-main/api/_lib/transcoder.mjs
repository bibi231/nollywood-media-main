import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
let DATABASE_URL = process.env.NEON_DATABASE_URL;
let R2_REGION = process.env.R2_REGION || 'auto';
let R2_ENDPOINT = process.env.R2_ENDPOINT;
let R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
let R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
let R2_BUCKET = process.env.R2_BUCKET_NAME || 'naijamation-media';

// Load from .env.local if needed
if (fs.existsSync(path.join(__dirname, '../../.env.local'))) {
    const env = fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8');
    env.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) {
            const key = k.trim();
            const val = v.trim();
            if (key === 'NEON_DATABASE_URL') DATABASE_URL = val;
            if (key === 'R2_ENDPOINT') R2_ENDPOINT = val;
            if (key === 'R2_ACCESS_KEY_ID') R2_ACCESS_KEY_ID = val;
            if (key === 'R2_SECRET_ACCESS_KEY') R2_SECRET_ACCESS_KEY = val;
            if (key === 'R2_BUCKET_NAME') R2_BUCKET = val;
        }
    });
}

const s3 = new S3Client({
    region: R2_REGION,
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    }
});

const sql = neon(DATABASE_URL);

async function runCommand(cmd, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let out = '';
        let err = '';
        proc.stdout.on('data', d => out += d);
        proc.stderr.on('data', d => err += d);
        proc.on('close', code => {
            if (code === 0) resolve(out);
            else reject(new Error(`Command failed with code ${code}: ${err}`));
        });
    });
}

export async function transcodeFilm(filmId) {
    console.log(`🎬 Transcoding started for film: ${filmId}`);

    // 1. Get film metadata
    const films = await sql`SELECT video_url FROM films WHERE id = ${filmId}`;
    if (films.length === 0) throw new Error('Film not found');
    const { video_url } = films[0];

    // Assume path is after the bucket/domain
    const videoKey = video_url.split('/').pop();
    const workDir = path.join(__dirname, `../../tmp_transcode_${filmId}`);
    if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, 'input.mp4');
    const hlsDir = path.join(workDir, 'hls');
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

    try {
        // 2. Download source
        console.log(`  ⬇️  Downloading source: ${video_url}`);

        if (video_url.startsWith('http')) {
            // Direct download via https.get with redirect following
            const download = (url) => {
                return new Promise((resolve, reject) => {
                    https.get(url, response => {
                        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                            console.log(`    ↪️ Following redirect to: ${response.headers.location}`);
                            resolve(download(response.headers.location));
                            return;
                        }
                        if (response.statusCode !== 200) {
                            reject(new Error(`Failed to download: Status ${response.statusCode}`));
                            return;
                        }
                        const file = fs.createWriteStream(inputPath);
                        response.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            resolve();
                        });
                    }).on('error', err => {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        reject(err);
                    });
                });
            };
            await download(video_url);
        } else {
            // Assume R2 key
            console.log('  🪣  Fetching from R2 bucket...');
            const downloadCmd = new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: video_url, // Use the path as key
            });
            const { Body } = await s3.send(downloadCmd);
            const writeStream = fs.createWriteStream(inputPath);
            await new Promise((resolve, reject) => {
                Body.pipe(writeStream);
                Body.on('error', reject);
                writeStream.on('finish', resolve);
            });
        }

        // 3. Transcode to HLS (Dual resolution: 720p, 360p)
        console.log('  ⚙️  Generating HLS segments (FFmpeg)...');

        // Multi-bitrate HLS generation
        const ffmpegArgs = [
            '-i', inputPath,
            // 720p
            '-map', '0:v:0', '-map', '0:a:0',
            '-s:v:0', '1280x720', '-c:v:0', 'libx264', '-b:v:0', '2500k',
            // 360p
            '-map', '0:v:0', '-map', '0:a:0',
            '-s:v:1', '640x360', '-c:v:1', 'libx264', '-b:v:1', '800k',
            // Master playlist settings
            '-f', 'hls',
            '-hls_time', '6',
            '-hls_playlist_type', 'vod',
            '-master_pl_name', 'master.m3u8',
            '-hls_segment_filename', path.join(hlsDir, 'v%v/seg%d.ts'),
            '-var_stream_map', 'v:0,a:0 v:1,a:1',
            path.join(hlsDir, 'v%v/index.m3u8')
        ];

        await runCommand('ffmpeg', ffmpegArgs);

        // 4. Upload to R2
        console.log('  ⬆️  Uploading HLS assets to R2...');
        const uploadDir = async (dir, prefix = '') => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    await uploadDir(filePath, `${prefix}${file}/`);
                } else {
                    const key = `hls/${filmId}/${prefix}${file}`;
                    const putCmd = new PutObjectCommand({
                        Bucket: R2_BUCKET,
                        Key: key,
                        Body: fs.createReadStream(filePath),
                        ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T'
                    });
                    await s3.send(putCmd);
                }
            }
        };

        await uploadDir(hlsDir);

        // 5. Update Database
        const hlsUrl = `${R2_ENDPOINT}/${R2_BUCKET}/hls/${filmId}/master.m3u8`;
        await sql`UPDATE films SET hls_url = ${hlsUrl} WHERE id = ${filmId}`;

        console.log(`✅ Transcoding complete: ${hlsUrl}`);
        return hlsUrl;

    } finally {
        // Cleanup
        console.log('  🧹 Cleaning up temp files...');
        fs.rmSync(workDir, { recursive: true, force: true });
    }
}
