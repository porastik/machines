-- Oprava RLS politík pre všetky tabuľky
-- Spustite v Supabase SQL Editor

-- 1. Zmazať staré politiky
DROP POLICY IF EXISTS "Allow authenticated read devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated insert devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated update devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated delete devices" ON devices;

DROP POLICY IF EXISTS "Allow authenticated read spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated insert spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated update spare_parts" ON spare_parts;
DROP POLICY IF EXISTS "Allow authenticated delete spare_parts" ON spare_parts;

DROP POLICY IF EXISTS "Allow authenticated read maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated insert maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated update maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated delete maintenance_logs" ON maintenance_logs;

DROP POLICY IF EXISTS "Allow authenticated read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated delete suppliers" ON suppliers;

DROP POLICY IF EXISTS "Allow authenticated read part_price_history" ON part_price_history;
DROP POLICY IF EXISTS "Allow authenticated insert part_price_history" ON part_price_history;

DROP POLICY IF EXISTS "Allow authenticated read spare_parts_history" ON spare_parts_history;
DROP POLICY IF EXISTS "Allow authenticated insert spare_parts_history" ON spare_parts_history;

DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update users" ON users;

-- 2. Vytvoriť nové politiky pre DEVICES
CREATE POLICY "Allow authenticated read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete devices"
  ON devices FOR DELETE
  TO authenticated
  USING (true);

-- 3. Vytvoriť nové politiky pre SPARE_PARTS
CREATE POLICY "Allow authenticated read spare_parts"
  ON spare_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert spare_parts"
  ON spare_parts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update spare_parts"
  ON spare_parts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete spare_parts"
  ON spare_parts FOR DELETE
  TO authenticated
  USING (true);

-- 4. Vytvoriť nové politiky pre MAINTENANCE_LOGS
CREATE POLICY "Allow authenticated read maintenance_logs"
  ON maintenance_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert maintenance_logs"
  ON maintenance_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update maintenance_logs"
  ON maintenance_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete maintenance_logs"
  ON maintenance_logs FOR DELETE
  TO authenticated
  USING (true);

-- 5. Vytvoriť nové politiky pre SUPPLIERS
CREATE POLICY "Allow authenticated read suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- 6. Vytvoriť nové politiky pre PART_PRICE_HISTORY
CREATE POLICY "Allow authenticated read part_price_history"
  ON part_price_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert part_price_history"
  ON part_price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Vytvoriť nové politiky pre SPARE_PARTS_HISTORY
CREATE POLICY "Allow authenticated read spare_parts_history"
  ON spare_parts_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert spare_parts_history"
  ON spare_parts_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. Vytvoriť nové politiky pre USERS
CREATE POLICY "Allow authenticated read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update users"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Overenie politík
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
