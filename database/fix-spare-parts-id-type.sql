-- Oprava typu ID v tabuľke spare_parts z UUID na TEXT
-- Spustite v Supabase SQL Editor

-- 1. Dočasne vypnúť RLS
ALTER TABLE spare_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE part_price_history DISABLE ROW LEVEL SECURITY;

-- 2. Zmazať existujúce údaje (ak sú nejaké)
TRUNCATE TABLE part_price_history CASCADE;
TRUNCATE TABLE spare_parts_history CASCADE;
TRUNCATE TABLE spare_parts CASCADE;

-- 3. Zrušiť foreign key constraints
ALTER TABLE spare_parts_history DROP CONSTRAINT IF EXISTS spare_parts_history_part_id_fkey;
ALTER TABLE part_price_history DROP CONSTRAINT IF EXISTS part_price_history_part_id_fkey;

-- 4. Zmeniť typ stĺpca ID z UUID na TEXT
ALTER TABLE spare_parts 
  ALTER COLUMN id TYPE TEXT;

-- 5. Zmeniť typ part_id v history tabuľkách na TEXT  
ALTER TABLE spare_parts_history
  ALTER COLUMN part_id TYPE TEXT;

ALTER TABLE part_price_history
  ALTER COLUMN part_id TYPE TEXT;

-- 6. Obnoviť foreign key constraints
ALTER TABLE spare_parts_history
  ADD CONSTRAINT spare_parts_history_part_id_fkey 
  FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE CASCADE;

ALTER TABLE part_price_history
  ADD CONSTRAINT part_price_history_part_id_fkey 
  FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE CASCADE;

-- 7. Zapnúť RLS späť
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_price_history ENABLE ROW LEVEL SECURITY;

-- Overenie
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'spare_parts' AND column_name = 'id';
