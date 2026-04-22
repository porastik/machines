# Maintenance Checklists - Checklisty údržby

## Prehľad

Systém checklistov poskytuje štandardizované postupy údržby pre jednotlivé typy zariadení. Každý checklist obsahuje zoznam úloh, ktoré by mali byť vykonané počas údržby zariadenia.

## Funkcie

### Pre technikov:

- ✅ Zobrazenie checklistu pri údržbe zariadenia
- ✅ Označovanie splnených úloh
- ✅ Pridávanie poznámok k jednotlivým úlohám
- ⚠️ Upozornenie na povinné úlohy a bezpečnostné poznámky
- ⏱️ Odhadovaný čas na každú úlohu

### Pre administrátorov:

- 📋 Vytvorenie nových checklistov pre typy zariadení
- ✏️ Úprava existujúcich checklistov
- ➕ Pridávanie a odstraňovanie úloh
- 🔄 Zmena poradia úloh
- 🔒 Označenie úloh ako povinných

## Databázová štruktúra

### Tabuľky:

1. **maintenance_checklists** - Šablóny checklistov
2. **checklist_items** - Jednotlivé úlohy v checklist šablóne
3. **maintenance_log_checklists** - Sledovanie použitia checklistu pri údržbe
4. **checklist_item_completions** - Označenie splnených úloh

## Použitie

### 1. Nastavenie checklistu (Admin)

```sql
-- Spustite SQL skript v Supabase SQL Editor
-- Súbor: database/supabase-maintenance-checklists.sql
```

Skript vytvorí:

- Databázové tabuľky
- RLS politiky
- Príkladové checklisty pre CNC frézu a Lis

### 2. Použitie checklistu (Technik)

1. Prejdite na **Device Detail** stránku zariadenia
2. Zalogte údržbu v sekcii "Log Maintenance"
3. Po uložení sa zobrazí **Checklist** pre daný typ zariadenia
4. Kliknite na **"Spustiť Checklist"**
5. Postupne označujte jednotlivé úlohy ako splnené
6. Pridávajte poznámky k úlohám podľa potreby
7. Po splnení všetkých povinných úloh kliknite **"Dokončiť Checklist"**

### 3. Správa checklistov (Admin)

V budúcnosti bude k dispozícii Admin UI pre správu checklistov. Momentálne je možné upravovať checklisty priamo v Supabase:

```sql
-- Pridanie novej úlohy do checklistu
INSERT INTO checklist_items (
  checklist_id,
  order_index,
  task_description,
  is_mandatory,
  estimated_minutes,
  safety_note
) VALUES (
  'CHK-000001',
  11,
  'Kontrola mazacieho systému',
  true,
  10,
  'Vypnúť stroj pred kontrolou'
);

-- Úprava existujúcej úlohy
UPDATE checklist_items
SET task_description = 'Nový popis úlohy',
    is_mandatory = false,
    estimated_minutes = 15
WHERE id = 'CHKI-000001';

-- Deaktivácia checklistu
UPDATE maintenance_checklists
SET is_active = false
WHERE id = 'CHK-000001';
```

## API - ChecklistService

### Metódy:

#### `getChecklists(deviceType?: string)`

Načítanie všetkých aktívnych checklistov (voliteľne filtrované podľa typu zariadenia)

#### `getChecklistWithItems(checklistId: string)`

Načítanie checklistu so všetkými úlohami

#### `startChecklistForMaintenance(maintenanceLogId, checklistId, technician)`

Spustenie checklistu pre konkrétnu údržbu

#### `toggleItemCompletion(completionId, completed, completedBy, notes?)`

Označenie/odznačenie úlohy ako splnenej

#### `completeChecklist(maintenanceLogChecklistId, notes?)`

Dokončenie celého checklistu

## UI Komponenty

### ChecklistComponent

Standalone komponent pre zobrazenie a prácu s checklistom

**Input:**

- `deviceType: string` - Typ zariadenia
- `maintenanceLogId?: string` - ID maintenance logu

**Output:**

- `checklistCompleted: EventEmitter` - Event po dokončení checklistu

**Použitie:**

```html
<app-checklist
  [deviceType]="device.type"
  [maintenanceLogId]="lastMaintenanceLogId"
  (checklistCompleted)="onChecklistCompleted()"
>
</app-checklist>
```

## Preklady

Systém podporuje 3 jazyky: SK, EN, DE

Kľúčové preklady:

- `MAINTENANCE_CHECKLISTS` - Nadpis sekcie
- `START_CHECKLIST` - Tlačidlo na spustenie
- `MANDATORY` / `OPTIONAL` - Označenie úloh
- `SAFETY_NOTE` - Bezpečnostná poznámka
- `COMPLETE_CHECKLIST` - Dokončiť checklist
- `MANDATORY_ITEMS_REQUIRED` - Upozornenie

## Best Practices

### Pre vytvorenie dobrých checklistov:

1. **Poradie úloh** - Usporiadajte úlohy v logickom poradí vykonania
2. **Jasné popisy** - Používajte konkrétne a zrozumiteľné názvy úloh
3. **Bezpečnosť** - Zvýraznite bezpečnostné poznámky (napr. LOTO procedúra)
4. **Povinné úlohy** - Označte kritické úlohy ako povinné
5. **Časové odhady** - Pridajte reálne odhady času potrebného na úlohu
6. **Testovanie** - Vždy otestujte nový checklist v praxi

### Príklad dobre strukturovaného checklistu:

```
1. [POVINNÉ] Vypnúť hlavný vypínač (2 min) ⚠️ LOTO procedúra
2. [POVINNÉ] Vizuálna kontrola (5 min)
3. [POVINNÉ] Kontrola hladiny chladiacej kvapaliny (3 min)
4. [VOLITEĽNÉ] Kontrola stavu nástrojov (8 min)
5. [POVINNÉ] Premazanie vodiacich líšt (15 min) ⚠️ Použiť špecifikovaný mazací olej
6. [POVINNÉ] Testovací chod stroja (5 min)
```

## Rozšírenia v budúcnosti

- 📱 Admin UI pre správu checklistov
- 📊 Štatistiky splnených checklistov
- 📷 Priloženie fotografií k úlohám
- 🔔 Automatické pripomienky neukončených checklistov
- 📤 Export checklistov do PDF
- 🔄 Klonovanie checklistov medzi typmi zariadení
- ⏰ Časové sledovanie trvania jednotlivých úloh

## Problémy a riešenia

### Checklist sa nezobrazuje

- Skontrolujte, či existuje aktívny checklist pre daný typ zariadenia
- Overte, že máte správne nastavené device.type

### Nemôžem označiť úlohu

- Skontrolujte, či nie je checklist už dokončený
- Overte, že ste prihlásený

### Nemôžem dokončiť checklist

- Skontrolujte, či ste splnili všetky povinné úlohy
- Červená hviezda označuje povinnú úlohu

## Podpora

Pre otázky alebo problémy kontaktujte administrátora systému.
