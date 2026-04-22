# Rozšírené riadenie náhradných dielov 📦

Komplexné vylepšenia pre správu skladových zásob náhradných dielov s pokročilými funkciami.

## ✨ Nové funkcie

### 1. **Dodávatelia (Suppliers)**

- ✅ Kompletná databáza dodávateľov s kontaktnými údajmi
- ✅ Správa aktívnych/neaktívnych dodávateľov
- ✅ Kontaktné informácie (email, telefón, web, adresa)
- ✅ Poznámky pre jednotlivých dodávateľov
- ✅ Filtrovanie a vyhľadávanie dodávateľov

### 2. **História cien**

- ✅ Automatické sledovanie zmien cien dielov
- ✅ Evidencia dodávateľa pre každú cenu
- ✅ Dátum platnosti ceny
- ✅ Poznámky k zmene ceny
- ✅ Trigger v databáze pre automatické zaznamenávanie zmien

### 3. **Sériové čísla**

- ✅ Možnosť evidencie sériového čísla pre unikátne diely
- ✅ Sledovanie jednotlivých kusov drahých komponentov
- ✅ Index pre rýchle vyhľadávanie podľa SN

### 4. **Batche a expirácie**

- ✅ Číslo batchu/šarže pre sledovanie výroby
- ✅ Dátum expirácie pre diely s obmedzenou životnosťou
- ✅ Dátum výroby
- ✅ Záruka v mesiacoch
- ✅ Automatické indexovanie pre upozornenia na expirované diely

## 📁 Upravené súbory

### Modely (`src/models.ts`)

```typescript
// Rozšírený SparePart interface
export interface SparePart {
  // ... existujúce polia
  supplierId?: string;
  supplierName?: string;
  currentPrice?: number;
  currency?: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  warrantyMonths?: number;
}

// Nový Supplier interface
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Nový PartPriceHistory interface
export interface PartPriceHistory {
  id: string;
  partId: string;
  price: number;
  currency: string;
  supplierId?: string;
  effectiveDate: string;
  notes?: string;
  changedBy: string;
  createdAt: string;
}
```

### Databáza (`database/supabase-advanced-parts.sql`)

- ✅ Nové stľpce v `spare_parts` tabuľke
- ✅ Nová tabuľka `suppliers`
- ✅ Nová tabuľka `part_price_history`
- ✅ Automatický trigger pre zaznamenávanie zmien cien
- ✅ Row Level Security politiky
- ✅ Indexy pre optimálny výkon
- ✅ Testové dáta pre dodávateľov

### Služby

- ✅ **DataService**: CRUD operácie pre dodávateľov a históriu cien
- ✅ **SupabaseService**: Aktualizované typové definície databázy

### Komponenty

- ✅ **SupplierListComponent**: Nový komponent pre správu dodávateľov
  - Pridávanie/úprava/mazanie dodávateľov
  - Aktivácia/deaktivácia
  - Filtrovanie a vyhľadávanie
  - Kompletný CRUD s Supabase

### Routing

- ✅ Nová cesta `/suppliers`
- ✅ Pridaná navigácia v sidebar menu

### Preklady

- ✅ 40+ nových prekladov v 3 jazykoch (EN, SK, DE)
- ✅ Kompletná lokalizácia nových funkcií

## 🚀 Inštalácia

### 1. Aplikovať databázové zmeny

V Supabase SQL editore spustite:

```sql
-- Spustite obsah súboru
database/supabase-advanced-parts.sql
```

Tento skript:

- Pridá nové stľpce do existujúcej tabuľky `spare_parts`
- Vytvorí tabuľky `suppliers` a `part_price_history`
- Nastaví všetky potrebné indexy a politiky
- Pridá testových 3 dodávateľov

### 2. Reštart aplikácie

```bash
npm run dev
```

### 3. Overenie funkcií

Po spustení aplikácie:

1. Prihláste sa do aplikácie
2. V menu kliknite na **"Dodávatelia"** (Suppliers)
3. Mali by ste vidieť testových dodávateľov
4. Skúste pridať nového dodávateľa
5. Pri editácii náhradných dielov budú dostupné nové polia

## 📊 Použitie

### Správa dodávateľov

