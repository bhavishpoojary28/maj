import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, AlertTriangle, CalendarClock, PackagePlus, Info, MessageSquareWarning } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import { LoadingSpinner, EmptyState } from '../components/ui';
import { supabase, type Notification } from '../lib/supabase';
import { useToast } from '../lib/toast';

const ICONS: Record<string, any> = {
  failed_inspection: AlertTriangle, maintenance_due: CalendarClock,
  new_component: PackagePlus, new_complaint: MessageSquareWarning, general: Info,
};
const TONES: Record<string, string> = {
  failed_inspection: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  maintenance_due: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
  new_component: 'bg-rail-100 text-rail-600 dark:bg-rail-500/15 dark:text-rail-300',
  new_complaint: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  general: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function Notifications() {
  const toast = useToast();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) { toast('error', error.message); setLoading(false); return; }
    setNotifs((data ?? []) as Notification[]);
    setLoading(false);
  }

  async function markAllRead() { const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false); if (error) { toast('error', error.message); return; } toast('success', 'All notifications marked as read'); load(); }
  async function markRead(n: Notification) { const { error } = await supabase.from('notifications').update({ read: true }).eq('id', n.id); if (error) { toast('error', error.message); return; } load(); }
  async function deleteNotif(n: Notification) { const { error } = await supabase.from('notifications').delete().eq('id', n.id); if (error) { toast('error', error.message); return; } toast('success', 'Notification deleted'); load(); }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Alerts for failed inspections, maintenance due, new components, and complaints">
        {notifs.some((n) => !n.read) && <button onClick={markAllRead} className="btn-secondary"><CheckCheck size={16} /> Mark all read</button>}
      </PageHeader>
      {loading ? <LoadingSpinner label="Loading notifications..." /> : notifs.length === 0 ? <div className="card"><EmptyState icon={Bell} title="No notifications" message="Alerts will appear here when inspections fail, maintenance is due, or complaints are registered." /></div> : (
        <div className="space-y-2">
          {notifs.map((n, i) => {
            const Icon = ICONS[n.type] ?? Info;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className={`card flex items-center gap-3 p-4 ${!n.read ? 'border-l-4 border-l-rail-500' : 'opacity-70'}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[n.type] ?? TONES.general}`}><Icon size={20} /></div>
                <div className="flex-1"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p><p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p><p className="mt-0.5 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p></div>
                <div className="flex gap-1">{!n.read && <button onClick={() => markRead(n)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-rail-800" title="Mark read"><CheckCheck size={16} /></button>}<button onClick={() => deleteNotif(n)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" title="Delete"><Trash2 size={16} /></button></div>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
