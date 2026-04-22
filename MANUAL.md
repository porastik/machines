# 🔧 Centrum Údržby Zariadení

## Popis aplikácie

**Centrum Údržby Zariadení** je moderná webová aplikácia pre profesionálnu správu údržby priemyselných zariadení. Aplikácia umožňuje efektívne sledovanie stavu strojov, plánovanie údržby, správu náhradných dielov a analýzu prestojov.

### 🌐 Online prístup

**https://porastik.github.io/machines/**

---

## 📋 Hlavné funkcie

### 1. Dashboard (Nástenka)

- Prehľad všetkých zariadení podľa stavu (v prevádzke, v údržbe, mimo prevádzky)
- Upozornenia na nízke zásoby náhradných dielov
- Celkový prestoj zariadení
- Nedávna aktivita údržby
- Plánovaná údržba na aktuálny mesiac

### 2. Zariadenia

- Kompletný zoznam všetkých zariadení
- Filtrovanie a vyhľadávanie
- Pridávanie nových zariadení
- Detail zariadenia s:
  - Základnými informáciami (názov, typ, umiestnenie)
  - Stavom zariadenia
  - Históriou údržby
  - QR kódom pre rýchly prístup
  - Checklistom údržby
  - Nahrávaním manuálov (PDF)
  - Elektrickou revíziou

### 3. Náhradné diely

- Skladová evidencia dielov
- Upozornenia na minimálne zásoby
- História zmien množstva
- Priradenie dielov k zariadeniam
- Správa dodávateľov

### 4. Údržba

- Záznamy o všetkých údržbách
- Filtrovanie podľa typu (plánovaná/neodkladná)
- Filtrovanie podľa roku
- Export do PDF a Excel

### 5. Analýza prestojov

- Grafy prestojov podľa zariadení
- Porovnanie období (mesiac vs mesiac, rok vs rok)
- Štatistiky a trendy

### 6. Admin sekcia (iba pre administrátorov)

- Správa používateľov
- Správa checklistov údržby
- Zálohovanie a obnova dát

---

## 👥 Používateľské role

### Administrátor

- Plný prístup ku všetkým funkciám
- Správa používateľov
- Mazanie zariadení a záznamov
- Správa checklistov

### Technik

- Zobrazenie všetkých zariadení a dielov
- Pridávanie a úprava zariadení
- Zaznamenávanie údržby
- Úprava vlastných záznamov

---

## 🚀 Návod na použitie

### Prihlásenie

1. Otvorte aplikáciu na https://porastik.github.io/machines/
2. Zadajte email a heslo
3. Kliknite na "Prihlásiť sa"

**Účty:**

- Admin: auotns@gmail.com
- Technik: technik@auo.com

### Pridanie nového zariadenia

1. Prejdite do sekcie **Zariadenia**
2. Kliknite na **"+ Pridať nové zariadenie"**
3. Vyplňte formulár:
   - ID zariadenia (unikátny identifikátor)
   - Názov
   - Typ zariadenia
   - Umiestnenie
   - Výrobca (voliteľné)
   - Perióda údržby
4. Kliknite na **"Uložiť"**

### Zaznamenanie údržby

1. Prejdite do **detailu zariadenia**
2. Kliknite na **"Zaznamenať údržbu"**
3. Vyplňte:
   - Typ údržby (plánovaná/neodkladná)
   - Trvanie v minútach
   - Poznámky k údržbe
4. Kliknite na **"Dokončiť a zaznamenať"**

### Správa náhradných dielov

1. Prejdite do sekcie **Náhradné diely**
2. Pre pridanie nového dielu kliknite **"+ Pridať diel"**
3. Pre úpravu množstva kliknite na **"+"** alebo **"-"** pri konkrétnom diele
4. Diely s množstvom pod minimom sú zvýraznené červeno

### Export dát

- **PDF export:** Kliknite na tlačidlo "Exportovať PDF" v príslušnej sekcii
- **Excel export:** Kliknite na tlačidlo "Exportovať Excel"
- Dostupné v sekciách: Zariadenia, Údržba, Náhradné diely

### QR kódy

- Každé zariadenie má vygenerovaný QR kód
- QR kód obsahuje: ID, názov a umiestnenie zariadenia
- Môžete ho vytlačiť a nalepiť na zariadenie pre rýchly prístup

---

## ⚙️ Technické informácie

### Technológie

- **Frontend:** Angular 20.3.0
- **Backend:** Supabase (PostgreSQL + Auth)
- **Styling:** TailwindCSS
- **Export:** jsPDF, xlsx
- **Grafy:** Chart.js

### Podporované prehliadače

- Google Chrome (odporúčaný)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Offline režim

Aplikácia vyžaduje internetové pripojenie pre plnú funkcionalitu. Pri výpadku spojenia sa zobrazí upozornenie.

---

## 🔒 Bezpečnosť

- Všetky dáta sú uložené v zabezpečenej Supabase databáze
- Autentifikácia pomocou JWT tokenov
- Row Level Security (RLS) politiky na databázovej úrovni
- Heslá nie sú nikdy uložené v plain texte

---

## 📞 Podpora

Pri problémoch s aplikáciou kontaktujte administrátora alebo vytvorte issue na GitHub repozitári:
https://github.com/porastik/machines/issues

---

## 📝 Changelog

### Verzia 1.0.0 (Január 2026)

- Prvé produkčné vydanie
- Dashboard s prehľadom zariadení
- Kompletná správa zariadení
- Správa náhradných dielov s históriou
- Záznamy údržby s filtrovanie
- Analýza prestojov s grafmi
- Export do PDF a Excel
- Správa používateľov (admin)
- Checklisty údržby
- Elektrické revízie
- Viacjazyčná podpora (SK, EN, DE)
- Responzívny dizajn pre mobily

---

_© 2026 Centrum Údržby Zariadení. Všetky práva vyhradené._
