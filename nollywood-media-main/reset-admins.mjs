import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');

function getEnv(key) {
    const line = envContent.split('\n').find(l => l.startsWith(`${key}=`));
    return line ? line.split(/=(.+)/)[1].trim() : null;
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log("Missing Supabase Service Key or URL. Please ensure they are in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const targetPassword = 'NaijaAdmin2024!';

    async function promoteUser(email, role) {
        console.log(`\n--- Processing ${email} as ${role} ---`);

        // 1. Get user by email from Admin Auth API
        let { data: users, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error("Failed to list users:", authError.message);
            return;
        }

        let authUser = users.users.find(u => u.email === email);

        if (!authUser) {
            console.log(`User ${email} does not exist in Auth. Creating now...`);
            // Create user
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: targetPassword,
                email_confirm: true,
                user_metadata: { display_name: email.split('@')[0] }
            });

            if (createError) {
                console.error("Failed to create user:", createError.message);
                return;
            }
            authUser = newUser.user;
            console.log(`Successfully created new auth user: ${authUser.id}`);
        } else {
            console.log(`User found in Auth: ${authUser.id}. Resetting password...`);
            // Reset password
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                authUser.id,
                { password: targetPassword }
            );
            if (updateError) {
                console.error("Failed to reset password:", updateError.message);
            } else {
                console.log("Password reset successfully.");
            }
        }

        // 2. Ensure Profile Exists
        const { error: profileError } = await supabase.from('user_profiles').upsert({
            id: authUser.id,
            email: email,
            display_name: email.split('@')[0],
            subscription_status: 'free',
            updated_at: new Date().toISOString()
        });

        if (profileError) {
            console.error("Profile Upsert Error:", profileError.message);
        }

        // 3. Assign Role in user_roles
        const { error: roleError } = await supabase.from('user_roles').upsert({
            user_id: authUser.id,
            role: role,
            updated_at: new Date().toISOString()
        });

        if (roleError) {
            console.error("Failed to assign role:", roleError.message);
        } else {
            console.log(`Success: ${email} is now ${role}. Password: ${targetPassword}`);
        }
    }

    await promoteUser('peterjohn2343@gmail.com', 'super_admin');
    await promoteUser('bitrus@gadzama.com', 'super_admin');
    await promoteUser('admin@naijamation.com', 'admin');

    console.log("\nFinished processing all admins.");
}

run().catch(e => {
    console.error("Fatal Error:", e);
    process.exit(1);
});
