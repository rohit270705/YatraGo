-- =============================================================
-- YatraGo Database Schema v4 — Additive Migration
-- Adds: train_class_options, gst_rates config,
--       quota/GST columns on bookings
--
-- SAFE TO RUN on an existing v3 database — uses IF NOT EXISTS
-- and ADD COLUMN IF NOT EXISTS throughout.
-- Does NOT drop or truncate any existing data.
-- =============================================================

-- =============================================================
-- 1. train_listings
--    Separates the train-level identity from class options.
--    (Front-end currently uses in-memory seed; this table is
--     DB-ready for future Supabase migration.)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.train_listings (
  id           text PRIMARY KEY,       -- e.g. 'tr-01'
  train_number text NOT NULL,          -- e.g. '12123'
  train_name   text NOT NULL,          -- e.g. 'Deccan Queen'
  from_city    text NOT NULL,
  to_city      text NOT NULL,
  depart_time  text,                   -- 'HH:MM' string
  arrive_time  text,
  duration     text,
  journey_date date,
  mode         text DEFAULT 'train',
  created_at   timestamp with time zone DEFAULT now()
);

ALTER TABLE public.train_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view train listings" ON public.train_listings;
CREATE POLICY "Anyone can view train listings" ON public.train_listings
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_train_listings_cities
  ON public.train_listings (from_city, to_city);

-- =============================================================
-- 2. train_class_options
--    One row per (train × class). Price, availability, status
--    live here — not on the parent train_listings row.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.train_class_options (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  train_listing_id text REFERENCES public.train_listings(id) ON DELETE CASCADE,
  class_code       text NOT NULL CHECK (class_code IN ('GN','SL','3A','3E','2A','1A','CC','EC')),
  class_label      text NOT NULL,  -- human-readable label
  price            numeric NOT NULL CHECK (price > 0),
  seats_left       integer DEFAULT 0,
  status           text DEFAULT 'Available' CHECK (status IN ('Available','RAC','Waitlist')),
  created_at       timestamp with time zone DEFAULT now()
);

ALTER TABLE public.train_class_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view train class options" ON public.train_class_options;
CREATE POLICY "Anyone can view train class options" ON public.train_class_options
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_train_class_options_listing
  ON public.train_class_options (train_listing_id);

-- =============================================================
-- 3. gst_rates — config table
--    ⚠️  VERIFY ALL RATES AGAINST CURRENT CBIC NOTIFICATIONS
--        AND IRCTC/DGCA CIRCULARS BEFORE PRODUCTION USE.
--    Rates can be corrected via UPDATE without a redeploy.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.gst_rates (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transport_mode text NOT NULL CHECK (transport_mode IN ('train','flight','ferry','bus')),
  class_code     text,        -- NULL = mode-level fallback (applies to all classes not explicitly listed)
  gst_percent    numeric NOT NULL DEFAULT 0,
  is_exempt      boolean NOT NULL DEFAULT false,
  note           text,        -- human-readable regulatory reference
  created_at     timestamp with time zone DEFAULT now()
);

