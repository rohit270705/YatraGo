-- =========================================================
-- YatraGo Role & Auth Comprehensive Fix Migration v3
-- Fixes text vs uuid type mismatch errors.
-- Safe to run on existing database.
-- Run in Supabase SQL Editor → New Query → Run
-- =========================================================

-- =========================================================
-- 1. Fix users.role CHECK constraint to include 'driver'
-- =========================================================
DO $$
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('passenger','agent','owner','admin','driver'));

-- =========================================================
-- 2. Ensure driver_profiles table exists and has all needed columns
--    Uses text-safe approach: id stored as uuid (matches auth.uid())
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  name text,
  age integer,
  blood_group text,
  license_number text,
  license_validity timestamp with time zone,
  license_photo_url text,
  has_own_vehicle boolean DEFAULT false,
  license_category text,
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT true,
  rating numeric DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT now()
);

-- Safely add columns that may be missing from a pre-existing table
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_validity timestamp with time zone;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_photo_url text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS has_own_vehicle boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_category text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0.0;

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all old policies first to avoid conflicts
DROP POLICY IF EXISTS "Drivers view own profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Drivers update own profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Drivers insert own profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Owners can view driver profiles" ON public.driver_profiles;

-- Recreate with explicit uuid cast to handle both uuid and text id columns
CREATE POLICY "Drivers view own profile" ON public.driver_profiles
  FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "Drivers update own profile" ON public.driver_profiles
  FOR UPDATE USING (id::text = auth.uid()::text);

CREATE POLICY "Drivers insert own profile" ON public.driver_profiles
  FOR INSERT WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "Owners can view driver profiles" ON public.driver_profiles
  FOR SELECT USING (
    public.current_user_role() IN ('owner', 'admin')
    OR is_available = true
  );

-- =========================================================
-- 3. Create driver_owner_link table if it doesn't exist
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_owner_link (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id text,
  owner_id text,
  relationship_type text DEFAULT 'employed' CHECK (relationship_type IN ('employed','freelance')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','terminated')),
  created_at timestamp with time zone DEFAULT now()
);

-- Add columns safely if table already exists
ALTER TABLE public.driver_owner_link ADD COLUMN IF NOT EXISTS driver_id text;
ALTER TABLE public.driver_owner_link ADD COLUMN IF NOT EXISTS owner_id text;
ALTER TABLE public.driver_owner_link ADD COLUMN IF NOT EXISTS relationship_type text DEFAULT 'employed';
ALTER TABLE public.driver_owner_link ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

ALTER TABLE public.driver_owner_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers and owners view their links" ON public.driver_owner_link;
CREATE POLICY "Drivers and owners view their links" ON public.driver_owner_link
  FOR SELECT USING (
    driver_id::text = auth.uid()::text
    OR owner_id::text = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners create link requests" ON public.driver_owner_link;
CREATE POLICY "Owners create link requests" ON public.driver_owner_link
  FOR INSERT WITH CHECK (owner_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Drivers and owners update link status" ON public.driver_owner_link;
CREATE POLICY "Drivers and owners update link status" ON public.driver_owner_link
  FOR UPDATE USING (
    driver_id::text = auth.uid()::text
    OR owner_id::text = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins view all driver links" ON public.driver_owner_link;
CREATE POLICY "Admins view all driver links" ON public.driver_owner_link
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- 4. Create driver_route_rate table if it doesn't exist
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_route_rate (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id text,
  from_city text NOT NULL,
  to_city text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  vehicle_details text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add columns safely
ALTER TABLE public.driver_route_rate ADD COLUMN IF NOT EXISTS driver_id text;
ALTER TABLE public.driver_route_rate ADD COLUMN IF NOT EXISTS from_city text;
ALTER TABLE public.driver_route_rate ADD COLUMN IF NOT EXISTS to_city text;
ALTER TABLE public.driver_route_rate ADD COLUMN IF NOT EXISTS rate numeric;
ALTER TABLE public.driver_route_rate ADD COLUMN IF NOT EXISTS vehicle_details text;

ALTER TABLE public.driver_route_rate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers manage own rates" ON public.driver_route_rate;
CREATE POLICY "Drivers manage own rates" ON public.driver_route_rate
  FOR ALL
  USING (driver_id::text = auth.uid()::text)
  WITH CHECK (driver_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view driver rates" ON public.driver_route_rate;
CREATE POLICY "Anyone can view driver rates" ON public.driver_route_rate
  FOR SELECT USING (true);

-- =========================================================
-- 5. Fix bookings RLS — owner approve/reject + admin full access
-- =========================================================
DROP POLICY IF EXISTS "Owners view bookings for their vehicles" ON public.bookings;
CREATE POLICY "Owners view bookings for their vehicles" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.owner_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Owners update bookings for their vehicles" ON public.bookings;
CREATE POLICY "Owners update bookings for their vehicles" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.owner_id::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users update own bookings" ON public.bookings;
CREATE POLICY "Users update own bookings" ON public.bookings
  FOR UPDATE USING (
    user_id::text = auth.uid()::text
    OR agent_id::text = auth.uid()::text
  );

-- =========================================================
-- 6. Fix bookings status CHECK to include all app statuses
-- =========================================================
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'confirmed',
    'cancelled',
    'completed',
    'pending_owner_approval',
    'approved_awaiting_payment',
    'rejected_by_owner',
    'in_progress',
    'pending_driver'
  ));

-- =========================================================
-- 7. Fix vehicles RLS — admin full access
-- =========================================================
DROP POLICY IF EXISTS "Admins manage all vehicles" ON public.vehicles;
CREATE POLICY "Admins manage all vehicles" ON public.vehicles
  FOR ALL USING (public.current_user_role() = 'admin');

-- =========================================================
-- 8. Create withdrawals table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  bank_account text NOT NULL,
  ifsc_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  requested_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  admin_note text
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users create own withdrawals" ON public.withdrawals;
CREATE POLICY "Users create own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins manage all withdrawals" ON public.withdrawals
  FOR ALL USING (public.current_user_role() = 'admin');

-- =========================================================
-- 9. Fix wallet RLS — client-side wallet ops
-- =========================================================
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
CREATE POLICY "Users update own wallet" ON public.wallets
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "System can insert wallets" ON public.wallets;
CREATE POLICY "System can insert wallets" ON public.wallets
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users insert own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users insert own wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admins view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins view all wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- 10. Performance indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- =========================================================
-- DONE
-- =========================================================
SELECT 'YatraGo Role & Auth migration v3 applied successfully.' AS result;
