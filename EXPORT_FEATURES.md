# Export funkcionalita - Dokumentácia

## 📊 Prehľad

Aplikácia Equipment Maintenance Hub obsahuje komplexné exportné funkcie pre reporty a KPI metriky s podporou PDF a Excel formátov.

## 🎯 Funkcie

### 1. **Downtime Report Export**

#### PDF Export

- **Umiestnenie**: Sekcia Downtime → Tlačidlo "📄 Export PDF"
- **Obsah**:
  - Hlavička s názvom reportu a obdobím
  - Sumárna sekcia s KPI metrikami:
    - Celkový downtime (hodiny)
    - Priemerné % (s porovnaním s targetom 2.5%)
    - Počet zariadení v/nad target
    - Počet záznamov údržby
  - Porovnávacia sekcia (ak je aktívna):
    - Delta hodnôt medzi obdobiami
    - Vizuálne indikátory zlepšenia/zhoršenia
    - Status zmien (✓ Zlepšenie / ⚠️ Zhoršenie)
  - Detailná tabuľka zariadení:
    - ID a názov zariadenia
    - Typ zariadenia
    - Downtime v hodinách
    - Percentuálne hodnoty
    - Status (V target / Nad target)
    - Delta hodnoty pri porovnaní
  - Päta stránky s dátumom generovania a číslom strany

#### Excel Export

- **Umiestnenie**: Sekcia Downtime → Tlačidlo "📊 Export Excel"
- **Štruktúra súboru**:

  **Sheet 1: Sumár**

  - Názov reportu a obdobie
  - Dátum generovania
  - Sumárne KPI metriky
  - Porovnávacie dáta (ak sú dostupné)
  - Status zmien medzi obdobiami

  **Sheet 2: Zariadenia**

  - Detailné dáta pre každé zariadenie
  - Stĺpce:
    - ID zariadenia
    - Názov
    - Typ
    - Downtime (hodiny a minúty)
    - Percentuálne hodnoty
    - Target %
    - Status
    - Počet plánovanej údržby
    - Počet neodkladnej údržby
    - Porovnávacie hodnoty (ak sú aktívne)
    - Delta hodnoty
  - Automatická šírka stĺpcov pre lepšiu čitateľnosť

### 2. **Maintenance Logs Export**

#### Excel Export

- **Umiestnenie**: Dashboard → Sekcia "Recent Maintenance Activity" → Tlačidlo "📊 Export všetkých záznamov (Excel)"
- **Obsah**:
  - Všetky záznamy údržby zo systému
  - Stĺpce:
    - Dátum a čas
    - Názov zariadenia
    - Typ údržby (Plánovaná/Neodkladná)
    - Trvanie v minútach
    - Meno technika
    - Poznámky
  - Automatické formátovanie dátumov podľa SK locale
  - Optimalizovaná šírka stĺpcov

## 🔧 Technické detaily

### Použité knižnice

```json
{
  "jspdf": "^2.x.x", // PDF generovanie
  "jspdf-autotable": "^3.x.x", // Tabuľky v PDF
  "xlsx": "^0.18.x", // Excel súbory
  "chart.js": "^4.x.x" // Grafy (pripravené pre budúce rozšírenia)
}
```

### Služba: ExportService

**Umiestnenie**: `src/services/export.service.ts`

#### Metódy:

##### `exportDowntimeToPdf()`

```typescript
exportDowntimeToPdf(
  stats: DeviceDowntimeStats[],
  totalStats: TotalStats,
  periodLabel: string,
  comparisonStats?: DeviceDowntimeStats[],
  comparisonTotalStats?: TotalStats,
  comparisonLabel?: string
): void
```

Generuje PDF report s downtime štatistikami.

##### `exportDowntimeToExcel()`

```typescript
exportDowntimeToExcel(
  stats: DeviceDowntimeStats[],
  totalStats: TotalStats,
  periodLabel: string,
  comparisonStats?: DeviceDowntimeStats[],
  comparisonTotalStats?: TotalStats,
  comparisonLabel?: string
): void
```

Generuje Excel súbor s dvoma sheet-mi (Sumár + Zariadenia).

##### `exportMaintenanceLogsToExcel()`

