import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Role = 'admin' | 'engineer' | 'operator';

export type Profile = { id: string; full_name: string; role: Role; zone: string; created_at: string };

export type TrackFitting = {
  id: string; component_id: string; qr_id: string; track_number: string;
  railway_zone: string; division: string | null; section: string | null;
  station_name: string; component_type: string; material: string;
  track_type: string | null; manufacturer: string | null;
  installation_date: string; last_inspection_date: string | null;
  maintenance_date: string | null;
  status: 'Active' | 'Under Maintenance' | 'Decommissioned' | 'Flagged';
  gps_lat: number | null; gps_lng: number | null; image_url: string | null;
  created_by: string | null; created_at: string;
};

export type Inspection = {
  id: string; fit_id: string | null; qr_id: string | null;
  result: 'PASS' | 'FAIL'; confidence: number; problems: string[];
  image_url: string | null; inspector_id: string | null; created_at: string;
};

export type MaintenanceLog = {
  id: string; fit_id: string | null; qr_id: string | null;
  scheduled_date: string; completed_date: string | null; type: string;
  notes: string | null; status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  performed_by: string | null; engineer_id: string | null; created_at: string;
};

export type Notification = {
  id: string; type: 'failed_inspection' | 'maintenance_due' | 'new_component' | 'general' | 'new_complaint';
  title: string; message: string; fit_id: string | null; read: boolean; created_at: string;
};

export type AuditLog = {
  id: string; user_id: string | null; action: string; entity: string;
  entity_id: string | null; details: string | null; created_at: string;
};

export type Complaint = {
  id: string; fit_id: string | null; qr_id: string | null;
  complaint_type: string; priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string; status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected';
  photo_url: string | null; is_defect: boolean;
  registered_by: string | null; resolved_at: string | null;
  created_at: string; updated_at: string;
};

export const RAILWAY_ZONES = [
  { code: 'NR', name: 'Northern Railway' }, { code: 'ER', name: 'Eastern Railway' },
  { code: 'WR', name: 'Western Railway' }, { code: 'SR', name: 'Southern Railway' },
  { code: 'CR', name: 'Central Railway' }, { code: 'SCR', name: 'South Central Railway' },
  { code: 'NER', name: 'North Eastern Railway' }, { code: 'SER', name: 'South Eastern Railway' },
  { code: 'NWR', name: 'North Western Railway' }, { code: 'ECR', name: 'East Central Railway' },
];

export const COMPONENT_TYPES = [
  'Rail Joint', 'Fish Plate', 'Sleepers', 'Ballast', 'Switch', 'Crossing',
  'Track Bolt', 'Pandrol Clip', 'Rail Anchor', 'Turnout',
];

export const MATERIALS = ['Manganese Steel', 'Carbon Steel', 'Cast Iron', 'Concrete', 'Prestressed Concrete', 'Composite'];

export const TRACK_TYPES = ['BG', 'MG', 'NG', 'Electrified BG', 'Non-Electrified BG'];

export const COMPLAINT_TYPES = [
  'Component Damage', 'Misalignment', 'Corrosion', 'Loose Fitting',
  'Wear and Tear', 'Other',
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator', engineer: 'Engineer', operator: 'Operator',
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-accent-500/15 text-accent-600 dark:text-accent-400',
  engineer: 'bg-rail-500/15 text-rail-600 dark:text-rail-300',
  operator: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};
