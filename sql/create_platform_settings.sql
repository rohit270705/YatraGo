-- =========================================================
-- CREATE PLATFORM SETTINGS TABLE
-- =========================================================
-- Run this script in your Supabase SQL Editor to create the
-- platform_settings table and resolve the 404 console error.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  setting_key text PRIMARY KEY,
  setting_value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to platform settings
CREATE POLICY "Allow public read of platform settings" ON public.platform_settings
  FOR SELECT USING (true);

-- Allow admin write access to platform settings
CREATE POLICY "Allow admin update of platform settings" ON public.platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default settings if table is empty
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES 
  ('AGENT_COMMISSION_PERCENT', '5.0'),
  ('PLATFORM_FEE_FIXED', '0'),
  ('SUPPORT_EMAIL', 'support@yatrago.com'),
  ('CANCELLATION_FEE_MAX', '30.0')
ON CONFLICT (setting_key) DO NOTHING;
