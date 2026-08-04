-- =========================================================
-- YatraGo Role & Auth Comprehensive Fix Migration
-- Safe to run on existing database (uses IF NOT EXISTS / IF EXISTS guards)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New Query
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
-- 2. Create driver_profiles table if it doesn't exist
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer,
  blood_group text,
  license_number text UNIQUE,
  license_validity timestamp with time zone,
  license_photo_url text,
  has_own_vehicle boolean DEFAULT false,
  license_category text,
  is_verified boolean DEFAULT false,
  is_available boolean DEFAULT true,
  rating numeric DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT now()
);

-- Safely add any columns that may be missing from a pre-existing driver_profiles table
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_validity timestamp with time zone;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_photo_url text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS has_own_vehicle boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS license_category text;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.driver_profiles ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0.0;

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers view own profile" ON public.driver_profiles;
CREATE POLICY "Drivers view own profile" ON public.driver_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers update own profile" ON public.driver_profiles;
CREATE POLICY "Drivers update own profile" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers insert own profile" ON public.driver_profiles;
CREATE POLICY "Drivers insert own profile" ON public.driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can view driver profiles" ON public.driver_profiles;
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
  driver_id uuid REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'employed' CHECK (relationship_type IN ('employed','freelance')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','terminated')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (driver_id, owner_id)
);

ALTER TABLE public.driver_owner_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers and owners view their links" ON public.driver_owner_link;
CREATE POLICY "Drivers and owners view their links" ON public.driver_owner_link
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners create link requests" ON public.driver_owner_link;
CREATE POLICY "Owners create link requests" ON public.driver_owner_link
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Drivers and owners update link status" ON public.driver_owner_link;
CREATE POLICY "Drivers and owners update link status" ON public.driver_owner_link
  FOR UPDATE USING (auth.uid() = driver_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins view all driver links" ON public.driver_owner_link;
CREATE POLICY "Admins view all driver links" ON public.driver_owner_link
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- 4. Create driver_route_rate table if it doesn't exist
-- =========================================================
CREATE TABLE IF NOT EXISTS public.driver_route_rate (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  from_city text NOT NULL,
  to_city text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  vehicle_details text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.driver_route_rate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers manage own rates" ON public.driver_route_rate;
CREATE POLICY "Drivers manage own rates" ON public.driver_route_rate
  FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Anyone can view driver rates" ON public.driver_route_rate;
CREATE POLICY "Anyone can view driver rates" ON public.driver_route_rate
  FOR SELECT USING (true);

-- =========================================================
-- 5. Fix bookings RLS — add owner and admin policies
-- =========================================================
DROP POLICY IF EXISTS "Owners view bookings for their vehicles" ON public.bookings;
CREATE POLICY "Owners view bookings for their vehicles" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update bookings for their vehicles" ON public.bookings;
CREATE POLICY "Owners update bookings for their vehicles" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users update own bookings" ON public.bookings;
CREATE POLICY "Users update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- =========================================================
-- 6. Fix bookings status CHECK constraint to include all app statuses
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
-- 7. Fix vehicles RLS — admin can view/manage all vehicles
-- =========================================================
DROP POLICY IF EXISTS "Admins manage all vehicles" ON public.vehicles;
CREATE POLICY "Admins manage all vehicles" ON public.vehicles
  FOR ALL USING (public.current_user_role() = 'admin');

-- =========================================================
-- 8. Create withdrawals table if it doesn't exist
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
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own withdrawals" ON public.withdrawals;
CREATE POLICY "Users create own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins manage all withdrawals" ON public.withdrawals
  FOR ALL USING (public.current_user_role() = 'admin');

-- =========================================================
-- 9. Fix wallet RLS — allow client-side wallet ops until real gateway
-- =========================================================
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
CREATE POLICY "Users update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert wallets" ON public.wallets;
CREATE POLICY "System can insert wallets" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users insert own wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins view all wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (public.current_user_role() = 'admin');

-- =========================================================
-- 10. Add missing performance indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license ON public.driver_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_owner_link_owner ON public.driver_owner_link(owner_id);
CREATE INDEX IF NOT EXISTS idx_driver_owner_link_driver ON public.driver_owner_link(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_route_rate_driver ON public.driver_route_rate(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- =========================================================
-- DONE
-- =========================================================
SELECT 'YatraGo Role & Auth migration v2 applied successfully.' AS result;
