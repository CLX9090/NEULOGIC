-- NeuroSense: Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
