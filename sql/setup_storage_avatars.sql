-- =========================================================
-- COMPLETE STORAGE BUCKET & RLS SCRIPT FOR USER AVATARS
-- =========================================================
-- Copy this entire script and run it in Supabase SQL Editor.
-- All comments start with -- so you won't get any syntax error.
-- =========================================================

-- 1. Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing avatar policies to rebuild cleanly
DROP POLICY IF EXISTS "Public Read Access for Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload for Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update for Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete for Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on user-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload on user-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow update on user-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete on user-avatars" ON storage.objects;

-- 4. Policy: Anyone can view and download profile avatars
CREATE POLICY "Allow public read on user-avatars"
ON storage.objects FOR SELECT
USING (bucket_id IN ('user-avatars', 'avatars'));

-- 5. Policy: Any authenticated user (or app session) can upload avatars
CREATE POLICY "Allow upload on user-avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('user-avatars', 'avatars'));

-- 6. Policy: Users can update or replace avatar files
CREATE POLICY "Allow update on user-avatars"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('user-avatars', 'avatars'));

-- 7. Policy: Users can delete avatar files
CREATE POLICY "Allow delete on user-avatars"
ON storage.objects FOR DELETE
USING (bucket_id IN ('user-avatars', 'avatars'));
