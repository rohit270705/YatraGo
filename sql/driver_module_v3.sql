-- Driver Module V3 - Vehicle-less Drivers & License Categories

-- Add boolean for vehicle ownership and string for license category
ALTER TABLE public.driver_profiles 
ADD COLUMN IF NOT EXISTS has_own_vehicle BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS license_category VARCHAR(100);

-- Make sure existing drivers are defaulted to true (since they likely registered with a vehicle or as standard drivers)
UPDATE public.driver_profiles 
SET has_own_vehicle = true 
WHERE has_own_vehicle IS NULL;
