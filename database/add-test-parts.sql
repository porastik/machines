-- Pridanie testovacích náhradných dielov
-- Spustite v Supabase SQL Editor

-- Najprv skontrolujte, či existujú zariadenia
SELECT id, name FROM devices LIMIT 5;

-- Pridanie testovacích náhradných dielov
INSERT INTO spare_parts (
  id,
  name,
  sku,
  quantity,
  min_quantity,
  location,
  device_id
) VALUES 
  (
    'SP-001',
    'Ložisko vretena',
    'BRG-5021',
    15,
    10,
    'Regál A-12',
    NULL
  ),
  (
    'SP-002',
    'Čerpadlo chladiaceho oleja',
    'PMP-C-34',
    4,
    5,
    'Regál B-05',
    NULL
  ),
  (
    'SP-003',
    'Filter hydraulickej kvapaliny',
    'FIL-H-99',
    45,
    20,
    'Regál A-15',
    NULL
  ),
  (
    'SP-004',
    'Servo motor',
    'MOT-S-850',
    8,
    10,
    'Regál C-01',
    NULL
  ),
  (
    'SP-005',
    'Ozubený remeň',
    'BELT-T-200',
    12,
    8,
    'Regál B-08',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Overenie
SELECT id, name, sku, quantity, min_quantity, location 
FROM spare_parts 
ORDER BY created_at DESC;
