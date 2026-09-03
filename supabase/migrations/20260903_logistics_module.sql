-- =====================================================================
-- YatraGo: Logistics Module & Yaara Parcel Relay Schema
-- Run this in Supabase SQL Editor
-- Extends the existing trip_graphs / trip_nodes travel schema
-- =====================================================================

-- 0. Safely augment trip_nodes if missing relay columns
ALTER TABLE public.trip_nodes ADD COLUMN IF NOT EXISTS assigned_driver_id TEXT;
ALTER TABLE public.trip_nodes ADD COLUMN IF NOT EXISTS spare_capacity_kg NUMERIC(6,2) DEFAULT 20;
ALTER TABLE public.trip_nodes ADD COLUMN IF NOT EXISTS reference_table TEXT;
ALTER TABLE public.trip_nodes ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- ---------------------------------------------------------------------
-- 1. parcel_deliveries — Core shipment records
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcel_deliveries (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,

  pickup_label TEXT NOT NULL,
  pickup_lat NUMERIC(9,6),
  pickup_lng NUMERIC(9,6),

  drop_label TEXT NOT NULL,
  drop_lat NUMERIC(9,6),
  drop_lng NUMERIC(9,6),

  parcel_size TEXT NOT NULL CHECK (parcel_size IN ('document', 'small', 'medium', 'large')),
  weight_kg NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  declared_value NUMERIC(12,2) DEFAULT 500,

  delivery_tier TEXT NOT NULL CHECK (delivery_tier IN ('relay', 'express', 'scheduled', 'third_party')),

  -- set when delivery_tier = 'third_party'
  third_party_courier TEXT CHECK (third_party_courier IN ('blue_dart', 'delhivery', 'ekart', 'dhl', 'borzo', NULL)),
  third_party_tracking_ref TEXT,

  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'matched', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed')),

  price_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',

  scheduled_pickup_window_start TIMESTAMPTZ,
  scheduled_pickup_window_end TIMESTAMPTZ,

  otp_code TEXT, -- 4-6 digit delivery verification code
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcel_sender ON public.parcel_deliveries(sender_id);
CREATE INDEX IF NOT EXISTS idx_parcel_status ON public.parcel_deliveries(status);

-- ---------------------------------------------------------------------
-- 2. parcel_relay_matches — Links parcel to a driver's confirmed vehicle leg
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcel_relay_matches (
  id TEXT PRIMARY KEY,
  parcel_delivery_id TEXT NOT NULL REFERENCES public.parcel_deliveries(id) ON DELETE CASCADE,
  carrying_vehicle_node_id TEXT NOT NULL REFERENCES public.trip_nodes(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,

  match_score NUMERIC(4,3) DEFAULT 0.950,
  driver_response TEXT NOT NULL DEFAULT 'pending'
    CHECK (driver_response IN ('pending', 'accepted', 'declined', 'expired')),

  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  parcel_trip_node_id TEXT REFERENCES public.trip_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relay_parcel ON public.parcel_relay_matches(parcel_delivery_id);
CREATE INDEX IF NOT EXISTS idx_relay_driver ON public.parcel_relay_matches(driver_id, driver_response);
CREATE INDEX IF NOT EXISTS idx_relay_vehicle_node ON public.parcel_relay_matches(carrying_vehicle_node_id);

-- Enforce only 1 accepted match per parcel
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_accepted_match_per_parcel
  ON public.parcel_relay_matches(parcel_delivery_id)
  WHERE driver_response = 'accepted';

-- ---------------------------------------------------------------------
-- 3. parcel_status_events — Audit trail / live tracking events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcel_status_events (
  id TEXT PRIMARY KEY,
  parcel_delivery_id TEXT NOT NULL REFERENCES public.parcel_deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcel_events ON public.parcel_status_events(parcel_delivery_id, created_at);

-- ---------------------------------------------------------------------
-- 4. Trigger — On relay match accepted, auto-create linked trip_node
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.parcel_relay_on_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_graph_id TEXT;
  v_day_number INT;
  v_new_node_id TEXT;
  v_parcel public.parcel_deliveries%ROWTYPE;
BEGIN
  IF NEW.driver_response = 'accepted' AND OLD.driver_response <> 'accepted' THEN

    SELECT * INTO v_parcel FROM public.parcel_deliveries WHERE id = NEW.parcel_delivery_id;

    SELECT trip_graph_id, day_number INTO v_graph_id, v_day_number
      FROM public.trip_nodes WHERE id = NEW.carrying_vehicle_node_id;

    IF v_graph_id IS NOT NULL THEN
      v_new_node_id := 'node-relay-' || substr(md5(random()::text), 1, 8);

      INSERT INTO public.trip_nodes (
        id, trip_graph_id, day_number, order_index, node_type,
        title, location, status,
        estimated_cost, linked_parcel_id, assigned_driver_id,
        reference_table, reference_id, notes
      ) VALUES (
        v_new_node_id, v_graph_id, COALESCE(v_day_number, 1), 99, 'parcel',
        'Relay Parcel: ' || v_parcel.recipient_name,
        v_parcel.drop_label, 'booked',
        v_parcel.price_amount, v_parcel.id, NEW.driver_id,
        'parcel_deliveries', v_parcel.id, 'Carried by driver relay'
      );

      NEW.parcel_trip_node_id := v_new_node_id;
    END IF;

    NEW.responded_at := NOW();

    UPDATE public.parcel_deliveries
      SET status = 'matched', updated_at = NOW()
      WHERE id = NEW.parcel_delivery_id;

    -- Expire all other pending candidate matches for this parcel
    UPDATE public.parcel_relay_matches
      SET driver_response = 'expired', responded_at = NOW()
      WHERE parcel_delivery_id = NEW.parcel_delivery_id
        AND id <> NEW.id
        AND driver_response = 'pending';

    -- Insert status event
    INSERT INTO public.parcel_status_events (id, parcel_delivery_id, status, note)
    VALUES (
      'evt-' || substr(md5(random()::text), 1, 8),
      NEW.parcel_delivery_id,
      'matched',
      'Matched with verified driver relay. Preparing for pickup.'
    );

  ELSIF NEW.driver_response = 'declined' THEN
    NEW.responded_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parcel_relay_on_accept ON public.parcel_relay_matches;
CREATE TRIGGER trg_parcel_relay_on_accept
  BEFORE UPDATE ON public.parcel_relay_matches
  FOR EACH ROW EXECUTE FUNCTION public.parcel_relay_on_accept();

-- ---------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ---------------------------------------------------------------------
ALTER TABLE public.parcel_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_relay_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_status_events ENABLE ROW LEVEL SECURITY;

-- parcel_deliveries
CREATE POLICY "parcel_deliveries_sender_all" ON public.parcel_deliveries
  FOR ALL
  USING (sender_id::text = auth.uid()::text)
  WITH CHECK (sender_id::text = auth.uid()::text);

CREATE POLICY "parcel_deliveries_driver_select" ON public.parcel_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parcel_relay_matches m
      WHERE m.parcel_delivery_id = parcel_deliveries.id
        AND m.driver_id::text = auth.uid()::text
    )
  );

CREATE POLICY "parcel_deliveries_driver_update" ON public.parcel_deliveries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.parcel_relay_matches m
      WHERE m.parcel_delivery_id = parcel_deliveries.id
        AND m.driver_id::text = auth.uid()::text
    )
  );

-- parcel_relay_matches
CREATE POLICY "relay_matches_driver_all" ON public.parcel_relay_matches
  FOR ALL
  USING (driver_id::text = auth.uid()::text)
  WITH CHECK (driver_id::text = auth.uid()::text);

CREATE POLICY "relay_matches_sender_select" ON public.parcel_relay_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parcel_deliveries p
      WHERE p.id = parcel_relay_matches.parcel_delivery_id
        AND p.sender_id::text = auth.uid()::text
    )
  );

-- parcel_status_events
CREATE POLICY "parcel_events_select" ON public.parcel_status_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parcel_deliveries p
      WHERE p.id = parcel_status_events.parcel_delivery_id
        AND (p.sender_id::text = auth.uid()::text
             OR EXISTS (
               SELECT 1 FROM public.parcel_relay_matches m
               WHERE m.parcel_delivery_id = p.id
                 AND m.driver_id::text = auth.uid()::text
             ))
    )
  );

CREATE POLICY "parcel_events_driver_insert" ON public.parcel_status_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parcel_relay_matches m
      WHERE m.parcel_delivery_id = parcel_status_events.parcel_delivery_id
        AND m.driver_id::text = auth.uid()::text
    )
  );
