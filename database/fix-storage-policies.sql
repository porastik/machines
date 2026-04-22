-- Oprava Storage RLS politík pre device-images a device-manuals buckety
-- Spustite v Supabase SQL Editor

-- 1. Zmazať staré storage politiky (ak existujú)
DROP POLICY IF EXISTS "Allow authenticated users to upload device images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read device images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update device images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete device images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated users to upload device manuals" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read device manuals" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete device manuals" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read device images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read device manuals" ON storage.objects;

-- 2. Politiky pre DEVICE-IMAGES bucket (upload, read, update, delete)
CREATE POLICY "Allow authenticated users to upload device images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'device-images');

CREATE POLICY "Allow public read device images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'device-images');

CREATE POLICY "Allow authenticated users to update device images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'device-images')
  WITH CHECK (bucket_id = 'device-images');

CREATE POLICY "Allow authenticated users to delete device images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'device-images');

-- 3. Politiky pre DEVICE-MANUALS bucket (upload, read, delete)
CREATE POLICY "Allow authenticated users to upload device manuals"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'device-manuals');

CREATE POLICY "Allow public read device manuals"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'device-manuals');

CREATE POLICY "Allow authenticated users to delete device manuals"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'device-manuals');

-- Overenie storage politík
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
