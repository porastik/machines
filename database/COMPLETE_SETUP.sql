-- ========================================
-- KOMPLETNÝ SETUP PRE MACHINES PROJECT
-- ========================================
-- Spustite tento skript v Supabase SQL Editor
-- Project: machines (mplehgphscavhyxebzvo)
-- ========================================

-- ========================================
-- ČASŤ 1: ZÁKLADNÉ TABUĽKY
-- ========================================

-- Users tabuľka
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'technician')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices tabuľka
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('operational', 'maintenance', 'offline')),
  image_url TEXT,
  manual_url TEXT,
  last_maintenance DATE,
  next_maintenance DATE NOT NULL,
  maintenance_period VARCHAR(50) CHECK (maintenance_period IN ('monthly', 'quarterly', 'semi-annually', 'annually')),
  specifications JSONB,
  downtime DECIMAL(10,2) DEFAULT 0,
  last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  electrical_inspection_date DATE,
  electrical_inspection_period INTEGER CHECK (electrical_inspection_period IN (1, 2, 3, 4, 5, 10)),
  electrical_inspection_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers tabuľka (pre rozšírené funkcie)
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

-- Spare Parts tabuľka
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(255) NOT NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  current_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  serial_number VARCHAR(100),
  batch_number VARCHAR(100),
  expiry_date DATE,
  manufacturing_date DATE,
  warranty_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Logs tabuľka
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  technician VARCHAR(255) NOT NULL,
  notes TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('scheduled', 'emergency')),
  duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (duration_minutes >= 15),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spare Parts History tabuľka
CREATE TABLE IF NOT EXISTS public.spare_parts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'set')),
  notes TEXT,
  changed_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Part Price History tabuľka
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

-- ========================================
-- ČASŤ 2: INDEXY PRE VÝKON
-- ========================================

CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_next_maintenance ON public.devices(next_maintenance);
CREATE INDEX IF NOT EXISTS idx_spare_parts_sku ON public.spare_parts(sku);
CREATE INDEX IF NOT EXISTS idx_spare_parts_device ON public.spare_parts(device_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_supplier ON spare_parts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_serial ON spare_parts(serial_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_batch ON spare_parts(batch_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_expiry ON spare_parts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_device ON public.maintenance_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON public.maintenance_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_part_price_history_part ON part_price_history(part_id);
CREATE INDEX IF NOT EXISTS idx_part_price_history_date ON part_price_history(effective_date DESC);

-- ========================================
-- ČASŤ 3: FUNKCIE A TRIGGERY
-- ========================================

-- Funkcia pre automatické updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery pre updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON public.devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spare_parts_updated_at ON public.spare_parts;
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pre vytvorenie používateľského profilu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'technician');
  
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pre históriu cien
CREATE OR REPLACE FUNCTION log_part_price_change()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trigger_log_part_price_change ON spare_parts;
CREATE TRIGGER trigger_log_part_price_change
  AFTER INSERT OR UPDATE ON spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION log_part_price_change();

-- ========================================
-- ČASŤ 4: ROW LEVEL SECURITY (RLS)
-- ========================================

-- Povoliť RLS na všetkých tabuľkách
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_price_history ENABLE ROW LEVEL SECURITY;

-- Politiky pre users
CREATE POLICY "Users sú viditeľní pre všetkých autentifikovaných používateľov"
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Iba admini môžu upravovať používateľov"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Politiky pre devices
CREATE POLICY "Devices sú viditeľné pre všetkých autentifikovaných používateľov"
  ON public.devices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Iba admini môžu vytvárať devices"
  ON public.devices FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu upravovať devices"
  ON public.devices FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu mazať devices"
  ON public.devices FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Politiky pre spare_parts
CREATE POLICY "Spare parts sú viditeľné pre všetkých"
  ON public.spare_parts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Iba admini môžu vytvárať spare parts"
  ON public.spare_parts FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu upravovať spare parts"
  ON public.spare_parts FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu mazať spare parts"
  ON public.spare_parts FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Politiky pre maintenance_logs
CREATE POLICY "Logs sú viditeľné pre všetkých"
  ON public.maintenance_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users môžu vytvárať logs"
  ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Iba admini môžu mazať logs"
  ON public.maintenance_logs FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Politiky pre suppliers
CREATE POLICY "Suppliers sú viditeľné pre všetkých"
  ON suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Iba admini môžu vytvárať dodávateľov"
  ON suppliers FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu upravovať dodávateľov"
  ON suppliers FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY "Iba admini môžu mazať dodávateľov"
  ON suppliers FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- Politiky pre part_price_history
CREATE POLICY "História cien je viditeľná pre všetkých"
  ON part_price_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Iba admini môžu pridávať históriu cien"
  ON part_price_history FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

-- ========================================
-- ČASŤ 5: TESTOVÉ DÁTA (DODÁVATELIA)
-- ========================================

INSERT INTO suppliers (name, contact_person, email, phone, address, is_active, notes)
VALUES 
  ('Industrial Parts Ltd.', 'John Smith', 'john@industrialparts.com', '+421 123 456 789', 'Priemyselná 1, Bratislava', true, 'Hlavný dodávateľ priemyselných komponentov'),
  ('Tech Components SK', 'Maria Novak', 'maria@techcomponents.sk', '+421 987 654 321', 'Technická 15, Košice', true, 'Špecialista na elektronické súčiastky'),
  ('MachineSupply Europe', 'Peter Wagner', 'peter@machinesupply.eu', '+43 1234 5678', 'Wien, Austria', true, 'Medzinárodný dodávateľ')
ON CONFLICT DO NOTHING;

-- ========================================
-- ✅ HOTOVO!
-- ========================================
-- Databáza je pripravená.
-- Ďalší krok: Vytvorte používateľov cez Authentication UI
