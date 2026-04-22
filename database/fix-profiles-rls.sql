-- Create profiles table and RLS policies for user management

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'technician',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'technician')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert existing users into profiles (if any)
INSERT INTO profiles (id, email, role)
SELECT id, email, 'technician'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert on signup" ON profiles;

-- Allow admin to read all profiles
CREATE POLICY "Allow admin read all profiles" ON profiles FOR SELECT TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com');

-- Allow admin to update all profiles
CREATE POLICY "Allow admin update profiles" ON profiles FOR UPDATE TO authenticated 
  USING (auth.jwt()->>'email' = 'auotns@gmail.com')
  WITH CHECK (auth.jwt()->>'email' = 'auotns@gmail.com');

-- Allow users to read their own profile
CREATE POLICY "Allow users read own profile" ON profiles FOR SELECT TO authenticated 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users update own profile" ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert for new user registration (triggered by auth)
CREATE POLICY "Allow insert on signup" ON profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);
