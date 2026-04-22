-- Complete admin setup for auotns@gmail.com
-- Run this script in Supabase SQL Editor

-- ==========================================
-- 1. UPDATE MAINTENANCE CHECKLISTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;

CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

CREATE POLICY "Allow admin manage checklist items" ON checklist_items FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

-- ==========================================
-- 2. UPDATE PROFILES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Allow admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin insert profiles" ON profiles;

CREATE POLICY "Allow admin read all profiles" ON profiles FOR SELECT TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com');

CREATE POLICY "Allow admin update profiles" ON profiles FOR UPDATE TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

CREATE POLICY "Allow admin insert profiles" ON profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

-- ==========================================
-- 3. UPDATE ADMIN PROFILE ROLE
-- ==========================================
-- Update the profile for auotns@gmail.com to have admin role
UPDATE profiles 
SET role = 'admin', name = 'Administrator'
WHERE email = 'auotns@gmail.com';

-- If user doesn't exist in profiles yet, insert them when they sign up
-- The trigger will handle this automatically

SELECT 'Admin policies updated for auotns@gmail.com' as status;
