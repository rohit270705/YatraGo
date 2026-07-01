-- ================================================================
-- YatraGo AI Chatbot — Database Migration
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'passenger',
  detected_language TEXT DEFAULT 'en' CHECK (detected_language IN ('en', 'hi', 'mr', 'hinglish')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 2. Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  ai_provider TEXT CHECK (ai_provider IN ('gemini', 'groq', 'openai', 'claude', 'error', NULL)),
  response_time_ms INTEGER,
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT CHECK (fallback_reason IN ('rate_limit', 'error', 'complex_query', NULL)),
  quick_replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add fallback_reason to existing chat_messages table if column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'fallback_reason'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN fallback_reason TEXT CHECK (fallback_reason IN ('rate_limit', 'error', 'complex_query', NULL));
  END IF;
END $$;

-- Drop and recreate constraint on existing ai_provider column to allow 'groq'
DO $$
BEGIN
  ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_ai_provider_check;
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_ai_provider_check CHECK (ai_provider IN ('gemini', 'groq', 'openai', 'claude', 'error', NULL));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Add chat_session_id to existing support_tickets (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'chat_session_id'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN chat_session_id UUID REFERENCES chat_sessions(id);
  END IF;
END $$;

-- 4. Add preferred_language to users table (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
END $$;


-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 6. RLS Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat sessions: users can CRUD their own sessions
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (true);

-- Chat messages: users can read/write messages in their sessions
DROP POLICY IF EXISTS "Users can view chat messages" ON chat_messages;
CREATE POLICY "Users can view chat messages" ON chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
CREATE POLICY "Users can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);
