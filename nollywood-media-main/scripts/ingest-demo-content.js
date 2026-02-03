
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing since we don't have dotenv installed
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const films = [
  {
    title: "The King's Dilemma",
    logline: "A young prince must choose between love and duty",
    synopsis: "In a fictional African kingdom, Prince Kwame falls in love with a commoner, but his father demands he marry for political alliance. A tale of sacrifice and true love.",
    genre: "Drama",
    rating: "PG-13",
    release_year: 2023,
    runtime_min: 118,
    setting_region: "Nigeria",
    languages_audio: "English",
    languages_subtitles: "English",
    cast_members: "Chiwetel Ejiofor, Lupita Nyong'o, Idris Elba",
    director: "Amma Asante",
    studio_label: "Nollywood Studios",
    tags: "drama, romance, african",
    video_url: "https://vjs.zencdn.net/v/oceans.mp4", // Using a real sample video
    poster_url: "https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600",
    status: "published"
  },
  {
    title: "Lagos Nights",
    logline: "A detective uncovers dark secrets in the city",
    synopsis: "Detective Yetunde returns to her hometown Lagos to solve her sister's mysterious disappearance, uncovering a web of corruption and betrayal.",
    genre: "Thriller",
    rating: "R",
    release_year: 2023,
    runtime_min: 125,
    setting_region: "Nigeria",
    languages_audio: "English, Yoruba",
    languages_subtitles: "English",
    cast_members: "Genevieve Nnaji, Kunle Remi",
    director: "Niyi Akinmolayan",
    studio_label: "Nollywood Studios",
    tags: "thriller, mystery, crime",
    video_url: "https://vjs.zencdn.net/v/oceans.mp4",
    poster_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600",
    status: "published"
  },
  {
    title: "Heritage",
    logline: "A family fights to preserve their ancestral home",
    synopsis: "When a wealthy developer threatens to demolish a historic family compound, the three sisters must unite to save their inheritance and cultural legacy.",
    genre: "Drama",
    rating: "PG",
    release_year: 2023,
    runtime_min: 142,
    setting_region: "Nigeria",
    languages_audio: "English, Igbo",
    languages_subtitles: "English",
    cast_members: "Funke Akindele, Ini Edo, Chidi Mokeme",
    director: "Bolanle Austen-Peters",
    studio_label: "EbonyLife Films",
    tags: "drama, family, cultural",
    video_url: "https://vjs.zencdn.net/v/oceans.mp4",
    poster_url: "https://images.unsplash.com/photo-1523985635299-3ba4dcc4a80b?w=400&h=600",
    status: "published"
  },
  {
    title: "Code Red",
    logline: "Young hackers must stop a cyber terrorist",
    synopsis: "A team of brilliant young tech enthusiasts in Lagos discover a hacker plotting to shut down the country's power grid. They must use their skills to stop him before midnight.",
    genre: "Action",
    rating: "PG-13",
    release_year: 2023,
    runtime_min: 108,
    setting_region: "Nigeria",
    languages_audio: "English",
    languages_subtitles: "English",
    cast_members: "Timini Egbuson, Sharon Ooja, Adesua Etomi-Wellington",
    director: "Jade Osiberu",
    studio_label: "Netflix Africa",
    tags: "action, scifi, thriller, tech",
    video_url: "https://vjs.zencdn.net/v/oceans.mp4",
    poster_url: "https://images.unsplash.com/photo-1478720568477-152d9e3287a0?w=400&h=600",
    status: "published"
  },
  {
    title: "The Wedding",
    logline: "A dream wedding becomes a nightmare",
    synopsis: "Just days before her perfect wedding, Amina discovers her fiancé has a dark secret. She must decide between love and truth.",
    genre: "Romance",
    rating: "PG-13",
    release_year: 2023,
    runtime_min: 105,
    setting_region: "Nigeria",
    languages_audio: "English",
    languages_subtitles: "English",
    cast_members: "Bisola Aiyeola, Ikechukwu Onunaku, Deyemi Okanlawon",
    director: "Adekunle Adejuyigbe",
    studio_label: "Nollywood Studios",
    tags: "romance, wedding, drama",
    video_url: "https://vjs.zencdn.net/v/oceans.mp4",
    poster_url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600",
    status: "published"
  }
];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-');      // Replace multiple - with single -
};

async function ingest() {
  console.log('🚀 Starting ingestion...');
  
  for (const film of films) {
    const id = slugify(film.title);
    console.log(`📦 Ingesting: ${film.title} (${id})...`);
    
    // Check if it exists
    const { data: existing } = await supabase
      .from('films')
      .select('id')
      .eq('id', id)
      .single();
      
    if (existing) {
      console.log(`⚠️ ${film.title} already exists, skipping.`);
      continue;
    }

    const { error } = await supabase
      .from('films')
      .insert({
        id,
        ...film
      });

    if (error) {
      console.error(`❌ Error ingesting ${film.title}:`, error.message);
    } else {
      console.log(`✅ ${film.title} ingested successfully.`);
    }
  }

  console.log('🏁 Ingestion complete.');
}

ingest();