```typescript
exportMaintenanceLogsToExcel(
  logs: MaintenanceLog[],
  devices: Device[],
  filename?: string
): void
```

Exportuje všetky záznamy údržby do Excel súboru.

##### `exportDevicesToCsv()`

```typescript
exportDevicesToCsv(
  devices: Device[],
  filename?: string
): void
```

Exportuje zoznam zariadení do CSV súboru s UTF-8 BOM.

## 📱 Použitie

### Downtime Report s porovnaním

1. Prejdite do sekcie **Downtime**
2. Vyberte požadované obdobie v dropdowne
3. Aktivujte porovnanie (Mesiac vs. Mesiac alebo Rok vs. Rok)
4. Vyberte porovnávacie obdobie
5. Kliknite na **Export PDF** alebo **Export Excel**
6. Súbor sa automaticky stiahne do priečinka Downloads

**Názov súboru**: `downtime-report-[obdobie]-[timestamp].pdf/xlsx`

### Maintenance Logs Export

1. Prejdite na **Dashboard**
2. V sekcii "Recent Maintenance Activity" kliknite na **Export všetkých záznamov**
3. Excel súbor sa stiahne so všetkými záznamami údržby

**Názov súboru**: `maintenance-logs-[timestamp].xlsx`

## 🎨 Vizuálne prvky

### PDF Report

- **Farebné schémy**:
  - Hlavička tabuľiek: Modrá (#428bca)
  - Porovnávacia sekcia: Fialová (#9c27b0)
  - Zlepšenie: Zelená (#10b981)
  - Zhoršenie: Červená (#ef4444)

### Excel Report

- **Štruktúra**:
  - Prvý sheet: Sumárne dáta (názov, dátum, metriky)
  - Druhý sheet: Detailné tabuľkové dáta
  - Automatická šírka stĺpcov
  - Jasná hierarchia informácií

## 🔮 Budúce rozšírenia

### Plánované funkcie:

- [ ] Pridanie grafov do PDF reportov (Chart.js integrácia)
- [ ] Export s custom filtrom (dátumový rozsah, zariadenia)
- [ ] Automatické periodické reporty (email delivery)
- [ ] Dashboard KPI report s vizualizáciami
- [ ] Export spare parts inventory reportov
- [ ] Export supplier performance reportov
- [ ] Scheduled reports pre manažment

## 📋 Príklady použitia

### Export mesačného downtime reportu

```typescript
// V komponente
exportToPdf(): void {
  const stats = this.deviceDowntimeStats();
  const total = this.totalStats();
  const periodLabel = this.currentMonthLabel();

  this.exportService.exportDowntimeToPdf(stats, total, periodLabel);
}
```

### Export s porovnaním rokov

```typescript
exportToExcel(): void {
  const stats = this.deviceDowntimeStats();
  const total = this.totalStats();
  const periodLabel = this.currentMonthLabel();
  const compStats = this.comparisonDowntimeStats();
  const compTotal = this.comparisonTotalStats();
  const compLabel = `rok ${this.comparisonYearLabel()}`;

  this.exportService.exportDowntimeToExcel(
    stats, total, periodLabel,
    compStats, compTotal, compLabel
  );
}
```

## 🐛 Troubleshooting

### Problém: PDF sa nestiahne

- Skontrolujte konzolu prehliadača pre chyby
- Uistite sa, že sú nainštalované knižnice: `npm install jspdf jspdf-autotable`

### Problém: Excel súbor je prázdny

- Skontrolujte, či dáta existujú v komponente
- Overte, že XLSX knižnica je správne naimportovaná

### Problém: Slovenské znaky sa nezobrazujú správne

- PDF používa Helvetica font (bez podpory diakritiky)
- Pre budúce verzie zvážte custom font s diakritikous (např. Roboto, Open Sans)

## 📞 Podpora

Pri problémoch s export funkciami:

1. Skontrolujte konzolu prehliadača pre error logy
2. Overte verzie knižníc v `package.json`
3. Vytvorte issue v GitHub repozitári s opisom problému a console logmi

---

**Posledná aktualizácia**: 8. január 2026  
**Verzia**: 1.0.0
