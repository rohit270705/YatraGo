const fs = require('fs');

const storePath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\scratch\\tours_travels\\src\\store.js';
let content = fs.readFileSync(storePath, 'utf8');

// The mapping function
const mapper = `
const mapRoute = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  from: r.from_city,
  to: r.to_city,
  stops: r.stops || [],
  departureTime: r.departure_time,
  arrivalTime: r.arrival_time,
  date: r.journey_date,
  price: r.price,
  availableSeats: r.available_seats,
  luggageAvailable: r.luggage_available,
  vehicle: r.vehicles ? {
    id: r.vehicles.id,
    type: r.vehicles.type,
    registrationNumber: r.vehicles.registration_number,
    ownerId: r.vehicles.owner_id
  } : null
});
`;

// Insert the mapper after imports
content = content.replace('export const useAuthStore', mapper + '\nexport const useAuthStore');

// Update fetchAllRoutes
content = content.replace(
  `const { data, error } = await supabase.from('routes').select('*, vehicles(*)');\n      if (!error && data) set({ routes: data });`,
  `const { data, error } = await supabase.from('routes').select('*, vehicles(*)');\n      if (!error && data) set({ routes: data.map(mapRoute) });`
);

// Update searchRoutes
content = content.replace(
  `set({ searchResults: data || [] });\n      return data || [];`,
  `const mapped = (data || []).map(mapRoute);\n      set({ searchResults: mapped });\n      return mapped;`
);

// We should also map vehicles in fetchVehicles if necessary, but let's see if we need to.
// The vehicles are nested inside routes now, but useVehicleStore might also need fetching.
// Let's check useVehicleStore in store.js
const hasFetchVehicles = content.includes('fetchVehicles:');
if (!hasFetchVehicles) {
  // Let's inject a fetchVehicles if it doesn't exist or replace mock data
}

fs.writeFileSync(storePath, content);
console.log("Updated store.js with route mapper");
