-- NeuroSense ESP8266 Database Schema
-- Devices table with unique auth tokens for ESP8266 binding

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Devices table
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_code text unique not null,
  device_name text,
  auth_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  password_hash text,
  firmware_version text,
  wifi_ssid text,
  wifi_configured boolean default false,
  last_seen_at timestamptz,
  is_online boolean default false,
  created_at timestamptz default now()
);

-- Sensor data table
create table if not exists public.sensor_data (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  gsr real not null default 0,
  sound real not null default 0,
  accel_x real not null default 0,
  accel_y real not null default 0,
  accel_z real not null default 0,
  stress_index real not null default 0,
  timestamp bigint not null,
  latency_ms integer,
  created_at timestamptz default now()
);

-- Alerts table
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'medium',
  message text,
  stress_value real,
  acknowledged boolean default false,
  created_at timestamptz default now()
);

-- Device links (bind device to user account with consent)
create table if not exists public.device_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  child_name text,
  consent_text text,
  consent_accepted_at timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, device_id)
);

-- Indexes for performance
create index if not exists idx_sensor_data_device_ts on public.sensor_data(device_id, timestamp desc);
create index if not exists idx_alerts_device on public.alerts(device_id, created_at desc);
create index if not exists idx_device_links_user on public.device_links(user_id);
create index if not exists idx_devices_auth_token on public.devices(auth_token);

-- Enable RLS on all tables
alter table public.devices enable row level security;
alter table public.sensor_data enable row level security;
alter table public.alerts enable row level security;
alter table public.device_links enable row level security;

-- RLS Policies for devices
-- Users can see devices they have linked
create policy "devices_select_linked" on public.devices
  for select using (
    id in (select device_id from public.device_links where user_id = auth.uid())
  );

-- Allow anonymous insert for ESP8266 self-registration (via API with service role)
-- The ESP8266 registers itself through the API endpoint, not directly

-- RLS Policies for sensor_data
-- Users can see sensor data for their linked devices
create policy "sensor_data_select_linked" on public.sensor_data
  for select using (
    device_id in (select device_id from public.device_links where user_id = auth.uid())
  );

-- RLS Policies for alerts
create policy "alerts_select_linked" on public.alerts
  for select using (
    device_id in (select device_id from public.device_links where user_id = auth.uid())
  );

create policy "alerts_update_linked" on public.alerts
  for update using (
    device_id in (select device_id from public.device_links where user_id = auth.uid())
  );

-- RLS Policies for device_links
create policy "device_links_select_own" on public.device_links
  for select using (auth.uid() = user_id);

create policy "device_links_insert_own" on public.device_links
  for insert with check (auth.uid() = user_id);

create policy "device_links_update_own" on public.device_links
  for update using (auth.uid() = user_id);

create policy "device_links_delete_own" on public.device_links
  for delete using (auth.uid() = user_id);
