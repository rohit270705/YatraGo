-- =========================================================
-- 1. YatraGo RLS Audit Script (sql/audit_rls.sql)
-- Run this in Supabase SQL Editor to check RLS status on all tables
-- =========================================================

-- Check which tables have RLS enabled/disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS is_rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all active RLS policies in the public schema
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
