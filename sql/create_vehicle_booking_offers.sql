-- Create vehicle_booking_offers table for Module 17 direct vehicle negotiation
CREATE TABLE IF NOT EXISTS public.vehicle_booking_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  passenger_id TEXT NOT NULL,
  route_from TEXT NOT NULL,
  route_to TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  system_estimated_price NUMERIC NOT NULL,
  proposed_price NUMERIC NOT NULL,
  wants_driver BOOLEAN DEFAULT false,
  driver_id TEXT NULL,
  status TEXT DEFAULT 'pending',
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vehicle_booking_offers_vehicle_status ON public.vehicle_booking_offers(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_booking_offers_passenger_id ON public.vehicle_booking_offers(passenger_id);
ALTER TABLE IF EXISTS public.vehicle_booking_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage vehicle booking offers" ON public.vehicle_booking_offers;
CREATE POLICY "Users can manage vehicle booking offers" ON public.vehicle_booking_offers FOR ALL USING (true);

-- Add booking_source and terms acceptance to bookings table
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'search_trips';
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add base_rate to vehicles table
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS base_rate NUMERIC DEFAULT 18;
