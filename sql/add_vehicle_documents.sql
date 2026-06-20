-- Run this in your Supabase SQL Editor to add document columns to vehicles table

-- RC Book details
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS rc_number TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS rc_photo_url TEXT;

-- PUC Certificate details
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS puc_number TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS puc_valid_until DATE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS puc_photo_url TEXT;

-- Driving License details
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS dl_number TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS dl_holder_name TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS dl_valid_until DATE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS dl_photo_url TEXT;

-- Track whether documents have been uploaded after approval
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS documents_submitted BOOLEAN DEFAULT false;

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, action_required
  reference_type TEXT, -- 'vehicle_approved', 'booking_update', etc.
  reference_id TEXT, -- ID of the related entity
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
