import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Plus, Search, CheckCircle2, Download, Calendar, List, User, Flag } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import Modal from '../components/Modal';
import { StatusBadge, Pagination, EmptyState, LoadingSpinner } from '../components/ui';
import { supabase, type TrackFitting, type MaintenanceLog, type Profile } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { logAudit } from '../lib/audit';
import { exportCsv } from '../lib/qr';

const MAINT_TYPES = ['Routine', 'Emergency', 'Corrective', 'Preventive', 'Overhaul'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const PAGE_SIZE = 8;
const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Medium: 'bg-rail-100 text-rail-700 dark:bg-rail-800 dark:text-rail-300',
  High: 'bg-accent-100 text-accent-700 dark:bg-accent-800/50 dark:text-accent-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

export default function Maintenance() {
  const { session } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState<(MaintenanceLog & { fitting?: TrackFitting; engineer?: Profile })[]>([]);
  const [fittings, setFittings] = useState<TrackFitting[]>([]);
  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [form, setForm] = useState({ fit_id: '', scheduled_date: new Date().toISOString().slice(0, 10), type: 'Routine', notes: '', priority: 'Medium' as NonNullable<MaintenanceLog['priority']>, engineer_id: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    let query = supabase.from('maintenance_logs').select('*', { count: 'exact' });
    if (statusFilter) query = query.eq('status', statusFilter);
    query = query.order('scheduled_date', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count, error } = await query;
    if (error) { toast('error', error.message); setLoading(false); return; }
    const logsData = (data ?? []) as MaintenanceLog[];
    const fitIds = [...new Set(logsData.map((l) => l.fit_id).filter((v): v is string => v !== null))];
    const engIds = [...new Set(logsData.map((l) => l.engineer_id).filter((v): v is string => v !== null))];
    let fitMap: Record<string, TrackFitting> = {};
    let engMap: Record<string, Profile> = {};
    if (fitIds.length > 0) { const { data: fits } = await supabase.from('track_fittings').select('*').in('id', fitIds); fitMap = Object.fromEntries((fits ?? []).map((f: any) => [f.id, f])); }
    if (engIds.length > 0) { const { data: engs } = await supabase.from('profiles').select('*').in('id', engIds); engMap = Object.fromEntries((engs ?? []).map((e: any) => [e.id, e])); }
    let result = logsData.map((l) => ({ ...l, fitting: l.fit_id ? fitMap[l.fit_id] : undefined, engineer: l.engineer_id ? engMap[l.engineer_id] : undefined }));
    if (search) result = result.filter((l) => l.qr_id?.toLowerCase().includes(search.toLowerCase()) || l.fitting?.component_id.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase()));
    setLogs(result); setTotalPages(Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))); setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);
  useEffect(() => {
    supabase.from('track_fittings').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => setFittings((data ?? []) as TrackFitting[]));
    supabase.from('profiles').select('*').eq('role', 'engineer').then(({ data }) => setEngineers((data ?? []) as Profile[]));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!form.fit_id) { toast('warning', 'Please select a track fitting.'); return; }
    setSaving(true); const fit = fittings.find((f) => f.id === form.fit_id);
    try {
      const { error } = await supabase.from('maintenance_logs').insert({ fit_id: form.fit_id, qr_id: fit?.qr_id ?? null, scheduled_date: form.scheduled_date, type: form.type, notes: form.notes || null, status: 'Scheduled', priority: form.priority, engineer_id: form.engineer_id || null, performed_by: session?.user.id ?? null });
      if (error) throw error;
      await supabase.from('track_fittings').update({ status: 'Under Maintenance' }).eq('id', form.fit_id);
      await logAudit(session?.user.id ?? null, 'schedule_maintenance', 'maintenance_log', null, `Scheduled ${form.type} for ${fit?.qr_id}`);
      if (form.engineer_id) await supabase.from('notifications').insert({ type: 'maintenance_due', title: 'Maintenance Assigned', message: `${form.type} maintenance for ${fit?.qr_id ?? 'component'} assigned to you on ${form.scheduled_date}` });
      setModalOpen(false); setForm({ fit_id: '', scheduled_date: new Date().toISOString().slice(0, 10), type: 'Routine', notes: '', priority: 'Medium', engineer_id: '' }); load(); toast('success', 'Maintenance scheduled successfully');
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Save failed'); } finally { setSaving(false); }
  }

  async function markComplete(log: MaintenanceLog) {
    const { error } = await supabase.from('maintenance_logs').update({ status: 'Completed', completed_date: new Date().toISOString().slice(0, 10) }).eq('id', log.id);
    if (error) { toast('error', error.message); return; }
    if (log.fit_id) await supabase.from('track_fittings').update({ status: 'Active' }).eq('id', log.fit_id);
    await logAudit(session?.user.id ?? null, 'complete_maintenance', 'maintenance_log', log.id, `Completed ${log.type}`);
    toast('success', 'Maintenance marked as completed');
    load();
  }

  async function assignEngineer(logId: string, engineerId: string) {
    const { error } = await supabase.from('maintenance_logs').update({ engineer_id: engineerId || null }).eq('id', logId);
    if (error) { toast('error', error.message); return; }
    toast('success', 'Engineer assigned');
    load();
  }

  function handleExport() { exportCsv('maintenance_logs', ['QR ID', 'Component', 'Scheduled', 'Completed', 'Type', 'Priority', 'Engineer', 'Status', 'Notes'], logs.map((l) => [l.qr_id ?? '', l.fitting?.component_id ?? '', l.scheduled_date, l.completed_date ?? '', l.type, l.priority ?? '', l.engineer?.full_name ?? '', l.status, l.notes ?? ''])); }

  // Calendar generation
  const calendarDays = (() => {
    const year = calendarMonth.getFullYear(); const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); const daysInMonth = lastDay.getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  })();
  const logsByDate = logs.reduce<Record<string, MaintenanceLog[]>>((acc, l) => { const d = l.scheduled_date; (acc[d] ??= []).push(l); return acc; }, {});

  return (
    <>
      <PageHeader title="Maintenance" subtitle="Schedule maintenance, assign engineers, and track progress">
        <div className="flex rounded-lg border border-slate-200 dark:border-rail-800">
          <button onClick={() => setViewMode('list')} className={`rounded-l-lg px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-rail-700 text-white' : 'text-slate-500'}`}><List size={14} /></button>
          <button onClick={() => setViewMode('calendar')} className={`rounded-r-lg px-3 py-1.5 text-sm ${viewMode === 'calendar' ? 'bg-rail-700 text-white' : 'text-slate-500'}`}><Calendar size={14} /></button>
        </div>
        <button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Schedule</button>
      </PageHeader>

      {viewMode === 'calendar' ? (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex gap-2">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="btn-secondary px-3 py-1 text-xs">Prev</button>
              <button onClick={() => setCalendarMonth(new Date())} className="btn-secondary px-3 py-1 text-xs">Today</button>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="btn-secondary px-3 py-1 text-xs">Next</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="pb-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} className="min-h-[80px] rounded-lg bg-slate-50 dark:bg-rail-900/30" />;
              const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayLogs = logsByDate[dateStr] ?? [];
              const isToday = new Date().toDateString() === new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toDateString();
              return (
                <div key={i} className={`min-h-[80px] rounded-lg border p-1.5 ${isToday ? 'border-rail-500 bg-rail-50 dark:bg-rail-900/50' : 'border-slate-200 dark:border-rail-800'}`}>
                  <span className={`text-xs ${isToday ? 'font-bold text-rail-700 dark:text-rail-400' : 'text-slate-500 dark:text-slate-400'}`}>{day}</span>
                  {dayLogs.map((l) => (
                    <div key={l.id} className={`mt-1 truncate rounded px-1 py-0.5 text-[10px] font-medium ${l.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : l.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-rail-100 text-rail-700 dark:bg-rail-800 dark:text-rail-300'}`}>{l.type}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-4 p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by QR ID, component, or type..." className="input pl-9" /></div><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto"><option value="">All Status</option><option value="Scheduled">Scheduled</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Overdue">Overdue</option></select></div></div>
          {loading ? <LoadingSpinner label="Loading maintenance logs..." /> : logs.length === 0 ? <div className="card"><EmptyState icon={CalendarClock} title="No maintenance logs" message="Schedule your first maintenance task." /></div> : (
            <div className="space-y-3">{logs.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-rail-700 dark:text-rail-300">{l.fitting?.component_id ?? 'Unknown'}</span>
                      <StatusBadge status={l.status} />
                      {l.priority && <span className={`badge ${PRIORITY_COLORS[l.priority]}`}><Flag size={10} />{l.priority}</span>}
                      <span className="text-xs text-slate-400">{l.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Scheduled {l.scheduled_date}{l.completed_date && ` · Completed ${l.completed_date}`}</p>
                    {l.notes && <p className="mt-1 text-xs text-slate-400">{l.notes}</p>}
                    {l.engineer && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><User size={12} /> {l.engineer.full_name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {l.status !== 'Completed' && (
                      <>
                        <select value={l.engineer_id ?? ''} onChange={(e) => assignEngineer(l.id, e.target.value)} className="input w-auto py-1 text-xs">
                          <option value="">Assign engineer...</option>
                          {engineers.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                        <button onClick={() => markComplete(l)} className="btn-secondary py-1.5 text-xs"><CheckCircle2 size={14} /> Complete</button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}</div>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Maintenance" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Track Fitting</label><select required value={form.fit_id} onChange={(e) => setForm({ ...form, fit_id: e.target.value })} className="input"><option value="">Select a fitting...</option>{fittings.map((f) => <option key={f.id} value={f.id}>{f.component_id} ({f.qr_id}) — {f.station_name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled Date</label><input type="date" required value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="input" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as NonNullable<MaintenanceLog['priority']> })} className="input">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">{MAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Assign Engineer</label><select value={form.engineer_id} onChange={(e) => setForm({ ...form, engineer_id: e.target.value })} className="input"><option value="">— Unassigned —</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={3} placeholder="Maintenance details..." /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Schedule'}</button></div>
        </form>
      </Modal>
    </>
  );
}
