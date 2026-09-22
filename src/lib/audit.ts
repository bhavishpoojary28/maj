import { supabase } from './supabase';

export async function logAudit(
  userId: string | null, action: string, entity = 'track_fitting',
  entityId: string | null = null, details: string | null = null,
) {
  try {
    await supabase.from('audit_logs').insert({ user_id: userId, action, entity, entity_id: entityId, details });
  } catch (e) { console.error('Failed to write audit log:', e); }
}
