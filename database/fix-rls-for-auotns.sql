-- RLS policy for auotns@gmail.com
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;

CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

CREATE POLICY "Allow admin manage checklist items" ON checklist_items FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');
