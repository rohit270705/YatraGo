-- Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id, searched_at DESC);
ALTER TABLE IF EXISTS public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own search history" ON public.search_history;
CREATE POLICY "Users can read own search history" ON public.search_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;
CREATE POLICY "Users can insert own search history" ON public.search_history
  FOR INSERT WITH CHECK (true);

-- Create feature_interest table
CREATE TABLE IF NOT EXISTS public.feature_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_interest_user_feature ON public.feature_interest(user_id, feature_name);
ALTER TABLE IF EXISTS public.feature_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feature interest" ON public.feature_interest;
CREATE POLICY "Users can read own feature interest" ON public.feature_interest
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own feature interest" ON public.feature_interest;
CREATE POLICY "Users can insert own feature interest" ON public.feature_interest
  FOR INSERT WITH CHECK (true);
