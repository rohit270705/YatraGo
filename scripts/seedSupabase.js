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

// Data from store.js
const MOCK_VEHICLES = [
  { id: 'v1', type: 'bus', ownerName: 'TravelCorp', registrationNumber: 'MH01AB1234', seatingCapacity: 40, luggageCapacity: 1000 },
  { id: 'v2', type: 'suv', ownerName: 'John Doe', registrationNumber: 'MH02XY9876', seatingCapacity: 6, luggageCapacity: 100 },
  { id: 'v3', type: 'bus', ownerName: 'CityTours', registrationNumber: 'DL01CC5555', seatingCapacity: 45, luggageCapacity: 1200 },
  { id: 'v4', type: 'sedan', ownerName: 'Alice Smith', registrationNumber: 'KA03ZZ4444', seatingCapacity: 4, luggageCapacity: 60 }
];

const MOCK_ROUTES = [
  { id: 'r1', vehicle_id: 'v1', from_city: 'Mumbai', to_city: 'Pune', stops: ['Lonavala'], departure_time: '08:00', arrival_time: '11:30', journey_date: '2026-06-20', price: 500, available_seats: 12, luggage_available: 200 },
  { id: 'r2', vehicle_id: 'v2', from_city: 'Delhi', to_city: 'Agra', stops: ['Mathura'], departure_time: '06:00', arrival_time: '09:00', journey_date: '2026-06-22', price: 800, available_seats: 3, luggage_available: 20 },
  { id: 'r3', vehicle_id: 'v3', from_city: 'Bangalore', to_city: 'Mysore', stops: ['Mandya'], departure_time: '07:30', arrival_time: '10:30', journey_date: '2026-06-25', price: 400, available_seats: 25, luggage_available: 500 },
  { id: 'r4', vehicle_id: 'v4', from_city: 'Mumbai', to_city: 'Nashik', stops: ['Thane', 'Igatpuri'], departure_time: '09:00', arrival_time: '12:30', journey_date: '2026-06-21', price: 600, available_seats: 2, luggage_available: 15 }
];

const RENTAL_VEHICLES = [
  { id: 'bk1', category: 'bike', name: 'Royal Enfield Classic 350', brand: 'Royal Enfield', cc: 350, fuel_type: 'Petrol', mileage: '35 km/l', price_per_hour: 80, price_per_day: 800, security_deposit: 2000, color: 'Stealth Black', year: 2025, rating: 4.8, total_rentals: 245, location: 'Mumbai - Andheri East', available: true, image: '🏍️' },
  { id: 'sc1', category: 'scooty', name: 'Honda Activa 6G', brand: 'Honda', cc: 110, fuel_type: 'Petrol', mileage: '55 km/l', price_per_hour: 30, price_per_day: 300, security_deposit: 1000, color: 'Pearl Precious White', year: 2025, rating: 4.7, total_rentals: 567, location: 'Mumbai - Dadar', available: true, image: '🛵' }
];

async function seed() {
  console.log("Seeding Vehicles...");
  for (const v of MOCK_VEHICLES) {
    await supabase.from('vehicles').upsert({
      id: v.id,
      registration_number: v.registrationNumber,
      type: v.type,
      seating_capacity: v.seatingCapacity,
      luggage_capacity: v.luggageCapacity,
      owner_id: 'system',
      owner_name: v.ownerName,
      approved: true,
      is_active: true
    });
  }

  console.log("Seeding Routes...");
  for (const r of MOCK_ROUTES) {
    await supabase.from('routes').upsert(r);
  }

  console.log("Seeding Rentals...");
  for (const r of RENTAL_VEHICLES) {
    await supabase.from('rentals').upsert(r);
  }

  console.log("Database seeded successfully!");
}

seed();
