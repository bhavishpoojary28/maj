-- Add new columns to track_fittings for enhanced asset management
ALTER TABLE track_fittings ADD COLUMN IF NOT EXISTS division text DEFAULT '';
ALTER TABLE track_fittings ADD COLUMN IF NOT EXISTS section text DEFAULT '';
ALTER TABLE track_fittings ADD COLUMN IF NOT EXISTS track_type text DEFAULT 'BG';
ALTER TABLE track_fittings ADD COLUMN IF NOT EXISTS manufacturer text DEFAULT '';
ALTER TABLE track_fittings ADD COLUMN IF NOT EXISTS maintenance_date date;

-- Add engineer assignment to maintenance_logs
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical'));
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS engineer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add laser_marking table for laser marking simulator
CREATE TABLE IF NOT EXISTS laser_markings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fit_id uuid REFERENCES track_fittings(id) ON DELETE CASCADE,
  qr_id text,
  laser_power integer NOT NULL DEFAULT 20,
  temperature numeric(5,2) NOT NULL DEFAULT 25.00,
  speed integer NOT NULL DEFAULT 100,
  material text NOT NULL DEFAULT 'Manganese Steel',
  estimated_time integer NOT NULL DEFAULT 45,
  status text NOT NULL DEFAULT 'Idle' CHECK (status IN ('Idle','Running','Completed','Emergency Stop')),
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE laser_markings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_laser_staff" ON laser_markings;
CREATE POLICY "select_laser_staff" ON laser_markings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_laser_staff" ON laser_markings;
CREATE POLICY "insert_laser_staff" ON laser_markings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_laser_staff" ON laser_markings;
CREATE POLICY "update_laser_staff" ON laser_markings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_laser_staff" ON laser_markings;
CREATE POLICY "delete_laser_staff" ON laser_markings FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_laser_markings_fit_id ON laser_markings(fit_id);
