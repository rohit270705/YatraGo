-- =====================================================
-- YatraGo: Trip Graph Schema Migration
-- Apply this in Supabase SQL Editor
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
  linked_booking_id   TEXT,           -- FK to bookings.id (soft, no hard FK to avoid circular)
  linked_vehicle_id   TEXT,           -- FK to vehicles.id (soft)
  linked_parcel_id    TEXT,           -- FK to parcels.id (soft)
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

-- trip_graphs
ALTER TABLE public.trip_graphs ENABLE ROW LEVEL SECURITY;

-- Passenger: full CRUD on their own trips
CREATE POLICY "passenger_own_trips" ON public.trip_graphs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agent: can read all trips (for client management)
-- Scope this more tightly when you add agent_client linking
CREATE POLICY "agent_read_trips" ON public.trip_graphs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent'
    )
  );

-- trip_nodes
ALTER TABLE public.trip_nodes ENABLE ROW LEVEL SECURITY;

-- Users can CRUD nodes on their own trips
CREATE POLICY "own_trip_nodes" ON public.trip_nodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g WHERE g.id = trip_graph_id AND g.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_graphs g WHERE g.id = trip_graph_id AND g.user_id = auth.uid()
    )
  );

-- Driver: can read nodes where linked_vehicle_id matches a vehicle they own/drive
CREATE POLICY "driver_read_linked_nodes" ON public.trip_nodes
  FOR SELECT USING (
    linked_vehicle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.vehicles v ON v.driver_id = u.id OR v.owner_id = u.id
      WHERE u.id = auth.uid() AND u.role = 'driver' AND v.id = linked_vehicle_id
    )
  );

-- Agent: can read all trip nodes (for client management)
CREATE POLICY "agent_read_all_nodes" ON public.trip_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'agent'
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
