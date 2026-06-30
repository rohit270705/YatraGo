const fs = require('fs');

const storePath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\scratch\\tours_travels\\src\\store.js';
let content = fs.readFileSync(storePath, 'utf8');

// Replace fetchAllRoutes
const oldFetchAll = `      fetchAllRoutes: async () => {
    try {
      const { data, error } = await supabase.from('routes').select('*, vehicles(*)');
      if (!error && data) set({ routes: data.map(mapRoute) });
    } catch(err) {}
  },`;

const newFetchAll = `      fetchAllRoutes: async () => {
    try {
      // Fetch separately to avoid PostgREST schema cache issues with newly added foreign keys
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
          // manually attach vehicle to bypass join issue
          if (r.vehicle_id && vehiclesMap[r.vehicle_id]) {
            r.vehicles = vehiclesMap[r.vehicle_id];
          }
          return mapRoute(r);
        });
        
        set({ routes: mappedRoutes });
      }
    } catch(err) {
      console.error('fetchAllRoutes error:', err);
    }
  },`;

content = content.replace(oldFetchAll, newFetchAll);

// Replace searchRoutes
const oldSearchRoutes = `      searchRoutes: async (from, to, date) => {
    try {
      let query = supabase.from('routes').select('*, vehicles(*)');
      if (from) query = query.ilike('from_city', \`%\${from}%\`);
      if (to) query = query.ilike('to_city', \`%\${to}%\`);
      if (date) query = query.eq('journey_date', date);

      const { data, error } = await query;
      if (error) throw error;
      
      const mapped = (data || []).map(mapRoute);
      set({ searchResults: mapped });
      return mapped;
    } catch (err) {
      console.error('Search error:', err);
      set({ searchResults: [] });
      return [];
    }
  },`;

const newSearchRoutes = `      searchRoutes: async (from, to, date) => {
    try {
      let query = supabase.from('routes').select('*');
      if (from) query = query.ilike('from_city', \`%\${from}%\`);
      if (to) query = query.ilike('to_city', \`%\${to}%\`);
      if (date) query = query.eq('journey_date', date);

      const [routesRes, vehiclesRes] = await Promise.all([
        query,
        supabase.from('vehicles').select('*')
      ]);

      if (routesRes.error) throw routesRes.error;
      
      const vehiclesMap = {};
      if (vehiclesRes.data) {
        vehiclesRes.data.forEach(v => {
          vehiclesMap[v.id] = v;
        });
      }
      
      const data = routesRes.data || [];
      data.forEach(r => {
        if (r.vehicle_id && vehiclesMap[r.vehicle_id]) {
          r.vehicles = vehiclesMap[r.vehicle_id];
        }
      });
      
      const mapped = data.map(mapRoute);
      set({ searchResults: mapped });
      return mapped;
    } catch (err) {
      console.error('Search error:', err);
      set({ searchResults: [] });
      return [];
    }
  },`;

content = content.replace(oldSearchRoutes, newSearchRoutes);

// Fix createBooking route lookup
const oldCreateBooking = `const { data: route, error: routeErr } = await supabase.from('routes').select('*, vehicles(*)').eq('id', routeId).single();`;
const newCreateBooking = `const { data: routeData, error: routeErr } = await supabase.from('routes').select('*').eq('id', routeId).single();
      if (routeErr || !routeData) return { error: 'Route not found' };
      
      // manually fetch vehicle
      const { data: vData } = await supabase.from('vehicles').select('*').eq('id', routeData.vehicle_id).single();
      if (vData) routeData.vehicles = vData;
      
      const route = mapRoute(routeData); // Ensure mapped format for price calculation`;

content = content.replace(oldCreateBooking, newCreateBooking);

// In createBooking, route.price is mapped, wait
// The existing code says:
// const calculatePassengerPrice = (ageStr) => {
//   ... return route.price;
// };
// This matches `route.price` perfectly since we now map it!

fs.writeFileSync(storePath, content);
console.log("Updated store.js to bypass join");
