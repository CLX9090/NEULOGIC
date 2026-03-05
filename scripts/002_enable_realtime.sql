-- Enable Supabase Realtime for sensor_data and alerts tables
alter publication supabase_realtime add table public.sensor_data;
alter publication supabase_realtime add table public.alerts;
