-- =========================================================
-- YatraGo Performance & Stability Optimization
-- Core Foreign Key Indexing & RLS Audit Script (Priorities 4 & 5)
-- Safe to run multiple times (IF NOT EXISTS used throughout)
-- Only indexes guaranteed core columns (no optional/additive flags)
-- =========================================================

-- 1. Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- 2. Bookings & Trips Indexes (High query volume)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_route_id ON public.bookings(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 3. Vehicles & Fleet Management Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_no ON public.vehicles(registration_number);

-- 4. Routes & Search Indexes (Passenger trip search optimization)
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON public.routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_from_to_date ON public.routes(from_city, to_city, journey_date);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON public.routes(created_at DESC);

-- 5. Financial & Wallet Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- 6. Rental Vehicles & Active Rentals Indexes
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_owner ON public.rental_vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_active_rentals_user ON public.active_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_active_rentals_status ON public.active_rentals(status);

-- 7. Conversations & Messages Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_convo_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- =========================================================
-- RLS Policy Verification (Ensure RLS is enabled on all core tables)
-- =========================================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rental_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.active_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
