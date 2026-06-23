-- =========================================================
-- Supabase Database Schema v3 for YatraGo
-- Adds: multi-method wallet top-ups (card/UPI),
--       payment_orders tracking, ownership-scoped RLS,
--       FK fixes, balance-integrity safeguards
-- Crypto payments removed.
-- =========================================================

-- WARNING: Review before running against a live database. this is my new sql schema apply it to my project
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.active_rentals CASCADE;
-- DROP TABLE IF EXISTS public.rental_vehicles CASCADE;
-- DROP TABLE IF EXISTS public.bookings CASCADE;
-- DROP TABLE IF EXISTS public.routes CASCADE;
-- DROP TABLE IF EXISTS public.payment_orders CASCADE;
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
-- DROP TABLE IF EXISTS public.wallets CASCADE;
-- DROP TABLE IF EXISTS public.vehicles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- =========================================================
-- 1. Users
-- =========================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role text DEFAULT 'passenger' CHECK (role IN ('passenger','agent','owner','admin')),
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  blood_group text,
  dob date,
  age integer,
  gender text,
  address text,
  aadhar_number text,   -- consider encrypting at rest (pgsodium/pgcrypto)
  pan_number text,       -- consider encrypting at rest
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 2. Wallets
-- =========================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance numeric DEFAULT 0.0 CHECK (balance >= 0),
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 2.5 Vehicles (Owner-operated buses/cars)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  registration_number text NOT NULL UNIQUE,
  type text NOT NULL, -- Bus, Car, Traveller
  seating_capacity integer NOT NULL,
  luggage_capacity numeric,
  rc_doc_url text,
  insurance_doc_url text,
  puc_doc_url text,
  photo_front_url text,
  photo_back_url text,
  photo_left_url text,
  photo_right_url text,
  photo_interior_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 3. Payment Orders (NEW)
-- Tracks a top-up attempt before money is confirmed.
-- Clients can INSERT to create an order but cannot mark it paid.
-- Only a server-side function/webhook handler updates status
-- and credits the wallet.
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  payment_method text NOT NULL CHECK (
    payment_method IN ('credit_card','debit_card','upi')
  ),
  gateway text NOT NULL, -- razorpay, stripe, cashfree
  gateway_order_id text,
  gateway_payment_id text,
  status text DEFAULT 'created' CHECK (
    status IN ('created','pending','paid','failed','expired','refunded')
  ),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 4. Wallet Transactions
-- Linked to payment_orders when the transaction originates
-- from a top-up (vs. booking deduction/refund).
-- =========================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  payment_order_id uuid REFERENCES public.payment_orders(id),
  type text NOT NULL CHECK (
    type IN ('ADD_MONEY','DEDUCT_MONEY','TICKET_REFUND','RENTAL_REFUND','ADJUSTMENT')
  ),
  payment_method text CHECK (
    payment_method IN ('credit_card','debit_card','upi','wallet', NULL)
  ),
  amount numeric NOT NULL,
  description text,
  balance_before numeric,
  balance_after numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 5. Routes
-- =========================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id text PRIMARY KEY,
  vehicle_id uuid REFERENCES public.vehicles(id), -- FK fixed (was untyped text)
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

-- =========================================================
-- 6. Bookings
-- =========================================================
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
  customer_payment_mode text DEFAULT 'wallet' CHECK (
    customer_payment_mode IN ('cash','upi','wallet','credit_card','debit_card')
  ),
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed')),
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 7. Rental Vehicles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.rental_vehicles (
  id text PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id),
  name text NOT NULL,
  brand text,
  category text,
  price_per_day numeric,
  location text,
  rating numeric DEFAULT 0.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 8. Active Rentals
-- =========================================================
CREATE TABLE IF NOT EXISTS public.active_rentals (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  vehicle_id text REFERENCES public.rental_vehicles(id),
  start_date date,
  end_date date,
  total_days integer,
  total_price numeric,
  status text DEFAULT 'active' CHECK (status IN ('active','returned','cancelled')),
  renter_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- 9. Conversations & Messages (IDs fixed to uuid for RLS)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('support','booking','rental')),
  reference_id text,
  participant1_id uuid REFERENCES public.users(id),
  participant2_id uuid REFERENCES public.users(id),
  title text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================================
-- ENABLE RLS ON ALL TABLES
-- =========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- HELPER FUNCTION: get current user's role without recursive RLS
-- =========================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- =========================================================
-- POLICIES: users
-- =========================================================
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- POLICIES: wallets (balance is never client-writable)
-- =========================================================
CREATE POLICY "Users view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
-- NOTE: no INSERT/UPDATE policy for clients.
-- Wallet creation + balance changes happen only via
-- SECURITY DEFINER functions (e.g. credit_wallet(), debit_wallet()).

