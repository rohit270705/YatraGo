-- =====================================================================
-- YatraGo: Add booking_type and transit_meta columns to bookings table
-- Run this in Supabase SQL Editor BEFORE testing the transit booking flow
-- =====================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'route'
    CHECK (booking_type IN ('route', 'cab', 'flight', 'train', 'ferry')),
  ADD COLUMN IF NOT EXISTS transit_meta JSONB;

-- Index for filtering by booking_type in My Bookings / reports
CREATE INDEX IF NOT EXISTS idx_bookings_type ON public.bookings(booking_type);

COMMENT ON COLUMN public.bookings.booking_type IS 'Discriminator: route | cab | flight | train | ferry';
COMMENT ON COLUMN public.bookings.transit_meta IS 'JSON blob for flight/train/ferry metadata: operator, class, PNR, coach, cabin etc.';
