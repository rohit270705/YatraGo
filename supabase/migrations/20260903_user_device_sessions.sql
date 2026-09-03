-- =====================================================================
-- YatraGo: Multi-Device Session Tracking Schema (Bug 1 Fix)
-- Run this in Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_device_sessions (
  id TEXT PRIMARY KEY,                       -- Unique session UUID (stored in browser localStorage)
  user_id TEXT NOT NULL,                     -- References users.id
  device_name TEXT NOT NULL,                 -- e.g. "Windows PC", "Android Phone", "MacBook"
  platform TEXT NOT NULL,                    -- e.g. "Windows", "Android", "macOS", "iOS"
  browser TEXT,                              -- e.g. "Chrome", "Firefox", "Safari", "Edge"
  ip_address TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,                    -- Populated when user logs out or terminates session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.user_device_sessions(user_id, revoked_at);

-- Enable RLS
ALTER TABLE public.user_device_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_sessions_select" ON public.user_device_sessions;
CREATE POLICY "device_sessions_select" ON public.user_device_sessions
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "device_sessions_insert" ON public.user_device_sessions;
CREATE POLICY "device_sessions_insert" ON public.user_device_sessions
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "device_sessions_update" ON public.user_device_sessions;
CREATE POLICY "device_sessions_update" ON public.user_device_sessions
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "device_sessions_delete" ON public.user_device_sessions;
CREATE POLICY "device_sessions_delete" ON public.user_device_sessions
  FOR DELETE
  USING (user_id::text = auth.uid()::text);
