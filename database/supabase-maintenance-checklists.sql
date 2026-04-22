-- Maintenance Checklists Schema
-- Štandardizované postupy údržby pre jednotlivé typy zariadení

-- Create sequence if not exists (for custom TEXT IDs)
CREATE SEQUENCE IF NOT EXISTS global_id_seq START 1;

-- 1. Checklist Templates (šablóny checklistov pre typy zariadení)
CREATE TABLE IF NOT EXISTS maintenance_checklists (
  id TEXT PRIMARY KEY DEFAULT ('CHK-' || LPAD(nextval('global_id_seq')::TEXT, 6, '0')),
  device_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- 2. Checklist Items (jednotlivé úlohy v checkliste)
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY DEFAULT ('CHKI-' || LPAD(nextval('global_id_seq')::TEXT, 6, '0')),
  checklist_id TEXT NOT NULL REFERENCES maintenance_checklists(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  task_description TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  estimated_minutes INTEGER,
  safety_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Maintenance Log Checklist Completion (sledovanie použitia checklistu pri údržbe)
CREATE TABLE IF NOT EXISTS maintenance_log_checklists (
  id TEXT PRIMARY KEY DEFAULT ('MLC-' || LPAD(nextval('global_id_seq')::TEXT, 6, '0')),
  maintenance_log_id UUID NOT NULL REFERENCES maintenance_logs(id) ON DELETE CASCADE,
  checklist_id TEXT NOT NULL REFERENCES maintenance_checklists(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  technician TEXT,
  notes TEXT
);

-- 4. Checklist Item Completion (označenie jednotlivých úloh)
CREATE TABLE IF NOT EXISTS checklist_item_completions (
  id TEXT PRIMARY KEY DEFAULT ('CIC-' || LPAD(nextval('global_id_seq')::TEXT, 6, '0')),
  maintenance_log_checklist_id TEXT NOT NULL REFERENCES maintenance_log_checklists(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES checklist_items(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  completed_by TEXT
);

-- Indexy pre lepší výkon
CREATE INDEX IF NOT EXISTS idx_checklists_device_type ON maintenance_checklists(device_type);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_log_checklists_maintenance ON maintenance_log_checklists(maintenance_log_id);
CREATE INDEX IF NOT EXISTS idx_item_completions_log_checklist ON checklist_item_completions(maintenance_log_checklist_id);

-- RLS Policies
ALTER TABLE maintenance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_log_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow read checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Allow read log checklists" ON maintenance_log_checklists;
DROP POLICY IF EXISTS "Allow read item completions" ON checklist_item_completions;
DROP POLICY IF EXISTS "Allow admin manage checklists" ON maintenance_checklists;
DROP POLICY IF EXISTS "Allow admin manage checklist items" ON checklist_items;
DROP POLICY IF EXISTS "Allow insert log checklists" ON maintenance_log_checklists;
DROP POLICY IF EXISTS "Allow update log checklists" ON maintenance_log_checklists;
DROP POLICY IF EXISTS "Allow insert item completions" ON checklist_item_completions;
DROP POLICY IF EXISTS "Allow update item completions" ON checklist_item_completions;

-- Všetci autentifikovaní používatelia môžu čítať checklisty
CREATE POLICY "Allow read checklists" ON maintenance_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read checklist items" ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read log checklists" ON maintenance_log_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read item completions" ON checklist_item_completions FOR SELECT TO authenticated USING (true);

-- Admin môže spravovať checklisty
CREATE POLICY "Allow admin manage checklists" ON maintenance_checklists FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'admin@machines.local')
  WITH CHECK (auth.jwt()->>'email' = 'admin@machines.local');

CREATE POLICY "Allow admin manage checklist items" ON checklist_items FOR ALL TO authenticated 
  USING (auth.jwt()->>'email' = 'admin@machines.local')
  WITH CHECK (auth.jwt()->>'email' = 'admin@machines.local');

-- Všetci môžu zapisovať do completions
CREATE POLICY "Allow insert log checklists" ON maintenance_log_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update log checklists" ON maintenance_log_checklists FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow insert item completions" ON checklist_item_completions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update item completions" ON checklist_item_completions FOR UPDATE TO authenticated USING (true);

-- Testové dáta - príklad checklistu pre CNC frézu
INSERT INTO maintenance_checklists (id, device_type, name, description, created_by) VALUES
  ('CHK-000001', 'CNC Fréza', 'Základná preventívna údržba', 'Štandardný postup mesačnej údržby CNC frézy', 'admin@machines.local'),
  ('CHK-000002', 'Lis', 'Preventívna údržba lisu', 'Kontrola a údržba hydraulického lisu', 'admin@machines.local')
ON CONFLICT (id) DO NOTHING;

-- Delete existing checklist items if they exist
DELETE FROM checklist_items WHERE checklist_id IN ('CHK-000001', 'CHK-000002');

-- Checklist items pre CNC frézu
INSERT INTO checklist_items (checklist_id, order_index, task_description, is_mandatory, estimated_minutes, safety_note) VALUES
  ('CHK-000001', 1, 'Vypnúť hlavný vypínač a uzamknúť', true, 2, 'LOTO procedúra - povinné!'),
  ('CHK-000001', 2, 'Vizuálna kontrola stavu stroja', true, 5, null),
  ('CHK-000001', 3, 'Kontrola hladiny chladiacej kvapaliny', true, 3, 'Doplniť podľa potreby'),
  ('CHK-000001', 4, 'Kontrola tlaku vzduchu v systéme', true, 3, 'Min. 6 bar'),
  ('CHK-000001', 5, 'Vyčistenie pracovného priestoru od triesok', true, 10, 'Použiť ochranné rukavice'),
  ('CHK-000001', 6, 'Kontrola stavu nástrojov', false, 8, null),
  ('CHK-000001', 7, 'Premazanie vodiacich líšt', true, 15, 'Použiť špecifikovaný mazací olej'),
  ('CHK-000001', 8, 'Kontrola funkčnosti núdzového tlačidla', true, 2, 'Bezpečnostný test'),
  ('CHK-000001', 9, 'Kontrola spojov a skrutiek', false, 10, 'Dotiahnuť uvoľnené'),
  ('CHK-000001', 10, 'Testovací chod stroja', true, 5, 'Bez nástroja a materiálu');

-- Checklist items pre Lis
INSERT INTO checklist_items (checklist_id, order_index, task_description, is_mandatory, estimated_minutes, safety_note) VALUES
  ('CHK-000002', 1, 'Vypnúť napájanie a zabezpečiť', true, 2, 'LOTO procedúra'),
  ('CHK-000002', 2, 'Kontrola hydraulického oleja', true, 5, 'Skontrolovať hladinu a kvalitu'),
  ('CHK-000002', 3, 'Kontrola hydraulických hadíc', true, 8, 'Hľadať netesnosti'),
  ('CHK-000002', 4, 'Kontrola tlaku v systéme', true, 3, 'Nastaviť podľa špecifikácie'),
  ('CHK-000002', 5, 'Vyčistenie pracovnej oblasti', true, 10, null),
  ('CHK-000002', 6, 'Kontrola bezpečnostných zariadení', true, 5, 'Svetelné závory, tlačidlá'),
  ('CHK-000002', 7, 'Premazanie pohyblivých častí', true, 12, null),
  ('CHK-000002', 8, 'Testovací cyklus bez zaťaženia', true, 5, 'Sledovať nezvyčajné zvuky');

COMMENT ON TABLE maintenance_checklists IS 'Šablóny checklistov údržby pre jednotlivé typy zariadení';
COMMENT ON TABLE checklist_items IS 'Jednotlivé úlohy v checklist šablóne';
COMMENT ON TABLE maintenance_log_checklists IS 'Záznamy o použití checklistu pri konkrétnej údržbe';
COMMENT ON TABLE checklist_item_completions IS 'Označenie splnených úloh pri údržbe';
