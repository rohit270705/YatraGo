-- =========================================================
-- SECURITY HARDENING: Drop insecure dev bypass policies
-- Run in Supabase SQL Editor before launching to production
-- =========================================================

DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.active_rentals;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.bookings;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.conversations;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.messages;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.notifications;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.rental_vehicles;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.routes;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.users;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.wallets;
