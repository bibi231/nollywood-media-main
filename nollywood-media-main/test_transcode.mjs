import { transcodeFilm } from './api/_lib/transcoder.mjs';

const filmId = 'a2adaee1-e523-45f2-93d3-4842368e02d0'; // The Lagos Hustle

async function test() {
    try {
        console.log(`🚀 Starting test transcode for ${filmId}...`);
        const hlsUrl = await transcodeFilm(filmId);
        console.log(`✨ Success! HLS URL: ${hlsUrl}`);
    } catch (err) {
        console.error(`❌ Transcode failed:`, err);
    }
}
test();
