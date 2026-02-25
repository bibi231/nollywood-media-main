// Create test accounts in Neon
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_8X7fhiwZzTLW@ep-billowing-thunder-ai4bcdo3-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function createAccounts() {
    console.log('🔐 Creating accounts in Neon...\n');

    // ─── Admin Account ───
    console.log('👑 Admin Account:');
    try {
        // Check if admin already exists
        const existing = await sql`SELECT id, email FROM users WHERE email = 'bitrus@gadzama.com'`;
        if (existing.length > 0) {
            console.log('  ✅ Admin already exists:', existing[0].email);
            // Ensure role is admin
            await sql.query(`UPDATE user_roles SET role = 'admin' WHERE user_id = $1`, [existing[0].id]);
            console.log('  ✅ Admin role confirmed');
        } else {
            await sql.query(`INSERT INTO users (email, encrypted_password, display_name) VALUES ('bitrus@gadzama.com', crypt('admin00', gen_salt('bf')), 'Bitrus Gadzama') ON CONFLICT (email) DO NOTHING`);
            const admin = await sql`SELECT id FROM users WHERE email = 'bitrus@gadzama.com'`;
            await sql.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin'`, [admin[0].id]);
            await sql.query(`INSERT INTO user_profiles (id, email, display_name) VALUES ($1, 'bitrus@gadzama.com', 'Bitrus Gadzama') ON CONFLICT (id) DO NOTHING`, [admin[0].id]);
            console.log('  ✅ Admin created');
        }
        console.log('  📧 Email: bitrus@gadzama.com');
        console.log('  🔑 Password: admin00');

    } catch (err) {
        console.error('  ❌ Admin error:', err.message);
    }

    // ─── Regular User Account ───
    console.log('\n👤 Regular User Account:');
    try {
        const existingUser = await sql`SELECT id, email FROM users WHERE email = 'viewer@naijamation.com'`;
        if (existingUser.length > 0) {
            console.log('  ✅ User already exists:', existingUser[0].email);
        } else {
            await sql.query(`INSERT INTO users (email, encrypted_password, display_name) VALUES ('viewer@naijamation.com', crypt('viewer123', gen_salt('bf')), 'NaijaMation Viewer') ON CONFLICT (email) DO NOTHING`);
            const user = await sql`SELECT id FROM users WHERE email = 'viewer@naijamation.com'`;
            await sql.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'user') ON CONFLICT (user_id) DO NOTHING`, [user[0].id]);
            await sql.query(`INSERT INTO user_profiles (id, email, display_name, bio) VALUES ($1, 'viewer@naijamation.com', 'NaijaMation Viewer', 'A passionate fan of African cinema!') ON CONFLICT (id) DO NOTHING`, [user[0].id]);
            console.log('  ✅ User created');
        }
        console.log('  📧 Email: viewer@naijamation.com');
        console.log('  🔑 Password: viewer123');

    } catch (err) {
        console.error('  ❌ User error:', err.message);
    }

    // ─── Creator/Studio Account ───
    console.log('\n🎬 Creator Account:');
    try {
        const existingCreator = await sql`SELECT id, email FROM users WHERE email = 'creator@naijamation.com'`;
        if (existingCreator.length > 0) {
            console.log('  ✅ Creator already exists:', existingCreator[0].email);
        } else {
            await sql.query(`INSERT INTO users (email, encrypted_password, display_name) VALUES ('creator@naijamation.com', crypt('creator123', gen_salt('bf')), 'NaijaMation Studio') ON CONFLICT (email) DO NOTHING`);
            const creator = await sql`SELECT id FROM users WHERE email = 'creator@naijamation.com'`;
            await sql.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'creator') ON CONFLICT (user_id) DO NOTHING`, [creator[0].id]);
            await sql.query(`INSERT INTO user_profiles (id, email, display_name, bio) VALUES ($1, 'creator@naijamation.com', 'NaijaMation Studio', 'Creating amazing Nollywood content') ON CONFLICT (id) DO NOTHING`, [creator[0].id]);
            await sql.query(`INSERT INTO creator_profiles (id, user_id, channel_name, channel_description, is_verified) VALUES ($1, $1, 'NaijaMation Studios', 'Official NaijaMation content channel', true) ON CONFLICT (id) DO NOTHING`, [creator[0].id]);
            console.log('  ✅ Creator created');
        }
        console.log('  📧 Email: creator@naijamation.com');
        console.log('  🔑 Password: creator123');

    } catch (err) {
        console.error('  ❌ Creator error:', err.message);
    }

    // ─── Add Some Sample Films ───
    console.log('\n🎥 Adding sample films...');
    const sampleFilms = [
        {
            title: 'The Lagos Hustle',
            logline: 'A young entrepreneur navigates the chaotic streets of Lagos to build a tech startup against all odds.',
            synopsis: 'In the heart of Lagos, Nigeria, Adaeze, a brilliant but broke computer science graduate, must navigate corruption, family expectations, and fierce competition to launch her revolutionary fintech app. With nothing but determination and a borrowed laptop, she takes on the establishment.',
            genre: 'Drama',
            release_year: 2024,
            runtime_min: 118,
            rating: 'PG-13',
            setting_region: 'West Africa',
            director: 'Kemi Adetiba',
            studio_label: 'NaijaMation Studios',
            poster_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 15420,
        },
        {
            title: 'Ancestors Rising',
            logline: 'When ancient spirits awaken in a modern Nigerian city, one family must reconcile their heritage with the present.',
            synopsis: 'The Okafor family discovers their ancestral compound sits on a spiritual nexus when construction for a new shopping mall disturbs ancient burial grounds. As supernatural events escalate, the family must choose between modernity and tradition.',
            genre: 'Fantasy',
            release_year: 2024,
            runtime_min: 132,
            rating: 'PG-13',
            setting_region: 'West Africa',
            director: 'Kunle Afolayan',
            studio_label: 'NaijaMation Studios',
            poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 23100,
        },
        {
            title: 'Love in Accra',
            logline: 'Two rival food vendors discover love through a cooking competition that could change their lives forever.',
            synopsis: 'Kofi, a traditional Ghanaian chef, and Amara, a fusion food innovator from Nigeria, are pitted against each other in Accra\'s biggest cooking competition. As the heat rises in the kitchen, so does the chemistry between them.',
            genre: 'Romance',
            release_year: 2023,
            runtime_min: 105,
            rating: 'PG',
            setting_region: 'West Africa',
            director: 'Shirley Frimpong-Manso',
            studio_label: 'Sparrow Productions',
            poster_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 8750,
        },
        {
            title: 'Shadows of Nairobi',
            logline: 'A detective uncovers a conspiracy that threatens to destabilize an entire nation.',
            synopsis: 'Detective Wanjiku is assigned what appears to be a routine missing persons case in Nairobi. But as she digs deeper, she uncovers a web of corruption reaching the highest levels of government, putting her life and family in danger.',
            genre: 'Thriller',
            release_year: 2024,
            runtime_min: 128,
            rating: 'R',
            setting_region: 'East Africa',
            director: 'Wanuri Kahiu',
            studio_label: 'Afrobubblegum',
            poster_url: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 31200,
        },
        {
            title: 'The Fisherman\'s Daughter',
            logline: 'A young girl from a fishing village dreams of becoming Africa\'s first female astronaut.',
            synopsis: 'Twelve-year-old Nneka lives in a small fishing village on the Niger Delta. After finding a broken telescope on the shore, she becomes obsessed with space. Against her father\'s wishes, she enters a national science competition that could change her destiny.',
            genre: 'Drama',
            release_year: 2023,
            runtime_min: 95,
            rating: 'PG',
            setting_region: 'West Africa',
            director: 'Genevieve Nnaji',
            studio_label: 'NaijaMation Studios',
            poster_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 42300,
        },
        {
            title: 'Jollof Wars',
            logline: 'The ultimate comedy about the greatest rivalry in Africa: who makes the best Jollof rice?',
            synopsis: 'When a food network announces a pan-African Jollof rice competition with a million-dollar prize, representatives from Nigeria, Ghana, Senegal, and Cameroon descend on Lagos for the cook-off of the century. What follows is culinary chaos, cultural clash, and unexpected friendships.',
            genre: 'Comedy',
            release_year: 2024,
            runtime_min: 98,
            rating: 'PG',
            setting_region: 'West Africa',
            director: 'Funke Akindele',
            studio_label: 'Scene One Productions',
            poster_url: 'https://images.unsplash.com/photo-1567982047351-76b6f93e38ee?w=400',
            thumbnail_url: 'https://images.unsplash.com/photo-1567982047351-76b6f93e38ee?w=800',
            video_url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            status: 'published',
            views: 56800,
        },
    ];

    for (const film of sampleFilms) {
        try {
            const existing = await sql`SELECT id FROM films WHERE title = ${film.title}`;
            if (existing.length > 0) {
                console.log(`  ⏭️  "${film.title}" already exists`);
                continue;
            }

            await sql.query(
                `INSERT INTO films (title, logline, synopsis, genre, release_year, runtime_min, rating, setting_region, director, studio_label, poster_url, thumbnail_url, video_url, status, views)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [film.title, film.logline, film.synopsis, film.genre, film.release_year, film.runtime_min, film.rating, film.setting_region, film.director, film.studio_label, film.poster_url, film.thumbnail_url, film.video_url, film.status, film.views]
            );
            console.log(`  ✅ "${film.title}" (${film.genre})`);
        } catch (err) {
            console.error(`  ❌ "${film.title}": ${err.message}`);
        }
    }

    // ─── Summary ───
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Database Summary:');
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const filmCount = await sql`SELECT COUNT(*) as count FROM films`;
    const roleCount = await sql`SELECT role, COUNT(*) as count FROM user_roles GROUP BY role`;
    console.log(`  Users: ${userCount[0].count}`);
    console.log(`  Films: ${filmCount[0].count}`);
    console.log('  Roles:', roleCount.map(r => `${r.role}(${r.count})`).join(', '));
    console.log('═══════════════════════════════════════');
}

createAccounts().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
