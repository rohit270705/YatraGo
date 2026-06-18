import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdmin() {
  const ADMIN_UUID = 'a1b2c3d4-e5f6-4a1b-8c9d-0123456789ab';
  
  console.log("Saving Admin user to Supabase 'users' table...");
  const { data, error } = await supabase.from('users').upsert({
    id: ADMIN_UUID,
    email: 'admin@yatraGo.com',
    name: 'Super Admin',
    phone: '9999999999',
    role: 'admin',
    email_verified: true,
    phone_verified: true
  }).select();

  if (error) {
    console.error("Failed to add admin:", error);
  } else {
    console.log("Admin successfully added to Supabase DB:", data[0].email, "with ID:", data[0].id);
  }
}

addAdmin();
