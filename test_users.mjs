import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Querying pg_policies ---');
  // Since we cannot query pg_policies directly via postgrest usually, let's test RPC or direct query if exposed
  const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'users');
  console.log('Result:', { data, error });
}

check();
