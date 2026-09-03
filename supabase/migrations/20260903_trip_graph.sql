-- =====================================================
-- YatraGo: Trip Graph Schema Migration (v6 - Clean & Safe)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Drop existing tables if they exist (CASCADE automatically removes all associated policies, triggers, and indexes)
DROP TABLE IF EXISTS public.trip_nodes CASCADE;
DROP TABLE IF EXISTS public.trip_graphs CASCADE;

-- 2. Create trip_graphs table (user_id as TEXT for full compatibility with auth / guest)
CREATE TABLE public.trip_graphs (
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

-- 3. Create trip_nodes table
CREATE TABLE public.trip_nodes (
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

-- 4. Indexes for fast lookups
CREATE INDEX idx_trip_graphs_user_id ON public.trip_graphs(user_id);
CREATE INDEX idx_trip_nodes_trip_id  ON public.trip_nodes(trip_graph_id);
CREATE INDEX idx_trip_nodes_day      ON public.trip_nodes(trip_graph_id, day_number, order_index);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.trip_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_nodes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (all comparisons cast both sides to ::text to prevent type mismatch errors)

-- Passenger: full CRUD on their own trips
CREATE POLICY "passenger_own_trips" ON public.trip_graphs
  FOR ALL
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- Agent: can read all trips
CREATE POLICY "agent_read_trips" ON public.trip_graphs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
        AND role = 'agent'
    )
  );

-- Passenger / Owner: full CRUD on nodes for their own trips
CREATE POLICY "own_trip_nodes" ON public.trip_nodes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_nodes.trip_graph_id
        AND g.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g
      WHERE g.id = trip_nodes.trip_graph_id
        AND g.user_id::text = auth.uid()::text
    )
  );

-- Driver/Owner: can read nodes linked to vehicles they own
CREATE POLICY "driver_read_linked_nodes" ON public.trip_nodes
  FOR SELECT USING (
    linked_vehicle_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id::text = trip_nodes.linked_vehicle_id::text
        AND v.owner_id::text = auth.uid()::text
    )
  );

-- Agent: can read all trip nodes
CREATE POLICY "agent_read_all_nodes" ON public.trip_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
        AND role = 'agent'
    )
  );

-- 7. Updated_at automated trigger
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
