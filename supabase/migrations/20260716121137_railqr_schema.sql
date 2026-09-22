/*
# RailQR AI — Core Schema

Creates the complete database for the "AI-Based Development of Laser-Based QR Code
Marking on Track Fittings for Indian Railways" platform.

## 1. New Tables

- `profiles` — extends auth.users with full_name, role (admin/inspector/maintenance), zone.
- `track_fittings` — railway track components (Component ID, QR ID, track number, zone,
  station, type, material, install/inspection dates, status, GPS, image url).
- `inspections` — AI inspection results linked to a fitting (result PASS/FAIL,
  confidence, detected problems, timestamp, inspector id).
- `maintenance_logs` — scheduled/completed maintenance per fitting.
- `notifications` — alerts (failed inspection, maintenance due, new component).
- `audit_logs` — action audit trail per user.

## 2. Security

- RLS enabled on every table.
- All tables are shared among authenticated staff (organizational data), so policies
  are scoped TO authenticated with USING (true) / WITH CHECK (true) — any signed-in
  staff member can read and write the shared railway data. This is intentionally shared,
  not a per-user ownership model.
- `profiles` is owner-scoped: a user can read/update only their own profile row,
  plus all staff can read all profiles (staff directory).

## 3. Notes

- `profiles.id` references `auth.users.id` so each auth user has exactly one profile.
- `track_fittings.qr_id` is unique.
- Timestamps default to now().
- `inspections.fit_id` and `maintenance_logs.fit_id` reference track_fittings.
*/

-- Profiles (extends auth.users with role + display info)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'Railway Staff',
  role text NOT NULL DEFAULT 'inspector' CHECK (role IN ('admin','inspector','maintenance')),
  zone text NOT NULL DEFAULT 'NR',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "read_all_profiles_staff" ON profiles;
CREATE POLICY "read_all_profiles_staff" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Track Fittings
CREATE TABLE IF NOT EXISTS track_fittings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id text NOT NULL,
  qr_id text UNIQUE NOT NULL,
  track_number text NOT NULL,
  railway_zone text NOT NULL,
  station_name text NOT NULL,
  component_type text NOT NULL,
  material text NOT NULL DEFAULT 'Manganese Steel',
  installation_date date NOT NULL DEFAULT CURRENT_DATE,
  last_inspection_date date,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Under Maintenance','Decommissioned','Flagged')),
  gps_lat double precision,
  gps_lng double precision,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE track_fittings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_fittings_staff" ON track_fittings;
CREATE POLICY "select_fittings_staff" ON track_fittings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_fittings_staff" ON track_fittings;
CREATE POLICY "insert_fittings_staff" ON track_fittings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_fittings_staff" ON track_fittings;
CREATE POLICY "update_fittings_staff" ON track_fittings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_fittings_staff" ON track_fittings;
CREATE POLICY "delete_fittings_staff" ON track_fittings FOR DELETE
  TO authenticated USING (true);

-- Inspections (AI)
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fit_id uuid REFERENCES track_fittings(id) ON DELETE CASCADE,
  qr_id text,
  result text NOT NULL CHECK (result IN ('PASS','FAIL')),
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  problems text[] NOT NULL DEFAULT '{}',
  image_url text,
  inspector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_inspections_staff" ON inspections;
CREATE POLICY "select_inspections_staff" ON inspections FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_inspections_staff" ON inspections;
CREATE POLICY "insert_inspections_staff" ON inspections FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_inspections_staff" ON inspections;
CREATE POLICY "update_inspections_staff" ON inspections FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_inspections_staff" ON inspections;
CREATE POLICY "delete_inspections_staff" ON inspections FOR DELETE
  TO authenticated USING (true);

-- Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fit_id uuid REFERENCES track_fittings(id) ON DELETE CASCADE,
  qr_id text,
  scheduled_date date NOT NULL,
  completed_date date,
  type text NOT NULL DEFAULT 'Routine',
  notes text,
  status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','In Progress','Completed','Overdue')),
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_maintenance_staff" ON maintenance_logs;
CREATE POLICY "select_maintenance_staff" ON maintenance_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_maintenance_staff" ON maintenance_logs;
CREATE POLICY "insert_maintenance_staff" ON maintenance_logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_maintenance_staff" ON maintenance_logs;
CREATE POLICY "update_maintenance_staff" ON maintenance_logs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_maintenance_staff" ON maintenance_logs;
CREATE POLICY "delete_maintenance_staff" ON maintenance_logs FOR DELETE
  TO authenticated USING (true);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('failed_inspection','maintenance_due','new_component','general')),
  title text NOT NULL,
  message text NOT NULL,
  fit_id uuid REFERENCES track_fittings(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_notifications_staff" ON notifications;
CREATE POLICY "select_notifications_staff" ON notifications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_notifications_staff" ON notifications;
CREATE POLICY "insert_notifications_staff" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_notifications_staff" ON notifications;
CREATE POLICY "update_notifications_staff" ON notifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_notifications_staff" ON notifications;
CREATE POLICY "delete_notifications_staff" ON notifications FOR DELETE
  TO authenticated USING (true);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL DEFAULT 'track_fitting',
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit_staff" ON audit_logs;
CREATE POLICY "select_audit_staff" ON audit_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_audit_staff" ON audit_logs;
CREATE POLICY "insert_audit_staff" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_track_fittings_qr_id ON track_fittings(qr_id);
CREATE INDEX IF NOT EXISTS idx_track_fittings_component_id ON track_fittings(component_id);
CREATE INDEX IF NOT EXISTS idx_track_fittings_zone ON track_fittings(railway_zone);
CREATE INDEX IF NOT EXISTS idx_inspections_fit_id ON inspections(fit_id);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_fit_id ON maintenance_logs(fit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
