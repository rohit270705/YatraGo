-- =====================================================================
-- YatraGo: Transit Listings Table (Flights / Trains / Ferries)
-- Run this script in Supabase SQL Editor
-- =====================================================================

-- This table is the schema for future real API data.
-- Demo/dummy data lives in the JS seed files (FlightsPage, TrainsPage, FerriesPage).
-- When real APIs are integrated, insert rows here and remove the JS constants.

CREATE TABLE IF NOT EXISTS public.transit_listings (
  id            UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  mode          TEXT       NOT NULL CHECK (mode IN ('flight', 'train', 'ferry')),
  from_city     TEXT       NOT NULL,
  to_city       TEXT       NOT NULL,
  operator      TEXT       NOT NULL,
  op_code       TEXT,                          -- flight#, train#, vessel name
  depart_time   TEXT       NOT NULL,
  arrive_time   TEXT,
  duration      TEXT       NOT NULL,
  travel_class  TEXT,                          -- Economy / Sleeper / Luxury Cruise etc.
  listing_type  TEXT,                          -- for ferries: Local Ferry / Inter-Island etc.
  price         INTEGER    NOT NULL,
  seats_left    INTEGER    DEFAULT 0,
  status        TEXT       DEFAULT 'Available',
  is_demo_data  BOOLEAN    DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transit_listings_mode ON public.transit_listings(mode);
CREATE INDEX IF NOT EXISTS idx_transit_listings_route ON public.transit_listings(from_city, to_city);

ALTER TABLE public.transit_listings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read listings
DROP POLICY IF EXISTS "transit_listings_select" ON public.transit_listings;
CREATE POLICY "transit_listings_select" ON public.transit_listings
  FOR SELECT USING (TRUE);

-- Only service-role (admin) can insert/update/delete
-- (Regular users book via bookings table, not by writing to listings)
