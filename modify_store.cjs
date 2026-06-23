const fs = require('fs');
let content = fs.readFileSync('src/store.js', 'utf8');

// Replace searchRoutes
const searchRoutesOld = /searchRoutes: \(from, to, date\) => \{[\s\S]*?return results;\s*\},/m;
const searchRoutesNew = `searchRoutes: async (from, to, date) => {
    try {
      let query = supabase.from('routes').select('*, vehicles(*)');
      if (from) query = query.ilike('from_city', \`%\${from}%\`);
      if (to) query = query.ilike('to_city', \`%\${to}%\`);
      if (date) query = query.eq('journey_date', date);

      const { data, error } = await query;
      if (error) throw error;
      
      set({ searchResults: data || [] });
      return data || [];
    } catch (err) {
      console.error('Search error:', err);
      set({ searchResults: [] });
      return [];
    }
  },`;
content = content.replace(searchRoutesOld, searchRoutesNew);

// Replace createBooking
const createBookingOld = /createBooking: async \(routeId[\s\S]*?return localBooking;[\s\S]*?\},/m;
const createBookingNew = `createBooking: async (routeId, passengers, totalLuggageKg, isAgentBooking = false, agentId = null, customerPaymentMode = 'wallet') => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return { error: 'Not authenticated' };

      // Fetch the real route
      const { data: route, error: routeErr } = await supabase.from('routes').select('*, vehicles(*)').eq('id', routeId).single();
      if (routeErr || !route) return { error: 'Route not found' };

      const calculatePassengerPrice = (ageStr) => {
        const age = parseInt(ageStr) || 0;
        if (age > 0 && age <= 5) return 0;
        if (age >= 6 && age <= 7) return Math.round(route.price / 2);
        return route.price;
      };

      const totalTicketPrice = passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.age), 0);
      const freeLuggageLimit = passengers.length * 15;
      const extraLuggage = Math.max(0, totalLuggageKg - freeLuggageLimit);
      const luggageCost = extraLuggage * 10;
      let totalAmount = totalTicketPrice + luggageCost;

      let commissionAmount = 0;
      if (isAgentBooking) {
        commissionAmount = Math.round(totalAmount * 0.05);
        totalAmount += commissionAmount;
      }

      const { data: booking, error: insertError } = await supabase.from('bookings').insert([{
        id: 'BK-' + uuidv4().slice(0, 8).toUpperCase(),
        user_id: user.id,
        route_id: routeId,
        passenger_details: passengers,
        luggage_kg: totalLuggageKg,
        extra_luggage_cost: luggageCost,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        is_agent_booking: isAgentBooking,
        agent_id: agentId,
        status: 'pending_owner_approval'
      }]).select().single();

      if (insertError) throw insertError;

      const { bookings } = get();
      set({ bookings: [booking, ...bookings] });
      return booking;
    } catch (err) {
      console.error('Booking error:', err);
      return { error: 'Booking failed. Please try again.' };
    }
  },`;
content = content.replace(createBookingOld, createBookingNew);

// fetchAllRoutes addition
const storeEnd = content.indexOf('searchRoutes: async');
if (storeEnd !== -1 && !content.includes('fetchAllRoutes: async')) {
  content = content.slice(0, storeEnd) + 
  `fetchAllRoutes: async () => {
    try {
      const { data, error } = await supabase.from('routes').select('*, vehicles(*)');
      if (!error && data) set({ routes: data });
    } catch(err) {}
  },\n      ` + content.slice(storeEnd);
}

fs.writeFileSync('src/store.js', content);
console.log('Done modifying booking actions');
