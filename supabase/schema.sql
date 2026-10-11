-- ==============================================================================
-- St. Cecilia's Choir Management Portal - Supabase PostgreSQL Schema & Seed Data
-- Church: St. Michael's Church, Koralawella
-- ==============================================================================

-- 1. CHORISTERS TABLE
CREATE TABLE IF NOT EXISTS choristers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    birthdate TEXT,
    address TEXT,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'Chorister', -- 'Chorister' | 'Organist' | 'Instrument Player'
    voice_rating INTEGER, -- 1 to 10
    voice_notes TEXT,
    pin TEXT DEFAULT '1234',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMMITTEE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS committee_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'President' | 'Secretary' | 'Treasurer' | 'Vice Treasurer' | 'Coordinator'
    phone TEXT,
    email TEXT,
    pin TEXT NOT NULL,
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FEAST NOVENAS & LITURGICAL MASSES TABLE
CREATE TABLE IF NOT EXISTS feast_novenas (
    id TEXT PRIMARY KEY,
    day_number INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    theme TEXT NOT NULL,
    novena_type TEXT NOT NULL, -- 'regular' | 'vespers' | 'feast-day'
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WEEKLY MASSES TABLE
CREATE TABLE IF NOT EXISTS weekly_masses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    language TEXT NOT NULL,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MAJOR LITURGICAL EVENTS (Carols, Easter, Christmas)
CREATE TABLE IF NOT EXISTS major_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    liturgy_type TEXT NOT NULL, -- 'carols' | 'easter' | 'christmas-new-year'
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT,
    work_and_budget JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CALENDAR CONFIG
CREATE TABLE IF NOT EXISTS calendar_config (
    id TEXT PRIMARY KEY DEFAULT 'current',
    parish_feast_date TEXT NOT NULL,
    carols_date TEXT NOT NULL,
    christmas_new_year_date TEXT NOT NULL,
    easter_date TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    member_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE choristers ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE feast_novenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_masses ENABLE ROW LEVEL SECURITY;
ALTER TABLE major_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for portal clients & API
CREATE POLICY "Allow public read choristers" ON choristers FOR SELECT USING (true);
CREATE POLICY "Allow all write choristers" ON choristers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read committee_members" ON committee_members FOR SELECT USING (true);
CREATE POLICY "Allow all write committee_members" ON committee_members FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read feast_novenas" ON feast_novenas FOR SELECT USING (true);
CREATE POLICY "Allow all write feast_novenas" ON feast_novenas FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read weekly_masses" ON weekly_masses FOR SELECT USING (true);
CREATE POLICY "Allow all write weekly_masses" ON weekly_masses FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read major_events" ON major_events FOR SELECT USING (true);
CREATE POLICY "Allow all write major_events" ON major_events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read calendar_config" ON calendar_config FOR SELECT USING (true);
CREATE POLICY "Allow all write calendar_config" ON calendar_config FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow all write audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for live multi-device syncing
ALTER PUBLICATION supabase_realtime ADD TABLE choristers;
ALTER PUBLICATION supabase_realtime ADD TABLE committee_members;
ALTER PUBLICATION supabase_realtime ADD TABLE feast_novenas;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_masses;
ALTER PUBLICATION supabase_realtime ADD TABLE major_events;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_config;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- ==============================================================================
-- INITIAL SEED DATA (Parish Officers, Organists & Choristers)
-- ==============================================================================

-- Committee Members
INSERT INTO committee_members (id, name, role, phone, email, pin, avatar_color)
VALUES
  ('cm-1', 'Joshua Peiris', 'President', '+94 77 123 4567', 'joshua.peiris@stmichaels.org', '2026', 'bg-amber-600'),
  ('cm-2', 'Ruwanga Fernando', 'Secretary', '+94 77 234 5678', 'ruwanga.fernando@stmichaels.org', '1122', 'bg-blue-600'),
  ('cm-3', 'Dinoli Fernando', 'Treasurer', '+94 77 345 6789', 'dinoli.fernando@stmichaels.org', '3344', 'bg-emerald-600'),
  ('cm-4', 'Dahami Lochana', 'Vice Treasurer', '+94 77 456 7890', 'dahami.lochana@stmichaels.org', '5566', 'bg-purple-600'),
  ('cm-5', 'Dion Fernando', 'Coordinator', '+94 77 567 8901', 'dion.fernando@stmichaels.org', '7788', 'bg-rose-600'),
  ('cm-6', 'Devsith Mortier', 'Coordinator', '+94 77 678 9012', 'devsith.mortier@stmichaels.org', '9900', 'bg-cyan-600')
ON CONFLICT (id) DO NOTHING;

-- Choristers & Appointed Parish Organists
INSERT INTO choristers (id, name, age, birthdate, address, phone_number, role, voice_rating, voice_notes, pin)
VALUES
  ('c-org-1', 'Dinoli Fernando', 23, '2003-04-18', 'No. 18, Temple Road, Koralawella', '+94 77 345 6789', 'Organist', 9, 'Senior Parish Organist & Vocal Accompanist', '3344'),
  ('c-org-2', 'Shevon Silva', 22, '2004-09-12', 'No. 45, St. Michael''s Lane, Koralawella', '+94 71 889 9012', 'Organist', 8, 'Parish Organist & Keyboard Specialist', '1234'),
  ('c-org-3', 'Shevin Fernando', 21, '2005-02-28', 'No. 12, Station Road, Moratuwa', '+94 76 554 3210', 'Organist', 8, 'Parish Organist & Liturgical Accompanist', '1234'),
  ('c-org-4', 'Chamthka', 20, '2006-07-15', 'No. 88, Beach Road, Koralawella', '+94 70 332 1144', 'Organist', 8, 'Organist & Sacred Liturgy Instrumentalist', '1234'),
  ('c-1', 'Joshua Peiris', 24, '2002-05-14', 'No. 14, St. Michael''s Road, Koralawella', '+94 77 123 4567', 'Chorister', 9, 'Choir President & Tenor Lead', '2026'),
  ('c-2', 'Ruwanga Fernando', 23, '2003-08-22', 'No. 28, Church Lane, Koralawella', '+94 77 234 5678', 'Chorister', 8, 'Liturgical Secretary & Bass Cantor', '1122'),
  ('c-4', 'Dahami Lochana', 21, '2005-03-10', 'No. 05, Sea View Avenue, Moratuwa', '+94 77 456 7890', 'Chorister', 8, 'Alto Core Vocalist', '5566'),
  ('c-5', 'Dion Fernando', 22, '2004-11-05', 'No. 33, Galle Road, Koralawella', '+94 77 567 8901', 'Chorister', 7, 'Tenor Section', '7788'),
  ('c-6', 'Devsith Mortier', 25, '2001-01-30', 'No. 9, De Soysa Road, Moratuwa', '+94 77 678 9012', 'Chorister', 8, 'Bass Section', '9900'),
  ('c-7', 'Maria Anjali', 19, '2007-06-18', 'No. 42, Cross Street, Koralawella', '+94 78 112 3344', 'Chorister', 8, 'Soprano Vocalist', '1234'),
  ('c-8', 'Roshan Silva', 26, '2000-09-12', 'No. 11, Fisherman Walk, Moratuwa', '+94 71 998 8776', 'Chorister', 7, 'Baritone', '1234'),
  ('c-9', 'Shenelle Perera', 20, '2006-04-03', 'No. 76, Convent Road, Moratuwa', '+94 75 443 2211', 'Chorister', 8, 'Alto Vocalist', '1234'),
  ('c-10', 'Kavinda Tissera', 23, '2003-12-25', 'No. 19, Holy Cross Road, Koralawella', '+94 72 667 8899', 'Chorister', 7, 'Tenor', '1234'),
  ('c-11', 'Dilani Mendis', 22, '2004-02-14', 'No. 03, Ferry Road, Moratuwa', '+94 76 221 4455', 'Chorister', 8, 'Soprano Lead', '1234'),
  ('c-12', 'Niroshan Cooray', 27, '1999-10-08', 'No. 64, St. Peter''s Path, Koralawella', '+94 70 887 6655', 'Chorister', 8, 'Bass Cantor', '1234'),
  ('c-13', 'Ashan Fonseka', 21, '2005-07-19', 'No. 22, Jubilee Road, Moratuwa', '+94 77 889 0011', 'Instrument Player', 7, 'Acoustic Guitar & Rhythm', '1234'),
  ('c-14', 'Sachini De Silva', 20, '2006-11-30', 'No. 55, Canal Bank, Koralawella', '+94 71 334 5566', 'Chorister', 7, 'Alto', '1234'),
  ('c-15', 'Pradeep Warnakulasuriya', 24, '2002-03-27', 'No. 08, Old Road, Moratuwa', '+94 75 776 8899', 'Instrument Player', 8, 'Violin & Strings', '1234')
ON CONFLICT (id) DO NOTHING;

-- Liturgical Calendar Config
INSERT INTO calendar_config (id, parish_feast_date, carols_date, christmas_new_year_date, easter_date)
VALUES ('current', '2026-09-29', '2026-12-20', '2026-12-25', '2027-03-28')
ON CONFLICT (id) DO NOTHING;