```typescript
// Načítať dodávateľov
this.dataService.loadSuppliers().subscribe((suppliers) => {
  console.log("Dodávatelia:", suppliers);
});

// Vytvoriť nového dodávateľa
const newSupplier = {
  name: "ABC Parts s.r.o.",
  email: "info@abcparts.sk",
  phone: "+421 123 456 789",
  isActive: true,
};
this.dataService.createSupplier(newSupplier).subscribe();

// Aktualizovať dodávateľa
this.dataService
  .updateSupplier(supplierId, {
    phone: "+421 999 888 777",
  })
  .subscribe();
```

### História cien

```typescript
// Získať históriu cien pre diel
this.dataService.getPartPriceHistory(partId).subscribe((history) => {
  history.forEach((h) => {
    console.log(`${h.effectiveDate}: ${h.price} ${h.currency}`);
  });
});

// Pridať novú cenu (automaticky sa zaznamená do histórie cez trigger)
this.dataService
  .updatePart(partId, {
    currentPrice: 199.99,
    currency: "EUR",
    supplierId: "sup-001",
  })
  .subscribe();
```

### Doplnkové informácie o dieloch

```typescript
// Vytvoriť diel s rozšírenými informáciami
const newPart = {
  name: "Premium Bearing",
  sku: "BRG-PRO-500",
  quantity: 10,
  minQuantity: 5,
  location: "A-15",
  // Nové polia:
  supplierId: "sup-001",
  currentPrice: 149.99,
  currency: "EUR",
  serialNumber: "SN-2024-001234",
  batchNumber: "BATCH-2024-05",
  manufacturingDate: "2024-05-15",
  expiryDate: "2029-05-15",
  warrantyMonths: 24,
};
```

## 🔐 Oprávnenia

- **Admin**: Plný prístup k všetkým funkciám

  - Vytváranie/úprava/mazanie dodávateľov
  - Pridávanie záznamov do histórie cien
  - Správa všetkých rozšírených polí dielov

- **Technician**: Čítací prístup
  - Prezeranie dodávateľov
  - Prezeranie histórie cien
  - Prezeranie rozšírených informácií o dieloch

## 📝 Dátový model

### Vzťahy

```
spare_parts (1) -----> (1) suppliers
     |
     | (1)
     |
     v
     | (N)
part_price_history
```

### Automatické procesy

1. **Trigger pri zmene ceny**

   - Pri aktualizácii `current_price` v `spare_parts`
   - Automaticky vytvorí záznam v `part_price_history`
   - Zaznamená dátum, cenu, menu, dodávateľa a používateľa

2. **Auto-update timestamp**
   - Tabuľka `suppliers` má automatické `updated_at`
   - Spúšťa sa pri každej aktualizácii záznamu

## 🎯 Budúce rozšírenia

Ďalšie možné vylepšenia (neboli implementované):

- ⏭️ Dashboard widget pre expirujúce diely
- ⏭️ Porovnanie cien medzi dodávateľmi
- ⏭️ Hromadný import dielov z CSV
- ⏭️ QR kódy pre sériové čísla
- ⏭️ Email notifikácie pre expirujúce diely
- ⏭️ Grafické zobrazenie histórie cien

## 🐛 Troubleshooting

### Problém: "Table suppliers does not exist"

**Riešenie**: Spustite SQL migráciu v Supabase

### Problém: "Permission denied for table suppliers"

**Riešenie**: Skontrolujte RLS politiky, mali by byť nastavené automaticky skriptom

### Problém: História cien sa nevytvára automaticky

**Riešenie**: Skontrolujte či existuje trigger `trigger_log_part_price_change`

```sql
-- Kontrola triggera
SELECT * FROM pg_trigger WHERE tgname = 'trigger_log_part_price_change';
```

## ✅ Checklist implementácie

- [x] Rozšírené modely TypeScript
- [x] SQL migrácia pre databázu
- [x] Aktualizovaný Supabase service
- [x] CRUD operácie v DataService
- [x] UI komponent pre dodávateľov
- [x] Routing a navigácia
- [x] Preklady (EN, SK, DE)
- [x] RLS politiky
- [x] Automatické triggery
- [x] Dokumentácia

---

**Vylepšenia hotové!** ✨ Aplikácia teraz podporuje kompletné rozšírené riadenie náhradných dielov s dodávateľmi, históriou cien, sériovými číslami a expiráciiami.
