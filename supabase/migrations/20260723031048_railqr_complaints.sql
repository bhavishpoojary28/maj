/*
# RailQR AI — Complaints table

Adds a complaints table so staff can register complaints against scanned track
fittings (e.g. damaged marking, misalignment, wear).

## 1. New Tables
- `complaints` — complaint records linked to a track fitting.
  - id, fit_id (FK track_fittings), qr_id, complaint_type, priority, description,
    status (Open/In Progress/Resolved/Rejected), registered_by (FK auth.users),
    resolved_at, created_at, updated_at.

## 2. Security
- RLS enabled.
- Shared organizational data: any authenticated staff can read/write complaints
  (TO authenticated, USING/WITH CHECK true).

## 3. Notes
- `fit_id` references track_fittings with ON DELETE CASCADE.
- Status defaults to 'Open'; priority defaults to 'Medium'.
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fit_id uuid REFERENCES track_fittings(id) ON DELETE CASCADE,
  qr_id text,
  complaint_type text NOT NULL DEFAULT 'Other',
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Critical')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Rejected')),
  registered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_complaints_staff" ON complaints;
CREATE POLICY "select_complaints_staff" ON complaints FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_complaints_staff" ON complaints;
CREATE POLICY "insert_complaints_staff" ON complaints FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_complaints_staff" ON complaints;
CREATE POLICY "update_complaints_staff" ON complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_complaints_staff" ON complaints;
CREATE POLICY "delete_complaints_staff" ON complaints FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_complaints_fit_id ON complaints(fit_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
