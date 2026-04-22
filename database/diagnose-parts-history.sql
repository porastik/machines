-- Diagnostika histórie náhradných dielov
-- Spustite v Supabase SQL Editor

-- 1. Skontrolovať, či tabuľka spare_parts_history existuje
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'spare_parts_history'
ORDER BY ordinal_position;

-- 2. Zobraziť všetky záznamy histórie
SELECT * FROM spare_parts_history 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Skontrolovať RLS politiky pre spare_parts_history
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'spare_parts_history';

-- 4. Test pridania testovacieho záznamu do histórie
-- (vyžaduje existujúci spare part s ID 'SP-001')
INSERT INTO spare_parts_history (
  part_id,
  quantity_before,
  quantity_after,
  change_type,
  notes,
  changed_by
) VALUES (
  'SP-001',
  10,
  15,
  'increase',
  'Testovacia poznámka',
  'admin@machines.local'
) RETURNING *;
