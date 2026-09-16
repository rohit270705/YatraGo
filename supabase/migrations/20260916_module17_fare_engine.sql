-- =====================================================================
-- YatraGo — Module 17: Fare Engine + Vehicle Booking + Dashboard Fixes
-- Database changes — run in Supabase SQL Editor
--
-- ASSUMPTIONS TO VERIFY BEFORE RUNNING:
-- 1. users table has a `role` text column with value 'admin' for
--    admin users. If your admin check works differently, adjust the
--    admin policies below before running.
-- 2. vehicle_type values here (Bike, E-Rickshaw, Auto 3-Wheeler,
--    Hatchback, Sedan, SUV, Mini Bus 20-25, Mini Bus 26-40) should
--    match whatever your existing vehicle_category enum uses — check
--    and align spelling/casing before seeding, or the fare lookup
--    won't match on join.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. fare_rates — admin-editable fare config, handles BOTH the
--    standard base+per_km model AND the Mini Bus included-km/hours
--    model in one table so the app has a single lookup source.
-- ---------------------------------------------------------------------
create table if not exists fare_rates (
  id uuid primary key default gen_random_uuid(),
  vehicle_type text not null unique,
  ride_mode text not null
    check (ride_mode in ('Economy', 'Comfort', 'Group Transit')),

  base_fare numeric(10,2) not null default 0,
  per_km_rate numeric(10,2) not null default 0,
  min_fare numeric(10,2) not null default 0,

  -- Mini Bus only — null for standard vehicle types
  included_km numeric(10,2),
  included_hours numeric(10,2),
  waiting_rate_per_hour numeric(10,2),

  -- Standard vehicles only — null/unused for Mini Bus
  free_waiting_minutes numeric(10,2) default 3,
  waiting_rate_per_min numeric(10,2) default 1,

  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table fare_rates is
  'Single source of truth for platform default fares. A driver_route_rate override, when present, takes precedence over this table for that specific route (handled at query time, not here).';

-- Seed the 6 standard vehicle types
insert into fare_rates (vehicle_type, ride_mode, base_fare, per_km_rate, min_fare, free_waiting_minutes, waiting_rate_per_min)
values
  ('Bike',           'Economy', 10, 7,  25, 3, 1),
  ('E-Rickshaw',     'Economy', 15, 12, 25, 3, 1),
  ('Auto 3-Wheeler', 'Economy', 20, 18, 30, 3, 1),
  ('Hatchback',       'Comfort', 30, 12, 50, 3, 1),
  ('Sedan',           'Comfort', 40, 15, 60, 3, 1),
  ('SUV',             'Comfort', 50, 18, 75, 3, 1)
on conflict (vehicle_type) do nothing;

-- Note: Hatchback appears in BOTH Economy and Comfort per the spec's
-- ride-mode grouping. This table only stores ONE ride_mode per
-- vehicle_type (its fare doesn't change by mode, only its grouping
-- does). If you need Hatchback to visually appear under both Economy
-- and Comfort tabs in the UI, handle that as a frontend display rule
-- (map vehicle_type -> multiple ride_mode tags) rather than duplicating
-- the fare row — a vehicle should have exactly one fare regardless of
-- which tab a passenger found it under.

-- Seed the 2 Mini Bus tiers (included-km/hours model)
insert into fare_rates (
  vehicle_type, ride_mode, base_fare, per_km_rate, min_fare,
  included_km, included_hours, waiting_rate_per_hour
)
values
  ('Mini Bus 20-25', 'Group Transit', 0, 35, 1000, 20, 2, 300),
  ('Mini Bus 26-40', 'Group Transit', 0, 45, 1400, 20, 2, 400)
on conflict (vehicle_type) do nothing;

-- ---------------------------------------------------------------------
-- 2. route_distance_cache — cached Google Maps Distance Matrix results
--    Written by a server-side function using the service role (bypasses
--    RLS) — NOT written directly by client code, since the Google Maps
--    API key must never reach the frontend.
-- ---------------------------------------------------------------------
create table if not exists route_distance_cache (
  id uuid primary key default gen_random_uuid(),

  -- prefer place_id when available (more reliable cache key than free text)
  origin_place_id text,
  destination_place_id text,
  origin_label text not null,
  destination_label text not null,

  distance_km numeric(10,2) not null,
  duration_min numeric(10,2) not null,

  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

comment on table route_distance_cache is
  'Populated by a server-side (service role) function calling Google Maps Distance Matrix API. Client code reads from here first; only calls the API on a cache miss, via the backend, never directly from the frontend.';

-- Unique on place_id pair when both are present (best case)
create unique index if not exists uq_route_cache_place_ids
  on route_distance_cache(origin_place_id, destination_place_id)
  where origin_place_id is not null and destination_place_id is not null;

-- Fallback unique on normalized text labels when place_id isn't available
create unique index if not exists uq_route_cache_labels
  on route_distance_cache(lower(origin_label), lower(destination_label))
  where origin_place_id is null or destination_place_id is null;

create index if not exists idx_route_cache_expiry on route_distance_cache(expires_at);

-- ---------------------------------------------------------------------
-- 3. feature_notify_requests — "Notify me" signups for Flight/Train
-- ---------------------------------------------------------------------
create table if not exists feature_notify_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature_name text not null
    check (feature_name in ('flight_booking', 'train_booking')),
  requested_at timestamptz not null default now(),
  notified boolean not null default false,
  notified_at timestamptz,
  unique (user_id, feature_name)
);

comment on table feature_notify_requests is
  'One row per user per feature they want notified about. Unique constraint prevents duplicate signups if they click Notify me more than once.';

-- ---------------------------------------------------------------------
-- 4. bookings — add T&C acceptance tracking
-- ---------------------------------------------------------------------
alter table bookings
  add column if not exists accepted_tc boolean not null default false,
  add column if not exists accepted_at timestamptz;

comment on column bookings.accepted_tc is
  'True only once the passenger has explicitly checked the T&C box at booking confirm. Needed for dispute resolution — do not default this to true anywhere.';

-- =====================================================================
-- 5. Row Level Security
-- =====================================================================
alter table fare_rates enable row level security;
alter table route_distance_cache enable row level security;
alter table feature_notify_requests enable row level security;

-- fare_rates: everyone (including guests) can read active fares —
-- needed for the public fare preview from the Guest Browsing feature.
-- Only admins can write.
create policy fare_rates_public_select on fare_rates
  for select
  using (is_active = true);

create policy fare_rates_admin_write on fare_rates
  for all
  using (
    exists (
      select 1 from public.users p
      where p.id::text = auth.uid()::text and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users p
      where p.id::text = auth.uid()::text and p.role = 'admin'
    )
  );

-- route_distance_cache: everyone (including guests) can read cached
-- distances for the fare preview. No insert/update policy for anon or
-- authenticated — writes only happen via the service role from your
-- backend function, which bypasses RLS entirely, so no write policy
-- is needed or should be added here.
create policy route_distance_cache_public_select on route_distance_cache
  for select
  using (true);

-- feature_notify_requests: users manage their own signup only
create policy feature_notify_requests_own_select on feature_notify_requests
  for select
  using (user_id = auth.uid());

create policy feature_notify_requests_own_insert on feature_notify_requests
  for insert
  with check (user_id = auth.uid());

-- Admins can see all notify requests (useful for the eventual push-out)
create policy feature_notify_requests_admin_select on feature_notify_requests
  for select
  using (
    exists (
      select 1 from public.users p
      where p.id::text = auth.uid()::text and p.role = 'admin'
    )
  );
