-- Run this in Supabase SQL Editor to fix the notifications table RLS
-- Since the app uses custom auth (not Supabase Auth), we need permissive policies

-- Enable RLS on the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (ignore errors)
DROP POLICY IF EXISTS "Allow public read/write for dev" ON public.notifications;

-- Create permissive policy for notifications (allows all operations)
CREATE POLICY "Allow public read/write for dev"
  ON public.notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
