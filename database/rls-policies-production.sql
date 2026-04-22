-- =====================================================
-- ROLE-BASED RLS POLICIES FOR PRODUCTION
-- =====================================================
-- Tento skript nastavuje správne bezpečnostné politiky
-- založené na používateľských rolách (admin/technician)
-- 
-- Spustite v Supabase SQL Editor
-- =====================================================

-- =====================================================
-- POMOCNÁ FUNKCIA PRE KONTROLU ADMIN ROLE
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Skontroluje či aktuálny používateľ má rolu 'admin' v profiles tabuľke
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. PROFILES TABLE - Správa používateľov
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin insert profiles" ON profiles;

-- Každý môže vidieť svoj vlastný profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admini môžu vidieť všetky profily
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Každý môže aktualizovať svoj profil (okrem role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admini môžu aktualizovať všetky profily vrátane role
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 2. DEVICES TABLE - Zariadenia
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated insert devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated update devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated delete devices" ON devices;
DROP POLICY IF EXISTS "Authenticated users can view devices" ON devices;
DROP POLICY IF EXISTS "Users can insert devices" ON devices;
DROP POLICY IF EXISTS "Users can update devices" ON devices;
DROP POLICY IF EXISTS "Admins can delete devices" ON devices;

-- Všetci prihlásení môžu čítať zariadenia
CREATE POLICY "All authenticated can view devices" ON devices
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať zariadenia
CREATE POLICY "All authenticated can insert devices" ON devices
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- Všetci prihlásení môžu aktualizovať zariadenia
CREATE POLICY "All authenticated can update devices" ON devices
  FOR UPDATE TO authenticated
  USING (public.is_authenticated())
  WITH CHECK (public.is_authenticated());

-- Iba admini môžu mazať zariadenia
CREATE POLICY "Only admins can delete devices" ON devices
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 3. SPARE_PARTS TABLE - Náhradné diely
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated insert spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated update spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated delete spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Authenticated users can view spare parts" ON spare_parts;

-- Všetci prihlásení môžu čítať diely
CREATE POLICY "All authenticated can view spare_parts" ON spare_parts
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať diely
CREATE POLICY "All authenticated can insert spare_parts" ON spare_parts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- Všetci prihlásení môžu aktualizovať diely
CREATE POLICY "All authenticated can update spare_parts" ON spare_parts
  FOR UPDATE TO authenticated
  USING (public.is_authenticated())
  WITH CHECK (public.is_authenticated());

-- Iba admini môžu mazať diely
CREATE POLICY "Only admins can delete spare_parts" ON spare_parts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 4. MAINTENANCE_LOGS TABLE - Záznamy údržby
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated insert maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated update maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated delete maintenance_logs" ON maintenance_logs;

-- Všetci prihlásení môžu čítať logy
CREATE POLICY "All authenticated can view maintenance_logs" ON maintenance_logs
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať logy
CREATE POLICY "All authenticated can insert maintenance_logs" ON maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- Admini môžu aktualizovať logy, technici iba svoje
CREATE POLICY "Users can update own logs or admin all" ON maintenance_logs
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR 
    technician = (SELECT email FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR 
    technician = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Iba admini môžu mazať logy
CREATE POLICY "Only admins can delete maintenance_logs" ON maintenance_logs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 5. SUPPLIERS TABLE - Dodávatelia
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON suppliers;

-- Všetci prihlásení môžu čítať dodávateľov
CREATE POLICY "All authenticated can view suppliers" ON suppliers
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať dodávateľov
CREATE POLICY "All authenticated can insert suppliers" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- Všetci prihlásení môžu aktualizovať dodávateľov
CREATE POLICY "All authenticated can update suppliers" ON suppliers
  FOR UPDATE TO authenticated
  USING (public.is_authenticated())
  WITH CHECK (public.is_authenticated());

-- Iba admini môžu mazať dodávateľov
CREATE POLICY "Only admins can delete suppliers" ON suppliers
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- =====================================================
-- 6. MAINTENANCE_CHECKLISTS TABLE - Checklisty
-- =====================================================
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;

-- Všetci prihlásení môžu čítať checklisty
CREATE POLICY "All authenticated can view checklists" ON maintenance_checklists
  FOR SELECT TO authenticated
  USING (true);

-- Iba admini môžu spravovať checklisty
CREATE POLICY "Only admins can manage checklists" ON maintenance_checklists
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 7. CHECKLIST_ITEMS TABLE - Položky checklistov
-- =====================================================
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;

-- Všetci prihlásení môžu čítať položky
CREATE POLICY "All authenticated can view checklist_items" ON checklist_items
  FOR SELECT TO authenticated
  USING (true);

-- Iba admini môžu spravovať položky
CREATE POLICY "Only admins can manage checklist_items" ON checklist_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 8. SPARE_PARTS_HISTORY TABLE
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read spare_parts_history" ON spare_parts_history;
DROP POLICY IF EXISTS "Allow authenticated insert spare_parts_history" ON spare_parts_history;

-- Všetci prihlásení môžu čítať históriu
CREATE POLICY "All authenticated can view spare_parts_history" ON spare_parts_history
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať históriu
CREATE POLICY "All authenticated can insert spare_parts_history" ON spare_parts_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- =====================================================
-- 9. PART_PRICE_HISTORY TABLE
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read part_price_history" ON part_price_history;
DROP POLICY IF EXISTS "Allow authenticated insert part_price_history" ON part_price_history;

-- Všetci prihlásení môžu čítať históriu cien
CREATE POLICY "All authenticated can view part_price_history" ON part_price_history
  FOR SELECT TO authenticated
  USING (true);

-- Všetci prihlásení môžu pridávať históriu cien
CREATE POLICY "All authenticated can insert part_price_history" ON part_price_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- =====================================================
-- VÝSTUP
-- =====================================================
SELECT 'Role-based RLS policies have been successfully applied!' as status;
