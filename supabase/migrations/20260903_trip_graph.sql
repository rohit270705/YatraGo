-- =====================================================
-- YatraGo: Trip Graph Schema Migration (v4 - universal text cast)
-- Apply this in Supabase SQL Editor
-- =====================================================
-- DISCOVERED TYPE MAP for this project:
--   public.users.id    → TEXT  (app stores as text, not UUID)
--   vehicles.owner_id  → TEXT
--   vehicles.id        → UUID  (Supabase auto primary key)
--   auth.uid()         → UUID  (always)
--   → Rule: always cast auth.uid()::text when comparing to public.* id columns
-- =====================================================

-- 1. trip_graphs
--    user_id stored as TEXT to match how the app works
CREATE TABLE IF NOT EXISTS public.trip_graphs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  title         TEXT NOT NULL,
  budget        NUMERIC(10,2) DEFAULT 0,
  total_days    INTEGER NOT NULL DEFAULT 3,
  start_date    DATE,
  status        TEXT DEFAULT 'planning' CHECK (status IN ('planning','active','completed','cancelled')),
  currency      TEXT DEFAULT 'INR',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. trip_nodes
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
-- UNIVERSAL RULE: auth.uid() is UUID, all public.* id columns are TEXT
--                 → always use auth.uid()::text for comparisons

ALTER TABLE public.trip_graphs ENABLE ROW LEVEL SECURITY;

-- Passenger owns their own trips
CREATE POLICY "passenger_own_trips" ON public.trip_graphs
  FOR ALL
  USING     (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Agent can read all trips
CREATE POLICY "agent_read_trips" ON public.trip_graphs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text
        AND role = 'agent'
    )
  );

ALTER TABLE public.trip_nodes ENABLE ROW LEVEL SECURITY;

-- Owner: full CRUD on nodes that belong to their trips
CREATE POLICY "own_trip_nodes" ON public.trip_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_graph_id
        AND g.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_graph_id
        AND g.user_id = auth.uid()::text
    )
  );

-- Driver/Owner: read nodes linked to their vehicle
-- vehicles.owner_id = TEXT, vehicles.id = UUID, linked_vehicle_id = TEXT
CREATE POLICY "driver_read_linked_nodes" ON public.trip_nodes
  FOR SELECT USING (
    linked_vehicle_id IS NOT NULL
    AND linked_vehicle_id ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id       = linked_vehicle_id::uuid
        AND v.owner_id = auth.uid()::text
    )
  );

-- Agent: read all nodes
CREATE POLICY "agent_read_all_nodes" ON public.trip_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id   = auth.uid()::text
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
