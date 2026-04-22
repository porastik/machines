-- Nastavenie admin role pre existujúceho používateľa
-- Spustite v Supabase SQL Editor

UPDATE auth.users
SET raw_user_meta_data = '{"role": "admin"}'::jsonb
WHERE email = 'admin@machines.local';

-- Overenie nastavenia
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = 'admin@machines.local';
