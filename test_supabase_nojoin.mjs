import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const [routesRes, vehiclesRes] = await Promise.all([
    supabase.from('routes').select('*'),
    supabase.from('vehicles').select('*')
  ]);
  
  if (!routesRes.error && routesRes.data) {
    const vehiclesMap = {};
    if (vehiclesRes.data) {
      vehiclesRes.data.forEach(v => {
        vehiclesMap[v.id] = v;
      });
    }
    
    const mappedRoutes = routesRes.data.map(r => {
      if (r.vehicle_id && vehiclesMap[r.vehicle_id]) {
        r.vehicles = vehiclesMap[r.vehicle_id];
      }
      return r;
    });
    
    console.log('Success! Found routes:', mappedRoutes.length);
    console.log('Sample route:', JSON.stringify(mappedRoutes[0], null, 2));
  } else {
    console.log('Error:', routesRes.error);
  }
}

test();
