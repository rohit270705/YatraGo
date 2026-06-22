-- Run this in your Supabase SQL Editor to add detailed vehicle info columns
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
