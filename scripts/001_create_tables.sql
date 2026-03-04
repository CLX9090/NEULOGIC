-- NeuroSense: Core database tables
-- Devices table (registered Micro:bit devices)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code TEXT UNIQUE NOT NULL,
  device_name TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Device-user linking with RGPD/COPPA consent
CREATE TABLE IF NOT EXISTS device_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  consent_text TEXT NOT NULL,
  consent_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  child_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Sensor data stream
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  gsr FLOAT NOT NULL,
  sound FLOAT NOT NULL,
  accel_x FLOAT NOT NULL,
  accel_y FLOAT NOT NULL,
  accel_z FLOAT NOT NULL,
  stress_index FLOAT,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts generated from sensor analysis
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('overstimulation', 'high_movement', 'sound_spike', 'rapid_change')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  message TEXT NOT NULL,
  stress_value FLOAT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON sensor_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_device_time ON alerts(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_links_user ON device_links(user_id);
