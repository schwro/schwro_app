-- Create program_types table for categorizing programs
CREATE TABLE IF NOT EXISTS program_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Calendar',
    color TEXT DEFAULT '#6366f1',
    visible_sections JSONB DEFAULT '["zespol", "produkcja", "atmosfera_team", "scena", "szkolka"]',
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default program type
INSERT INTO program_types (name, icon, color, is_default, sort_order)
VALUES ('Nabożeństwo niedzielne', 'Church', '#6366f1', true, 0)
ON CONFLICT DO NOTHING;

-- Add type_id column to programs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'type_id') THEN
        ALTER TABLE programs ADD COLUMN type_id INTEGER REFERENCES program_types(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add title column to programs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'title') THEN
        ALTER TABLE programs ADD COLUMN title TEXT;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(type_id);

-- Enable RLS
ALTER TABLE program_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read program types
CREATE POLICY "Allow read access to program_types" ON program_types
    FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to manage program types
CREATE POLICY "Allow insert access to program_types" ON program_types
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to program_types" ON program_types
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow delete access to program_types" ON program_types
    FOR DELETE TO authenticated USING (true);
