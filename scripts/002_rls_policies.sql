-- NeuroSense: Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can CRUD their own row
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Devices: anyone authenticated can read (for linking), no public write
CREATE POLICY "devices_select_authenticated" ON devices FOR SELECT TO authenticated USING (true);

-- Device links: users see/manage only their own links
CREATE POLICY "device_links_select_own" ON device_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "device_links_insert_own" ON device_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "device_links_update_own" ON device_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "device_links_delete_own" ON device_links FOR DELETE USING (auth.uid() = user_id);

-- Sensor data: users see data from their linked devices
CREATE POLICY "sensor_data_select_linked" ON sensor_data FOR SELECT USING (
  device_id IN (
    SELECT device_id FROM device_links WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Sensor data: allow inserts from service role (API route uses service key)
-- The API route inserts data server-side so we need an anon/service insert policy
CREATE POLICY "sensor_data_insert_service" ON sensor_data FOR INSERT WITH CHECK (true);

-- Alerts: users see alerts from their linked devices
CREATE POLICY "alerts_select_linked" ON alerts FOR SELECT USING (
  device_id IN (
    SELECT device_id FROM device_links WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Alerts: allow inserts from API (service role)
CREATE POLICY "alerts_insert_service" ON alerts FOR INSERT WITH CHECK (true);

-- Alerts: users can update (acknowledge) alerts from their linked devices
CREATE POLICY "alerts_update_linked" ON alerts FOR UPDATE USING (
  device_id IN (
    SELECT device_id FROM device_links WHERE user_id = auth.uid() AND is_active = true
  )
);
