-- Supabase Database Schema Initialization for YatraGo

-- Drop existing tables if they exist to prevent "already exists" errors
-- WARNING: These have been commented out to prevent accidental deletion of live data!
-- DROP TABLE IF EXISTS public.active_rentals CASCADE;
-- DROP TABLE IF EXISTS public.rental_vehicles CASCADE;
-- DROP TABLE IF EXISTS public.bookings CASCADE;
-- DROP TABLE IF EXISTS public.routes CASCADE;
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
-- DROP TABLE IF EXISTS public.wallets CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role text DEFAULT 'passenger', -- passenger, agent, owner, admin
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  blood_group text,
  dob date,
  age integer,
  gender text,
  address text,
  aadhar_number text,
  pan_number text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- ADD_MONEY, DEDUCT_MONEY, TICKET_REFUND
  amount numeric NOT NULL,
  description text,
  balance_before numeric,
  balance_after numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Routes (Buses/Travels) Table
CREATE TABLE IF NOT EXISTS public.routes (
  id text PRIMARY KEY,
  vehicle_id text,
  from_city text NOT NULL,
  to_city text NOT NULL,
  stops text[] DEFAULT '{}',
  departure_time time,
  arrival_time time,
  journey_date date,
  price numeric,
  available_seats integer,
  luggage_available numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  route_id text REFERENCES public.routes(id),
  passenger_details jsonb NOT NULL,
  luggage_kg numeric DEFAULT 0,
  extra_luggage_cost numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  commission_amount numeric DEFAULT 0,
  is_agent_booking boolean DEFAULT false,
  agent_id uuid REFERENCES public.users(id),
  customer_payment_mode text DEFAULT 'wallet', -- cash, upi, wallet
  status text DEFAULT 'confirmed', -- confirmed, cancelled, completed
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Rental Vehicles Table
CREATE TABLE IF NOT EXISTS public.rental_vehicles (
  id text PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id),
  name text NOT NULL,
  brand text,
  category text, -- bike, scooty, etc.
  price_per_day numeric,
  location text,
  rating numeric DEFAULT 0.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Active Rentals Table
CREATE TABLE IF NOT EXISTS public.active_rentals (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  vehicle_id text REFERENCES public.rental_vehicles(id),
  start_date date,
  end_date date,
  total_days integer,
  total_price numeric,
  status text DEFAULT 'active', -- active, returned, cancelled
  renter_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_rentals ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allow all for development, restrict later)
CREATE POLICY "Allow public read/write for dev" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.routes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.rental_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.active_rentals FOR ALL USING (true) WITH CHECK (true);

-- 8. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id text PRIMARY KEY,
  type text NOT NULL, -- support, booking, rental
  reference_id text,
  participant1_id text NOT NULL,
  participant2_id text NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY,
  conversation_id text REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for dev" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for dev" ON public.messages FOR ALL USING (true) WITH CHECK (true);
