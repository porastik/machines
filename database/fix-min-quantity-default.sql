-- Zmeniť default hodnotu pre min_quantity z 10 na 0
-- Toto umožní nastaviť minimálne množstvo na 0 pre diely, ktoré nepotrebujú sledovanie

-- Odstrániť starý default
ALTER TABLE public.spare_parts 
ALTER COLUMN min_quantity DROP DEFAULT;

-- Nastaviť nový default na 0
ALTER TABLE public.spare_parts 
ALTER COLUMN min_quantity SET DEFAULT 0;

-- Overiť zmenu
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'spare_parts' 
AND column_name = 'min_quantity';
