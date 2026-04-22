-- ========================================
-- ROZŠÍRENÉ RIADENIE NÁHRADNÝCH DIELOV
-- ========================================
-- Pridanie nových stľpcov do spare_parts
-- Vytvorenie tabuliek pre dodávateľov a históriu cien
-- ========================================

-- 1. Pridať nové stľpce do spare_parts tabuľky
ALTER TABLE spare_parts
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_months INTEGER;

-- 2. Vytvoriť tabuľku dodávateľov (suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Vytvoriť tabuľku histórie cien náhradných dielov
CREATE TABLE IF NOT EXISTS part_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  changed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexy pre výkon
CREATE INDEX IF NOT EXISTS idx_spare_parts_supplier ON spare_parts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_serial ON spare_parts(serial_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_batch ON spare_parts(batch_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_expiry ON spare_parts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_part_price_history_part ON part_price_history(part_id);
CREATE INDEX IF NOT EXISTS idx_part_price_history_date ON part_price_history(effective_date DESC);

-- 5. Funkcia pre automatickú aktualizáciu updated_at pre suppliers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- 6. Row Level Security pre suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers sú viditeľné pre všetkých autentifikovaných používateľov"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Iba admini môžu vytvárať dodávateľov"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin'
  );

CREATE POLICY "Iba admini môžu upravovať dodávateľov"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_role' = 'admin'
  );

CREATE POLICY "Iba admini môžu mazať dodávateľov"
  ON suppliers FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- 7. Row Level Security pre part_price_history
ALTER TABLE part_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "História cien je viditeľná pre všetkých autentifikovaných používateľov"
  ON part_price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Iba admini môžu pridávať históriu cien"
  ON part_price_history FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- 8. Funkcia pre automatické vytvorenie záznamu v histórii cien pri zmene ceny
CREATE OR REPLACE FUNCTION log_part_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Kontrola či sa zmenila cena
  IF (TG_OP = 'UPDATE' AND (OLD.current_price IS DISTINCT FROM NEW.current_price)) OR 
     (TG_OP = 'INSERT' AND NEW.current_price IS NOT NULL) THEN
    
    INSERT INTO part_price_history (
      part_id,
      price,
      currency,
      supplier_id,
      effective_date,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.current_price,
      COALESCE(NEW.currency, 'EUR'),
      NEW.supplier_id,
      CURRENT_DATE,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Počiatočná cena'
        ELSE 'Aktualizácia ceny'
      END,
      COALESCE(current_setting('app.current_user_email', true), 'system')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_part_price_change
  AFTER INSERT OR UPDATE ON spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION log_part_price_change();

-- 9. View pre diely s informáciami o dodávateľovi
CREATE OR REPLACE VIEW parts_with_supplier AS
SELECT 
  sp.*,
  s.name as supplier_name,
  s.email as supplier_email,
  s.phone as supplier_phone,
  s.is_active as supplier_is_active
FROM spare_parts sp
LEFT JOIN suppliers s ON sp.supplier_id = s.id;

-- 10. Testové dáta pre dodávateľov (voliteľné)
INSERT INTO suppliers (name, contact_person, email, phone, address, is_active, notes)
VALUES 
  ('Industrial Parts Ltd.', 'John Smith', 'john@industrialparts.com', '+421 123 456 789', 'Priemyselná 1, Bratislava', true, 'Hlavný dodávateľ priemyselných komponentov'),
  ('Tech Components SK', 'Maria Novak', 'maria@techcomponents.sk', '+421 987 654 321', 'Technická 15, Košice', true, 'Špecialista na elektronické súčiastky'),
  ('MachineSupply Europe', 'Peter Wagner', 'peter@machinesupply.eu', '+43 1234 5678', 'Wien, Austria', true, 'Medzinárodný dodávateľ')
ON CONFLICT DO NOTHING;

-- 11. Komentáre pre lepšiu dokumentáciu
COMMENT ON TABLE suppliers IS 'Databáza dodávateľov náhradných dielov';
COMMENT ON TABLE part_price_history IS 'História cenových zmien náhradných dielov';
COMMENT ON COLUMN spare_parts.serial_number IS 'Sériové číslo pre unikátne sledovanie dielov';
COMMENT ON COLUMN spare_parts.batch_number IS 'Číslo výrobnej šarže/batchu';
COMMENT ON COLUMN spare_parts.expiry_date IS 'Dátum expirácie pre diely s obmedzenou životnosťou';
COMMENT ON COLUMN spare_parts.warranty_months IS 'Záruka v mesiacoch od výroby';

-- HOTOVO! 
-- Pre aplikovanie týchto zmien spustite tento skript v Supabase SQL editore.
