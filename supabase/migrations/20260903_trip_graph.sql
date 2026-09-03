-- =====================================================
-- YatraGo: Trip Graph Schema Migration (v3 - fully type-safe)
-- Apply this in Supabase SQL Editor
-- =====================================================
-- TYPE NOTES:
--   auth.uid()             → UUID
--   auth.uid()::text       → TEXT (use when comparing to TEXT id columns)
--   trip_graphs.user_id    → UUID  (references auth.users.id directly)
--   public.users.id        → UUID  (Supabase auth primary key)
--   vehicles.owner_id      → TEXT  (app stores user ids as text strings)
--   linked_vehicle_id      → TEXT  (app stores vehicle ids as text strings)
--   vehicles.id            → UUID  (Supabase auto-generated UUID)
-- =====================================================

-- 1. trip_graphs — one row per user trip plan
CREATE TABLE IF NOT EXISTS public.trip_graphs (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  budget        NUMERIC(10,2) DEFAULT 0,
  total_days    INTEGER DEFAULT 3,
  start_date    DATE,
  status        TEXT DEFAULT 'planning' CHECK (status IN ('planning','active','completed','cancelled')),
  currency      TEXT DEFAULT 'INR',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. trip_nodes — one row per stop in a trip graph
CREATE TABLE IF NOT EXISTS public.trip_nodes (
  id                  TEXT PRIMARY KEY,
  trip_graph_id       TEXT NOT NULL REFERENCES public.trip_graphs(id) ON DELETE CASCADE,
  day_number          INTEGER NOT NULL DEFAULT 1,
  order_index         INTEGER NOT NULL DEFAULT 1,
  node_type           TEXT NOT NULL CHECK (node_type IN ('vehicle','stay','food','parcel','activity','transport')),
  title               TEXT NOT NULL,
  location            TEXT,
  start_time          TIME,
  end_time            TIME,
  status              TEXT DEFAULT 'planned' CHECK (status IN ('planned','booked','in_progress','done')),
  linked_booking_id   TEXT,
  linked_vehicle_id   TEXT,
  linked_parcel_id    TEXT,
  estimated_cost      NUMERIC(10,2) DEFAULT 0,
  actual_cost         NUMERIC(10,2),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_trip_graphs_user_id ON public.trip_graphs(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_nodes_trip_id  ON public.trip_nodes(trip_graph_id);
CREATE INDEX IF NOT EXISTS idx_trip_nodes_day      ON public.trip_nodes(trip_graph_id, day_number, order_index);

-- 4. RLS Policies

-- ── trip_graphs ──
ALTER TABLE public.trip_graphs ENABLE ROW LEVEL SECURITY;

-- user_id is UUID, auth.uid() is UUID — direct compare, no cast needed
CREATE POLICY "passenger_own_trips" ON public.trip_graphs
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.users.id is UUID, auth.uid() is UUID — direct compare
CREATE POLICY "agent_read_trips" ON public.trip_graphs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'agent'
    )
  );

-- ── trip_nodes ──
ALTER TABLE public.trip_nodes ENABLE ROW LEVEL SECURITY;

-- g.user_id is UUID, auth.uid() is UUID — direct compare
CREATE POLICY "own_trip_nodes" ON public.trip_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_graph_id
        AND g.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_graph_id
        AND g.user_id = auth.uid()
    )
  );

-- vehicles.owner_id is TEXT, auth.uid() is UUID → cast auth.uid() to TEXT
-- linked_vehicle_id is TEXT, vehicles.id is UUID → cast linked_vehicle_id to UUID (guarded)
CREATE POLICY "driver_read_linked_nodes" ON public.trip_nodes
  FOR SELECT USING (
    linked_vehicle_id IS NOT NULL
    AND linked_vehicle_id ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id        = linked_vehicle_id::uuid
        AND v.owner_id  = auth.uid()::text
    )
  );

-- public.users.id is UUID, auth.uid() is UUID — direct compare
CREATE POLICY "agent_read_all_nodes" ON public.trip_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'agent'
    )
  );

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_graphs_updated_at ON public.trip_graphs;
CREATE TRIGGER trip_graphs_updated_at
  BEFORE UPDATE ON public.trip_graphs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
