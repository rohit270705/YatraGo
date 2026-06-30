import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // bypassing RLS
if (!supabaseKey) {
  console.error("No service role key found. Using anon key.");
}
const supabase = createClient(supabaseUrl, supabaseKey || process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: vData, error } = await supabase.from('vehicles').select('*');
  console.log('Vehicles:', vData);
  console.log('Error:', error);
}

test();
