-- =========================================================
-- FIX GOOGLE OAUTH ID MISMATCH IN USERS TABLE
-- =========================================================
-- Run this script in your Supabase SQL Editor to synchronize
-- the user ID in public.users with their Google OAuth auth.users ID.

-- 1. Fix existing mismatch for Priya Dev Singh
UPDATE public.users 
SET id = '299fd468-43ac-4852-a0ef-92a3063cf910'
WHERE email = 'ry7218582@gmail.com'
AND id = '7b686f5e-3b62-4016-8c78-d1356df57fc3';

-- 2. Optional: General check to see if any other users have ID mismatches between auth.users and public.users
-- SELECT u.email, u.id AS public_id, au.id AS auth_id
-- FROM public.users u
-- JOIN auth.users au ON u.email = au.email
-- WHERE u.id != au.id;
