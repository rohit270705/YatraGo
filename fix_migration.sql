-- ============================================================
-- YatraGo — Fix Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- FIX 1: vehicles table mein missing columns add karo
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_name text,
  ADD COLUMN IF NOT EXISTS variant text,
  ADD COLUMN IF NOT EXISTS fuel_type text,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS documents_submitted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rc_number text,
  ADD COLUMN IF NOT EXISTS rc_photo_url text,
  ADD COLUMN IF NOT EXISTS puc_number text,
  ADD COLUMN IF NOT EXISTS puc_valid_until date,
  ADD COLUMN IF NOT EXISTS puc_photo_url text,
  ADD COLUMN IF NOT EXISTS dl_number text,
  ADD COLUMN IF NOT EXISTS dl_holder_name text,
  ADD COLUMN IF NOT EXISTS dl_valid_until date,
  ADD COLUMN IF NOT EXISTS dl_photo_url text,
  ADD COLUMN IF NOT EXISTS owner_name text;

-- is_verified ko approved ke saath sync karo
UPDATE public.vehicles SET approved = is_verified WHERE approved IS NULL;

-- FIX 2: notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  reference_type text,
  reference_id text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Allow public read/write for dev'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public read/write for dev" ON public.notifications FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- FIX 3: parcels table
CREATE TABLE IF NOT EXISTS public.parcels (
  id text PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  sender_name text,
  sender_phone text,
  receiver_name text,
  receiver_phone text,
  pickup_address text,
  dropoff_address text,
  weight_kg numeric,
  description text,
  price numeric,
  status text DEFAULT 'booked',
  tracking_updates jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parcels' AND policyname = 'Allow public read/write for dev'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow public read/write for dev" ON public.parcels FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Verify: sabhi tables check karo
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
