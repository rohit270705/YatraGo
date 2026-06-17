import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local manually since we aren't using Vite
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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_VEHICLES = [
  {
    id: 'v5',
    registrationNumber: 'DL-01-BU-7890',
    type: 'Bus',
    seatingCapacity: 40,
    luggageCapacity: 200,
    ownerId: 'owner5',
    ownerName: 'Suresh Travels Pvt Ltd',
    approved: true,
    isActive: true,
  },
  {
    id: 'v6',
    registrationNumber: 'TN-07-BU-2345',
    type: 'Bus',
    seatingCapacity: 32,
    luggageCapacity: 160,
    ownerId: 'owner6',
    ownerName: 'KPN Travels',
    approved: true,
    isActive: true,
  }
];

const MOCK_ROUTES = [
  {
    id: 'r5', vehicle_id: 'v3', from_city: 'Bangalore', to_city: 'Goa', stops: ['Hubli', 'Belgaum'],
    departure_time: '20:00', arrival_time: '06:00', journey_date: '2026-06-16', price: 950,
    available_seats: 12, luggage_available: 100
  },
  {
    id: 'r6', vehicle_id: 'v2', from_city: 'Mumbai', to_city: 'Nashik', stops: ['Kasara', 'Igatpuri'],
    departure_time: '09:00', arrival_time: '12:30', journey_date: '2026-06-17', price: 500,
    available_seats: 3, luggage_available: 20
  },
  {
    id: 'r7', vehicle_id: 'v5', from_city: 'Delhi', to_city: 'Jaipur', stops: ['Gurgaon', 'Neemrana', 'Behror'],
    departure_time: '06:30', arrival_time: '12:00', journey_date: '2026-06-15', price: 700,
    available_seats: 28, luggage_available: 150
  },
  {
    id: 'r8', vehicle_id: 'v5', from_city: 'Mumbai', to_city: 'Ahmedabad', stops: ['Surat', 'Vadodara', 'Anand'],
    departure_time: '21:00', arrival_time: '06:30', journey_date: '2026-06-16', price: 850,
    available_seats: 35, luggage_available: 180
  },
  {
    id: 'r9', vehicle_id: 'v6', from_city: 'Bangalore', to_city: 'Chennai', stops: ['Hosur', 'Krishnagiri', 'Vellore'],
    departure_time: '23:00', arrival_time: '05:30', journey_date: '2026-06-15', price: 600,
    available_seats: 22, luggage_available: 120
  },
  {
    id: 'r10', vehicle_id: 'v6', from_city: 'Hyderabad', to_city: 'Bangalore', stops: ['Kurnool', 'Anantapur'],
    departure_time: '20:00', arrival_time: '06:00', journey_date: '2026-06-16', price: 900,
    available_seats: 18, luggage_available: 100
  },
];

async function seed() {
  console.log("Seeding Missing Vehicles...");
  for (const v of MOCK_VEHICLES) {
    const { error } = await supabase.from('vehicles').upsert({
      id: v.id,
      registration_number: v.registrationNumber,
      type: v.type,
      seating_capacity: v.seatingCapacity,
      luggage_capacity: v.luggageCapacity,
      owner_id: v.ownerId,
      owner_name: v.ownerName,
      approved: v.approved,
      is_active: v.isActive
    });
    if (error) console.error("Vehicle error:", error);
  }

  console.log("Seeding Missing Routes...");
  for (const r of MOCK_ROUTES) {
    const { error } = await supabase.from('routes').upsert(r);
    if (error) console.error("Route error:", error);
  }

  console.log("Missing data seeded successfully!");
}

seed();
