-- NeuroSense: Seed demo device
-- Password is SHA-256 hash of "neurosense2024"
INSERT INTO devices (device_code, device_name, password_hash)
VALUES (
  'bit_0001',
  'Micro:bit Demo',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
)
ON CONFLICT (device_code) DO NOTHING;
