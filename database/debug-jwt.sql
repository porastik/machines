-- Debug JWT token - run this while logged in as admin@machines.local
-- This will show what's in your JWT token

SELECT 
  auth.jwt() as full_jwt,
  auth.jwt()->>'email' as jwt_email,
  auth.jwt()->>'role' as jwt_role,
  auth.uid() as user_id;

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'maintenance_checklists';
