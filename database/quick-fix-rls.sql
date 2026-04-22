-- Fix RLS policies - add WITH CHECK for INSERT operations
-- Run this in Supabase SQL Editor

-- Drop old policies
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'admin@machines.local')
  WITH CHECK (auth.jwt()->>'email' = 'admin@machines.local');

CREATE POLICY "Allow admin manage checklist items" ON checklist_items FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'admin@machines.local')
  WITH CHECK (auth.jwt()->>'email' = 'admin@machines.local');
