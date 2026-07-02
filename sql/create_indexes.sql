-- =========================================================
-- 3. YatraGo Performance Indexing Script (sql/create_indexes.sql)
-- Run this in Supabase SQL Editor to optimize query speed
-- Safe to run multiple times (IF NOT EXISTS used throughout)
-- =========================================================

-- Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Bookings & Trips Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_route_id ON public.bookings(route_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Vehicles & Fleet Management Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_no ON public.vehicles(registration_number);

-- Routes & Search Indexes
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON public.routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_from_to_date ON public.routes(from_city, to_city, journey_date);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON public.routes(created_at DESC);

-- Financial & Wallet Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- Rental Vehicles & Active Rentals Indexes
CREATE INDEX IF NOT EXISTS idx_rental_vehicles_owner ON public.rental_vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_active_rentals_user ON public.active_rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_active_rentals_status ON public.active_rentals(status);

-- Conversations & Messages Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_convo_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
