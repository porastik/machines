-- =====================================================
-- RÝCHLE VYTVORENIE ADMIN A TECHNICIAN ÚČTOV
-- =====================================================
-- Spustite tento skript v Supabase SQL Editor

-- 1. Najprv sa uistite, že máte správny trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Získať rolu z user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'technician');
  
  -- Vytvoriť profil s rolou
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vytvorte trigger ak neexistuje
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PO SPUSTENÍ TOHTO SKRIPTU:
-- =====================================================
-- Choďte do Supabase Dashboard → Authentication → Users
-- a vytvorte používateľov manuálne s User Metadata:
-- 
-- ADMIN:
-- Email: admin@example.com
-- Password: admin123 (alebo vaše heslo)
-- User Metadata: {"role": "admin"}
--
-- TECHNICIAN:
-- Email: technician@example.com
-- Password: tech123 (alebo vaše heslo)
-- User Metadata: {"role": "technician"}

-- =====================================================
-- OVERENIE ČI FUNGUJE TRIGGER
-- =====================================================
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as metadata_role,
  pu.role as users_table_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;