-- Unique constraint: one rate per (mode, class_code) pair.
-- Uses a named CONSTRAINT so ON CONFLICT can reference it cleanly.
-- The DO block is idempotent — safe to re-run if the constraint already exists.
DO $$ BEGIN
  ALTER TABLE public.gst_rates
    ADD CONSTRAINT uq_gst_rates_mode_class UNIQUE (transport_mode, class_code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.gst_rates ENABLE ROW LEVEL SECURITY;

-- GST rates are public reference data — anyone can read
DROP POLICY IF EXISTS "Anyone can view gst rates" ON public.gst_rates;
CREATE POLICY "Anyone can view gst rates" ON public.gst_rates
  FOR SELECT USING (true);

-- Only admins (service role) can modify rates
-- (No client-side INSERT/UPDATE policy; updates done via Supabase dashboard or migration)

-- =============================================================
-- 4. Seed: train_listings
-- =============================================================
INSERT INTO public.train_listings
  (id, train_number, train_name, from_city, to_city, depart_time, arrive_time, duration, mode)
VALUES
  ('tr-01', '12123', 'Deccan Queen',          'Mumbai',    'Pune',       '07:15', '10:25', '3h 10m', 'train'),
  ('tr-05', '12007', 'Shatabdi Express',       'Chennai',   'Bangalore',  '06:00', '10:30', '4h 30m', 'train'),
  ('tr-07', '12903', 'Golden Temple Mail',     'Delhi',     'Amritsar',   '21:35', '05:50', '8h 15m', 'train'),
  ('tr-08', '12301', 'Rajdhani Express',       'Kolkata',   'Delhi',      '16:50', '10:00', '17h 10m','train'),
  ('tr-03', '12902', 'Gujarat Mail',           'Mumbai',    'Ahmedabad',  '21:25', '05:10', '7h 45m', 'train')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 5. Seed: train_class_options
--    ⚠️  Prices are indicative demo values.
--        Verify against current IRCTC base fares before production.
-- =============================================================
INSERT INTO public.train_class_options
  (train_listing_id, class_code, class_label, price, seats_left, status)
VALUES
  -- Deccan Queen (Mumbai→Pune): day train, GN + SL + CC
  ('tr-01', 'GN', 'General (Unreserved)', 85,   120, 'Available'),
  ('tr-01', 'SL', 'Sleeper',             145,    42, 'Available'),
  ('tr-01', 'CC', 'AC Chair Car',        430,    18, 'Available'),

  -- Shatabdi Express (Chennai→Bangalore): chair-car only
  ('tr-05', 'CC', 'AC Chair Car',        695,    35, 'Available'),
  ('tr-05', 'EC', 'Executive Chair Car', 1380,    8, 'Available'),

  -- Golden Temple Mail (Delhi→Amritsar): overnight, GN to 2A
  ('tr-07', 'GN', 'General (Unreserved)', 120,  200, 'Available'),
  ('tr-07', 'SL', 'Sleeper',             290,    61, 'Available'),
  ('tr-07', 'SL', 'Sleeper',             290,     0, 'Waitlist'),  -- second SL coach waitlisted
  ('tr-07', '3A', 'AC 3 Tier',           920,    14, 'Available'),
  ('tr-07', '2A', 'AC 2 Tier',          1340,     4, 'RAC'),

  -- Rajdhani Express (Kolkata→Delhi): AC-only flagship
  ('tr-08', '3A', 'AC 3 Tier',          1620,    22, 'Available'),
  ('tr-08', '2A', 'AC 2 Tier',          2280,     9, 'Available'),
  ('tr-08', '1A', 'AC First Class',     3840,     3, 'RAC'),

  -- Gujarat Mail (Mumbai→Ahmedabad): SL to 1A
  ('tr-03', 'SL', 'Sleeper',             275,    58, 'Available'),
  ('tr-03', '3A', 'AC 3 Tier',           775,    31, 'Available'),
  ('tr-03', '2A', 'AC 2 Tier',          1150,    11, 'Available'),
  ('tr-03', '1A', 'AC First Class',     1940,     2, 'RAC')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 6. Seed: gst_rates
--    ⚠️  VERIFY BEFORE PRODUCTION — see note column for reference.
--    All rates as of 2024-25 reference.
--    Update via: UPDATE public.gst_rates SET gst_percent = <N>
--                WHERE transport_mode = '<mode>' AND class_code = '<code>';
-- =============================================================
INSERT INTO public.gst_rates (transport_mode, class_code, gst_percent, is_exempt, note)
VALUES
  -- RAIL — Non-AC / Unreserved: EXEMPT
  ('train', 'GN', 0,  true,  'General/Unreserved — no GST (exempt). Ref: CBIC Notification 12/2017-CT(Rate) Sl.8'),
  ('train', 'SL', 0,  true,  'Sleeper Class — non-AC, no GST (exempt). Ref: same notification'),

  -- RAIL — AC classes: 5% (CGST 2.5% + SGST 2.5% or IGST 5%)
  --  Ref: CBIC Notification 11/2017-CT(Rate) Sl.No.52A as amended
  --  ⚠️  Rate/notification may have changed — verify current circular.
  ('train', '3A', 5,  false, 'AC 3 Tier — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.'),
  ('train', '3E', 5,  false, 'AC 3 Economy — 5% GST. Same treatment as 3A. VERIFY.'),
  ('train', '2A', 5,  false, 'AC 2 Tier — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.'),
  ('train', '1A', 5,  false, 'AC First Class — 5% GST. Ref: CBIC Notif 11/2017-CT(Rate) Sl.52A. VERIFY.'),
  ('train', 'CC', 5,  false, 'AC Chair Car — 5% GST. Same AC class treatment. VERIFY.'),
  ('train', 'EC', 5,  false, 'Executive Chair Car — 5% GST. Same AC class treatment. VERIFY.'),

  -- FLIGHT — Economy: 5%; Business/Premium Economy: 12%
  --  Ref: CBIC Notification 8/2017-Integrated Tax (Rate)
  --  ⚠️  Verify current rate — may be updated since original notification.
  ('flight', 'Economy',         5,  false, 'Domestic air Economy — 5% GST. Ref: CBIC Notif 8/2017-IT(Rate). VERIFY.'),
  ('flight', 'Premium Economy', 12, false, 'Domestic air Premium Economy — 12% GST. Ref: same notification. VERIFY.'),
  ('flight', 'Business',        12, false, 'Domestic air Business class — 12% GST. Ref: same notification. VERIFY.'),

  -- FERRY — local/river: typically exempt; inter-island/cruise: 5%
  --  ⚠️  Ferry GST is complex — verify vessel classification & GT tonnage exemptions.
  ('ferry', 'Local Ferry',           0, true,  'Local passenger ferry — typically exempt (small vessel). VERIFY current notification.'),
  ('ferry', 'River Cruise',          0, true,  'River cruise — typically exempt per vessel classification. VERIFY.'),
  ('ferry', 'Inter-Island',          5, false, 'Inter-island passenger service — 5% indicative. VERIFY.'),
  ('ferry', 'Luxury Cruise',         5, false, 'Luxury cruise vessel — 5% indicative. VERIFY.'),
  ('ferry', 'Overnight Cruise Ferry',5, false, 'Overnight cruise ferry — 5% indicative. VERIFY.'),

  -- BUS / ROAD (routes table) — Non-AC exempt; AC 5%
  --  ⚠️  AC contract carriage classification — verify with transport lawyer.
  ('bus', 'Non-AC', 0, true,  'Non-AC contract carriage — typically exempt. VERIFY.'),
  ('bus', 'AC',     5, false, 'AC contract carriage — 5% GST indicative. VERIFY.')

ON CONFLICT (transport_mode, class_code) DO UPDATE
  SET note = EXCLUDED.note;  -- safe re-run: updates notes but never overwrites manually set rates

-- =============================================================
-- 7. Extend bookings table with quota, GST invoice columns
--    All additive — existing rows get defaults.
-- =============================================================
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS quota              text DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS berth_preference   text,                     -- Lower/Middle/Upper/Side Lower/Side Upper
  ADD COLUMN IF NOT EXISTS is_business_invoice boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_gstin     text,                     -- 15-char GSTIN, nullable
  ADD COLUMN IF NOT EXISTS customer_legal_name text,
  ADD COLUMN IF NOT EXISTS base_fare          numeric,                  -- pre-GST total
  ADD COLUMN IF NOT EXISTS gst_amount         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_rate_percent   numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yatrago_gstin      text DEFAULT '27AXXXX1234X1ZX',  -- PLACEHOLDER — update before production
  ADD COLUMN IF NOT EXISTS place_of_supply    text;                    -- 2-digit state code derived from customer GSTIN

-- =============================================================
-- 8. Indexes for new columns
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_quota ON public.bookings (quota);

-- =============================================================
-- END OF v4 MIGRATION
-- =============================================================
