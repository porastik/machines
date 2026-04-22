# Databázová migrácia - Rozšírené riadenie náhradných dielov

## 📋 Prehľad zmien

Táto migrácia pridáva pokročilé funkcie pre správu náhradných dielov:

### Nové tabuľky

1. **suppliers** - Databáza dodávateľov
2. **part_price_history** - História cenových zmien

### Rozšírené stĺpce v spare_parts

- `supplier_id` - Odkaz na dodávateľa
- `current_price` - Aktuálna cena dielu
- `currency` - Mena (EUR, USD, atď.)
- `serial_number` - Sériové číslo
- `batch_number` - Číslo batchu/šarže
- `expiry_date` - Dátum expirácie
- `manufacturing_date` - Dátum výroby
- `warranty_months` - Záruka v mesiacoch

## 🚀 Inštalácia

### Krok 1: Prihláste sa do Supabase

1. Otvorte [supabase.com](https://supabase.com)
2. Vyberte váš projekt
3. V ľavom menu kliknite na **SQL Editor**

### Krok 2: Spustite migračný skript

1. Kliknite na **"+ New query"**
2. Skopírujte celý obsah súboru `database/supabase-advanced-parts.sql`
3. Vložte do SQL editora
4. Kliknite **"Run"** (alebo Ctrl+Enter)

### Krok 3: Overenie

Po úspešnom spustení by ste mali vidieť:

```
Success. No rows returned
```

Skontrolujte vytvorené tabuľky:

```sql
-- V SQL editore spustite:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('suppliers', 'part_price_history');
```

Mali by ste vidieť obe tabuľky.

## 📊 Schéma databázy

```
┌─────────────────┐
│  spare_parts    │
├─────────────────┤
│ id              │
│ name            │
│ sku             │
│ quantity        │
│ location        │
│ supplier_id     │◄─────┐
│ current_price   │      │
│ currency        │      │
│ serial_number   │      │
│ batch_number    │      │
│ expiry_date     │      │
│ manufacturing...│      │
│ warranty_months │      │
└─────────────────┘      │
                         │
        ┌────────────────┴─────────────┐
        │                              │
┌───────▼──────────┐     ┌─────────────▼───────┐
│   suppliers      │     │ part_price_history  │
├──────────────────┤     ├─────────────────────┤
│ id               │     │ id                  │
│ name             │     │ part_id             │
│ contact_person   │     │ price               │
│ email            │     │ currency            │
│ phone            │     │ supplier_id         │
│ address          │     │ effective_date      │
│ website          │     │ notes               │
│ notes            │     │ changed_by          │
│ is_active        │     │ created_at          │
│ created_at       │     └─────────────────────┘
│ updated_at       │
└──────────────────┘
```

## 🔐 Row Level Security (RLS)

Migračný skript automaticky nastavuje bezpečnostné politiky:

### Suppliers

- **SELECT**: Všetci prihlásení používatelia
- **INSERT/UPDATE/DELETE**: Iba admini

### Part Price History

- **SELECT**: Všetci prihlásení používatelia
- **INSERT**: Iba admini
- **UPDATE/DELETE**: Zakázané (audit trail)

## 🤖 Automatické triggery

### 1. Trigger pre históriu cien

```sql
CREATE TRIGGER trigger_log_part_price_change
  AFTER INSERT OR UPDATE ON spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION log_part_price_change();
```

**Čo robí:**

- Pri vytvorení nového dielu s cenou → vytvorí prvý záznam v histórii
- Pri zmene ceny existujúceho dielu → pridá nový záznam do histórie
- Automaticky zaznamená dátum, cenu, menu a používateľa

### 2. Trigger pre updated_at

```sql
CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();
```

**Čo robí:**

- Pri každej aktualizácii dodávateľa nastaví `updated_at` na aktuálny čas

## 📝 Testové dáta

Skript automaticky vytvorí 3 testových dodávateľov:

1. **Industrial Parts Ltd.** (Bratislava, SK)
2. **Tech Components SK** (Košice, SK)
3. **MachineSupply Europe** (Wien, AT)

Môžete ich použiť na testovanie alebo vymazať:

```sql
DELETE FROM suppliers WHERE name LIKE '%Ltd.%';
```

## 🔍 Užitočné dotazy

### Zobraziť všetkých dodávateľov

```sql
SELECT * FROM suppliers WHERE is_active = true ORDER BY name;
```

### Zobraziť diely s informáciami o dodávateľovi

```sql
SELECT
  sp.name,
  sp.sku,
  sp.current_price,
  sp.currency,
  s.name as supplier_name,
  s.email as supplier_email
FROM spare_parts sp
LEFT JOIN suppliers s ON sp.supplier_id = s.id;
```

### Zobraziť históriu cien pre diel

```sql
SELECT
  ph.effective_date,
  ph.price,
  ph.currency,
  s.name as supplier_name,
  ph.changed_by,
  ph.notes
FROM part_price_history ph
LEFT JOIN suppliers s ON ph.supplier_id = s.id
WHERE ph.part_id = 'your-part-id'
ORDER BY ph.effective_date DESC;
```

### Nájsť expirujúce diely (do 3 mesiacov)

```sql
SELECT
  name,
  sku,
  expiry_date,
  DATE_PART('day', expiry_date::timestamp - NOW()) as days_until_expiry
FROM spare_parts
WHERE expiry_date IS NOT NULL
  AND expiry_date::timestamp <= NOW() + INTERVAL '3 months'
ORDER BY expiry_date;
```

### Zobraziť diely podľa sériového čísla

```sql
SELECT * FROM spare_parts
WHERE serial_number = 'SN-2024-001234';
```

## ⚠️ Rollback (Zrušenie zmien)

Ak potrebujete zrušiť migráciu:

```sql
-- POZOR: Týmto vymažete všetky dáta z nových tabuliek!

-- 1. Odstrániť triggery
DROP TRIGGER IF EXISTS trigger_log_part_price_change ON spare_parts;
DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;

-- 2. Odstrániť funkcie
DROP FUNCTION IF EXISTS log_part_price_change();
DROP FUNCTION IF EXISTS update_suppliers_updated_at();

-- 3. Odstrániť view
DROP VIEW IF EXISTS parts_with_supplier;

-- 4. Odstrániť tabuľky
DROP TABLE IF EXISTS part_price_history CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- 5. Odstrániť nové stĺpce z spare_parts
ALTER TABLE spare_parts
  DROP COLUMN IF EXISTS supplier_id,
  DROP COLUMN IF EXISTS current_price,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS serial_number,
  DROP COLUMN IF EXISTS batch_number,
  DROP COLUMN IF EXISTS expiry_date,
  DROP COLUMN IF EXISTS manufacturing_date,
  DROP COLUMN IF EXISTS warranty_months;
```

## 🐛 Riešenie problémov

### Chyba: "relation already exists"

**Dôvod**: Tabuľky už existujú  
**Riešenie**: Skript používa `IF NOT EXISTS`, takže je bezpečné ho spustiť opakovane

### Chyba: "permission denied"

**Dôvod**: Nedostatočné oprávnenia  
**Riešenie**: Musíte byť vlastník projektu alebo mať admin práva

### Chyba: "column does not exist"

**Dôvod**: Starý kód sa pokúša pristupovať k novým stĺpcom pred migráciou  
**Riešenie**: Najprv aplikujte migráciu, potom reštartujte aplikáciu

### Trigger sa nespúšťa

**Kontrola:**

```sql
-- Zoznam všetkých triggerov
SELECT * FROM pg_trigger WHERE tgrelid = 'spare_parts'::regclass;

-- Test manuálneho spustenia
SELECT log_part_price_change();
```

## 📞 Podpora

Pri problémoch s migráciou:

1. Skontrolujte Supabase logs (Logs → Postgres Logs)
2. Overte že máte správnu verziu PostgreSQL (podporované: 12+)
3. Skontrolujte či máte dostatok storage priestoru

## ✅ Kontrolný zoznam

Po úspešnej migrácii skontrolujte:

- [ ] Tabuľky `suppliers` a `part_price_history` existujú
- [ ] Tabuľka `spare_parts` má nové stĺpce
- [ ] RLS politiky sú aktívne
- [ ] Triggery sú vytvorené a aktívne
- [ ] Indexy existujú (zrýchľujú dotazy)
- [ ] Testové dáta sú načítané
- [ ] View `parts_with_supplier` funguje

```sql
-- Rýchly test
SELECT COUNT(*) FROM suppliers; -- Malo by vrátiť 3
SELECT COUNT(*) FROM part_price_history; -- Malo by vrátiť 0 (zatiaľ)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'spare_parts'
  AND column_name IN ('supplier_id', 'current_price', 'serial_number');
-- Malo by vrátiť 3 riadky
```

---

**Hotovo!** 🎉 Databáza je pripravená na rozšírené riadenie náhradných dielov.
