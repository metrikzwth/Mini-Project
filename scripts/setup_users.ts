
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually since we don't have dotenv
const loadEnv = () => {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach((line) => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    }
};

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    {
        email: 'patient@test.com',
        password: 'patient123',
        options: {
            data: {
                name: 'John Patient',
                role: 'patient',
            },
        },
    },
    {
        email: 'doctor@test.com',
        password: 'doctor123',
        options: {
            data: {
                name: 'Dr. Sarah Johnson',
                role: 'doctor',
            },
        },
    },
];

async function setupUsers() {
    console.log('Starting user registration...');

    for (const user of users) {
        console.log(`Processing ${user.email}...`);

        // Try to sign up
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: user.options,
        });

        if (error) {
            console.log(`Error registering ${user.email}: ${error.message}`);
            // If user already exists, we can't update password with this client unless logged in
            // But usually "User already registered" is fine, we assume the password is correct or user knows it
        } else {
            if (data.user && !data.session) {
                console.log(`User ${user.email} registered. Please check email/Supabase to confirm if email verification is enabled.`);
            } else {
                console.log(`User ${user.email} registered and signed in.`);
            }
        }
    }

    console.log('User setup complete.');
}

setupUsers().catch(console.error);
