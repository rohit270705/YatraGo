-- Add purchase date to vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS purchase_date DATE;
