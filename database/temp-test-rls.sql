-- TEMPORARY TEST - Allow all authenticated users to insert
-- This is just to test if RLS is the problem
-- DO NOT USE IN PRODUCTION

DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;

CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);
