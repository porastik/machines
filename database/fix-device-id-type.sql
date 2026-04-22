-- Oprava typu ID v tabuľke devices z UUID na TEXT
-- Spustite v Supabase SQL Editor

-- 1. Dočasne vypnúť RLS
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts DISABLE ROW LEVEL SECURITY;

-- 2. Zmazať existujúce údaje (ak sú nejaké)
TRUNCATE TABLE maintenance_logs CASCADE;
TRUNCATE TABLE spare_parts CASCADE;
TRUNCATE TABLE devices CASCADE;

-- 3. Zrušiť foreign key constraints
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_device_id_fkey;
ALTER TABLE spare_parts DROP CONSTRAINT IF EXISTS spare_parts_device_id_fkey;

-- 4. Zmeniť typ stĺpca ID z UUID na TEXT
ALTER TABLE devices 
  ALTER COLUMN id TYPE TEXT;

-- 5. Zmeniť typ device_id v maintenance_logs na TEXT
ALTER TABLE maintenance_logs
  ALTER COLUMN device_id TYPE TEXT;

-- 6. Zmeniť typ device_id v spare_parts na TEXT  
ALTER TABLE spare_parts
  ALTER COLUMN device_id TYPE TEXT;

-- 7. Obnoviť foreign key constraints
ALTER TABLE maintenance_logs
  ADD CONSTRAINT maintenance_logs_device_id_fkey 
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE spare_parts
  ADD CONSTRAINT spare_parts_device_id_fkey 
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;

-- 8. Zapnúť RLS späť
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

-- 9. Vytvoriť testovacie zariadenie
INSERT INTO devices (
  id,
  name,
  type,
  manufacturer,
  location,
  status,
  downtime,
  last_status_change,
  last_maintenance,
  next_maintenance,
  maintenance_period
) VALUES (
  'TEST-001',
  'Testovací stroj',
  'CNC',
  'Test Manufacturer',
  'Hala A',
  'operational',
  0,
  NOW(),
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '30 days',
  'monthly'
);

-- Overenie
SELECT id, name, type, location, status FROM devices;
