# 🚀 Setup Guide pre Supabase Projekt "machines"

## 📋 Projekt Info

- **Názov:** machines
- **Project ID:** mplehgphscavhyxebzvo
- **URL:** https://mplehgphscavhyxebzvo.supabase.co

---

## ✅ KROK 1: Získať Anon Key

1. Otvorte: https://supabase.com/dashboard/project/mplehgphscavhyxebzvo
2. V ľavom menu kliknite: **Settings** (ikona ozubeného kolesa)
3. Kliknite: **API**
4. Skopírujte **anon public** key (dlhý text začínajúci "eyJhbG...")

5. **Aktualizujte súbor:**

   ```
   src/environments/environment.ts
   ```

   Nahraďte `YOUR_ANON_KEY_HERE` vašim anon key

6. **Aktualizujte aj produkčný súbor:**
   ```
   src/environments/environment.prod.ts
   ```
   Rovnako nahraďte `YOUR_ANON_KEY_HERE`

---

## ✅ KROK 2: Vytvoriť databázovú schému

### 2.1 Základná schéma

1. V Supabase Dashboard prejdite na: **SQL Editor**
2. Kliknite: **+ New query**
3. Skopírujte obsah súboru: `database/supabase-schema.sql`
4. Vložte do SQL editora a kliknite **Run**

### 2.2 Rozšírené funkcie pre náhradné diely

1. Znovu v SQL Editor kliknite: **+ New query**
2. Skopírujte obsah súboru: `database/supabase-advanced-parts.sql`
3. Vložte do SQL editora a kliknite **Run**

---

## ✅ KROK 3: Vytvoriť používateľov

### Nastavenie Trigger (jednorázovo)

1. V SQL Editor spustite:

```sql
-- Vytvorenie triggeru pre automatické priradenie rolí
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'technician');

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Vytvorenie Admin používateľa

1. V ľavom menu kliknite: **Authentication** → **Users**
2. Kliknite: **Add user** → **Create new user**
3. Vyplňte:
   ```
   Email:              admin@machines.local
   Password:           Admin123!
   Auto Confirm User:  ✅ (zaškrtnite)
   ```
4. Kliknite na **User Metadata** a pridajte:
   ```json
   {
     "role": "admin"
   }
   ```
5. Kliknite: **Create user**

### Vytvorenie Technician používateľa (voliteľné)

1. Opakujte kroky vyššie s týmito údajmi:
   ```
   Email:              tech@machines.local
   Password:           Tech123!
   Auto Confirm User:  ✅
   User Metadata:      {"role": "technician"}
   ```

---

## ✅ KROK 4: Nastaviť Storage (pre fotky a manuály)

### 4.1 Vytvoriť Storage Buckets

1. V ľavom menu kliknite: **Storage**
2. Kliknite: **Create a new bucket**

**Bucket 1 - Fotky zariadení:**

```
Name:       device-images
Public:     ✅ (verejný prístup)
```

**Bucket 2 - PDF manuály:**

```
Name:       device-manuals
Public:     ✅ (verejný prístup)
```

### 4.2 Nastaviť Storage Policies

V SQL Editor spustite:

```sql
-- Policy pre device-images
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'device-images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-images');

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'device-images');

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-images');

-- Policy pre device-manuals
CREATE POLICY "Anyone can view manuals"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'device-manuals');

CREATE POLICY "Authenticated users can upload manuals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'device-manuals');

CREATE POLICY "Authenticated users can update manuals"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'device-manuals');

CREATE POLICY "Authenticated users can delete manuals"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'device-manuals');
```

---

## ✅ KROK 5: Pridať testové dáta (voliteľné)

V SQL Editor spustite:

```sql
-- Súbor: database/supabase-test-data.sql
-- Pridá 4 testové zariadenia, diely a maintenance logy
```

Skopírujte obsah súboru `database/supabase-test-data.sql` a spustite.

---

## ✅ KROK 6: Overiť nastavenie

### 6.1 Kontrola tabuliek

V SQL Editor spustite:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Mali by ste vidieť:

- ✅ devices
- ✅ spare_parts
- ✅ maintenance_logs
- ✅ spare_parts_history
- ✅ users
- ✅ suppliers
- ✅ part_price_history

### 6.2 Kontrola používateľov

```sql
SELECT
  au.email,
  au.raw_user_meta_data->>'role' as role,
  pu.role as role_in_users_table
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;
```

Mali by ste vidieť admin používateľa s rolou "admin".

### 6.3 Kontrola Storage Buckets

```sql
SELECT * FROM storage.buckets;
```

Mali by ste vidieť:

- device-images
- device-manuals

---

## ✅ KROK 7: Reštartovať aplikáciu

1. Zastavte dev server (Ctrl+C)
2. Spustite znovu:
   ```bash
   npm run dev
   ```
3. Otvorte: http://localhost:3000
4. Prihláste sa:
   - Email: `admin@machines.local`
   - Heslo: `Admin123!`

---

## 🎯 Kontrolný zoznam

- [ ] Získaný a nastavený Anon Key v environment.ts
- [ ] Spustený supabase-schema.sql
- [ ] Spustený supabase-advanced-parts.sql
- [ ] Vytvorený trigger pre používateľov
- [ ] Vytvorený admin používateľ
- [ ] Vytvorené Storage buckets (device-images, device-manuals)
- [ ] Nastavené Storage policies
- [ ] Pridané testové dáta (voliteľné)
- [ ] Reštartovaná aplikácia
- [ ] Úspešné prihlásenie

---

## 🐛 Riešenie problémov

### Chyba: "Invalid API key"

- Skontrolujte či ste správne skopírovali anon key
- Reštartujte aplikáciu po zmene environment súborov

### Chyba: "relation does not exist"

- Spustite database skripty v správnom poradí
- Skontrolujte v SQL Editore či tabuľky existujú

### Nemôžem sa prihlásiť

- Skontrolujte či používateľ má správnu rolu v User Metadata
- Overte že trigger funguje (spustite kontrolný SQL)
- Skúste vytvoriť používateľa znovu

### Storage nefunguje

- Skontrolujte či buckety sú vytvorené
- Overte že storage policies sú aktívne
- Skúste nahrať súbor cez Supabase Dashboard

---

## 📞 Užitočné odkazy

- **Dashboard:** https://supabase.com/dashboard/project/mplehgphscavhyxebzvo
- **API Docs:** https://supabase.com/dashboard/project/mplehgphscavhyxebzvo/api
- **SQL Editor:** https://supabase.com/dashboard/project/mplehgphscavhyxebzvo/sql
- **Authentication:** https://supabase.com/dashboard/project/mplehgphscavhyxebzvo/auth/users
- **Storage:** https://supabase.com/dashboard/project/mplehgphscavhyxebzvo/storage/buckets

---

✅ **Po dokončení týchto krokov bude vaša aplikácia plne funkčná!**
