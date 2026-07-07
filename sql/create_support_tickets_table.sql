-- =========================================================
-- SUPPORT TICKETS TABLE SETUP
-- =========================================================
-- Run this script in your Supabase SQL Editor to create the
-- support_tickets table, RLS policies, indexes, and trigger.

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  messages_json JSONB DEFAULT '[]'::jsonb,
  chat_session_id UUID NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure indexes exist for fast querying by user_id, status, and creation date
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for seamless functionality
DROP POLICY IF EXISTS "Users can view support tickets" ON public.support_tickets;
CREATE POLICY "Users can view support tickets" ON public.support_tickets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users can create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update support tickets" ON public.support_tickets;
CREATE POLICY "Users can update support tickets" ON public.support_tickets
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete support tickets" ON public.support_tickets;
CREATE POLICY "Users can delete support tickets" ON public.support_tickets
  FOR DELETE USING (true);

-- Create or update trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();
