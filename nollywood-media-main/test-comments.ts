import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testComments() {
    console.log("Fetching comments...");
    const { data, error } = await supabase
        .from('film_comments')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Schema error or table missing:", error);
    } else {
        console.log("Comments data fetched successfully:", data);
    }
}

testComments();
