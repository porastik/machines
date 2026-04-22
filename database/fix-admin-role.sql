-- Fix admin role for admin@machines.local user
-- Run this in Supabase SQL Editor

-- Update user metadata to set role = 'admin'
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@machines.local';

-- Verify the change
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IN ('admin@machines.local', 'technician@machines.local');
