-- Diagnostika používateľov a ich rolí
-- Spustite v Supabase SQL Editor

-- 1. Zobraziť všetkých používateľov z auth.users s ich metadata
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role_from_metadata,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Zobraziť používateľov z public.users
SELECT 
  id,
  email,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Ak admin nemá správnu rolu, opravte ju týmto príkazom:
-- (Nahraďte EMAIL vašim admin emailom)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@machines.local';

-- 4. Overte, že sa rola nastavila:
SELECT 
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@machines.local';