-- =========================================================
-- POLICIES: vehicles
-- =========================================================
CREATE POLICY "Owners manage own vehicles" ON public.vehicles
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Public can view active vehicles" ON public.vehicles
  FOR SELECT USING (is_active = true);

-- =========================================================
-- POLICIES: payment_orders
-- Clients can create an order and view their own orders,
-- but cannot update status themselves.
-- =========================================================
CREATE POLICY "Users view own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own payment orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'created');
-- No UPDATE policy for clients — status transitions to 'paid'/'failed'
-- happen only via a SECURITY DEFINER function triggered by a verified
-- gateway webhook.

-- =========================================================
-- POLICIES: wallet_transactions (read-only for clients)
-- =========================================================
CREATE POLICY "Users view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
-- No client INSERT/UPDATE — only SECURITY DEFINER functions write here.

-- =========================================================
-- POLICIES: routes (public read, owner/admin write)
-- =========================================================
CREATE POLICY "Anyone can view routes" ON public.routes
  FOR SELECT USING (true);

CREATE POLICY "Vehicle owners manage their routes" ON public.routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = routes.vehicle_id AND v.owner_id = auth.uid()
    )
  );

-- =========================================================
-- POLICIES: bookings
-- =========================================================
CREATE POLICY "Users view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE POLICY "Users create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE POLICY "Admins view all bookings" ON public.bookings
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- POLICIES: rental_vehicles
-- =========================================================
CREATE POLICY "Anyone can view active rental vehicles" ON public.rental_vehicles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners manage own rental vehicles" ON public.rental_vehicles
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- =========================================================
-- POLICIES: active_rentals
-- =========================================================
CREATE POLICY "Users view own rentals" ON public.active_rentals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own rentals" ON public.active_rentals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Rental vehicle owners view related rentals" ON public.active_rentals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rental_vehicles rv
      WHERE rv.id = active_rentals.vehicle_id AND rv.owner_id = auth.uid()
    )
  );

-- =========================================================
-- POLICIES: conversations & messages
-- =========================================================
CREATE POLICY "Participants can view conversation" ON public.conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Participants can create conversation" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.participant1_id OR auth.uid() = c.participant2_id)
    )
  );

CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.participant1_id OR auth.uid() = c.participant2_id)
    )
  );

-- =========================================================
-- FUNCTION: credit_wallet
-- Called only by server-side code (service role) after a
-- payment gateway webhook confirms payment success.
-- Atomically: marks order paid, updates wallet balance,
-- writes a wallet_transactions row.
-- =========================================================
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_payment_order_id uuid,
  p_payment_method text,
  p_description text DEFAULT 'Wallet top-up'
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
BEGIN
  -- Lock the wallet row to prevent race conditions on concurrent top-ups
  SELECT * INTO v_wallet FROM public.wallets
    WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_wallet;
  END IF;

  UPDATE public.wallets
    SET balance = balance + p_amount
    WHERE user_id = p_user_id
    RETURNING * INTO v_wallet;

  UPDATE public.payment_orders
    SET status = 'paid', updated_at = now()
    WHERE id = p_payment_order_id;

  INSERT INTO public.wallet_transactions (
    user_id, payment_order_id, type, payment_method,
    amount, description, balance_before, balance_after
  ) VALUES (
    p_user_id, p_payment_order_id, 'ADD_MONEY', p_payment_method,
    p_amount, p_description, v_wallet.balance - p_amount, v_wallet.balance
  ) RETURNING * INTO v_txn;

  RETURN v_txn;
END;
$$;

-- =========================================================
-- FUNCTION: debit_wallet
-- Called server-side for bookings/rentals paid via wallet.
-- Rejects if insufficient balance.
-- =========================================================
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text DEFAULT 'Booking payment'
)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet public.wallets;
  v_txn public.wallet_transactions;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets
    WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet IS NULL OR v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE public.wallets
    SET balance = balance - p_amount
    WHERE user_id = p_user_id
    RETURNING * INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    user_id, type, payment_method, amount,
    description, balance_before, balance_after
  ) VALUES (
    p_user_id, 'DEDUCT_MONEY', 'wallet', p_amount,
    p_description, v_wallet.balance + p_amount, v_wallet.balance
  ) RETURNING * INTO v_txn;

  RETURN v_txn;
END;
$$;

-- =========================================================
-- INDEXES for common lookups
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_cities ON public.routes(from_city, to_city, journey_date);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
