-- =========================================================
-- YatraGo Database Seed Script
-- Populates the live Supabase database with dummy testing data
-- =========================================================

-- 1. Seed Users
INSERT INTO public.users (id, email, name, phone, role, email_verified, phone_verified)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'owner1@yatrago.com', 'Rajesh Kumar', '+91 9876543210', 'owner', true, true),
  ('11111111-1111-1111-1111-222222222222', 'owner2@yatrago.com', 'Priya Sharma', '+91 9876543211', 'owner', true, true),
  ('11111111-1111-1111-1111-333333333333', 'agent1@yatrago.com', 'Vikram Singh', '+91 9876543212', 'agent', true, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Wallets
INSERT INTO public.wallets (id, user_id, balance)
VALUES 
  ('44444444-4444-4444-4444-111111111111', '11111111-1111-1111-1111-111111111111', 10000.0),
  ('44444444-4444-4444-4444-222222222222', '11111111-1111-1111-1111-222222222222', 5000.0),
  ('44444444-4444-4444-4444-333333333333', '11111111-1111-1111-1111-333333333333', 15000.0)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Vehicles
INSERT INTO public.vehicles (id, owner_id, owner_name, registration_number, type, seating_capacity, luggage_capacity)
VALUES
  ('22222222-2222-2222-2222-111111111111', '11111111-1111-1111-1111-111111111111', 'Rajesh Kumar', 'MH-12-SEED-1111', 'SUV', 7, 60),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-222222222222', 'Priya Sharma', 'MH-04-SEED-2222', 'Sedan', 4, 35),
  ('22222222-2222-2222-2222-333333333333', '11111111-1111-1111-1111-111111111111', 'Rajesh Kumar', 'DL-01-SEED-3333', 'Bus', 40, 200)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Routes
INSERT INTO public.routes (id, vehicle_id, from_city, to_city, stops, departure_time, arrival_time, journey_date, price, available_seats, luggage_available)
VALUES
  ('r1', '22222222-2222-2222-2222-111111111111', 'Mumbai', 'Pune', ARRAY['Lonavala', 'Khandala'], '06:00', '10:00', '2026-06-15', 650, 4, 30),
  ('r2', '22222222-2222-2222-2222-222222222222', 'Pune', 'Mumbai', ARRAY['Khandala'], '08:00', '11:30', '2026-06-15', 550, 2, 15),
  ('r3', '22222222-2222-2222-2222-111111111111', 'Mumbai', 'Goa', ARRAY['Pune', 'Kolhapur', 'Belgaum'], '22:00', '08:00', '2026-06-16', 1200, 5, 40),
  ('r4', '22222222-2222-2222-2222-333333333333', 'Delhi', 'Jaipur', ARRAY['Gurgaon', 'Neemrana', 'Behror'], '06:30', '12:00', '2026-06-15', 700, 28, 150),
  ('r5', '22222222-2222-2222-2222-222222222222', 'Mumbai', 'Nashik', ARRAY['Kasara', 'Igatpuri'], '09:00', '12:30', '2026-06-17', 500, 3, 20)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Rental Vehicles
INSERT INTO public.rental_vehicles (id, owner_id, name, brand, category, price_per_day, location, rating, is_active)
VALUES
  ('rv1', '11111111-1111-1111-1111-111111111111', 'Honda Activa 6G', 'Honda', 'scooty', 400, 'Mumbai Central', 4.5, true),
  ('rv2', '11111111-1111-1111-1111-222222222222', 'Royal Enfield Classic 350', 'Royal Enfield', 'bike', 800, 'Koregaon Park, Pune', 4.8, true),
  ('rv3', '11111111-1111-1111-1111-111111111111', 'Maruti Suzuki Swift', 'Maruti', 'car', 1500, 'Andheri West, Mumbai', 4.6, true)
ON CONFLICT (id) DO NOTHING;

