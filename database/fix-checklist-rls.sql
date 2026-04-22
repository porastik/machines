-- Fix RLS policies for maintenance checklists
-- Allow admins based on role in profiles table, not hardcoded email

-- ==========================================
-- 1. DROP OLD EMAIL-BASED POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;

-- ==========================================
-- 2. CREATE ROLE-BASED POLICIES
-- ==========================================

-- Admin can manage checklists (based on profile role)
CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admin can manage checklist items (based on profile role)
CREATE POLICY "Allow admin manage checklist items" ON checklist_items 
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ==========================================
-- 3. VERIFY POLICIES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('maintenance_checklists', 'checklist_items')
ORDER BY tablename, policyname;

SELECT 'RLS policies updated successfully - now based on profile.role = admin' as status;
