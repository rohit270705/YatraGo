-- =========================================================
-- COMPLETE CORRECTED RLS SCRIPT FOR USERS TABLE
-- =========================================================

-- 0. Create helper function first to prevent "function does not exist" errors
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 1. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies on users table to rebuild cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Allow reading user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow public read of user profiles" ON public.users;
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.users;

-- 3. Policy: Allow reading basic user profile info
-- Required for OAuth account linking checks on login, displaying driver/owner names on tickets, and admin dashboard
CREATE POLICY "Allow reading user profiles" ON public.users
  FOR SELECT USING (true);

-- 4. Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 5. Policy: Admins can update any user profile
-- Check using both direct EXISTS query, helper function, and JWT metadata for 100% reliability
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR public.current_user_role() = 'admin'
    OR (auth.jwt() ->> 'role' = 'admin')
  );
