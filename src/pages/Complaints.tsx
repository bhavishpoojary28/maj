import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareWarning, Search, Download, Clock, Image as ImageIcon, Plus, Loader2, Upload, Camera } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import Modal from '../components/Modal';
import { StatusBadge, Pagination, EmptyState, LoadingSpinner } from '../components/ui';
import { supabase, COMPLAINT_TYPES, type TrackFitting, type Complaint } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { logAudit } from '../lib/audit';
import { exportCsv } from '../lib/qr';

const PAGE_SIZE = 8;

const PRIORITY_STYLES: Record<string, { border: string; dot: string; label: string }> = {
  Critical: { border: 'border-l-red-500', dot: 'bg-red-500', label: 'Critical' },
  High: { border: 'border-l-accent-500', dot: 'bg-accent-500', label: 'High' },
  Medium: { border: 'border-l-rail-500', dot: 'bg-rail-500', label: 'Medium' },
  Low: { border: 'border-l-slate-400', dot: 'bg-slate-400', label: 'Low' },
};

export default function Complaints() {
  const { session, profile } = useAuth();
  const toast = useToast();
  const canManageStatus = profile?.role === 'admin' || profile?.role === 'engineer';
  const [complaints, setComplaints] = useState<(Complaint & { fitting?: TrackFitting })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [fittings, setFittings] = useState<TrackFitting[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fitId: '', complaintType: 'Component Damage', priority: 'Medium' as Complaint['priority'], description: '', isDefect: true });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    let query = supabase.from('complaints').select('*', { count: 'exact' });
    if (statusFilter) query = query.eq('status', statusFilter);
    if (priorityFilter) query = query.eq('priority', priorityFilter);
    query = query.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count, error } = await query;
    if (error) { toast('error', error.message); setLoading(false); return; }
    const compData = (data ?? []) as Complaint[];
    const fitIds = [...new Set(compData.map((c) => c.fit_id).filter((v): v is string => v !== null))];
    let fitMap: Record<string, TrackFitting> = {};
    if (fitIds.length > 0) {
      const { data: fits } = await supabase.from('track_fittings').select('*').in('id', fitIds);
      fitMap = Object.fromEntries((fits ?? []).map((f: any) => [f.id, f]));
    }
    let result = compData.map((c) => ({ ...c, fitting: c.fit_id ? fitMap[c.fit_id] : undefined }));
    if (search) {
      result = result.filter((c) =>
        c.qr_id?.toLowerCase().includes(search.toLowerCase()) ||
        c.fitting?.component_id.toLowerCase().includes(search.toLowerCase()) ||
        c.complaint_type.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setComplaints(result);
    setTotalPages(Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter, priorityFilter]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  async function openRegister() {
    setRegisterOpen(true);
    const { data, error } = await supabase.from('track_fittings').select('*').order('component_id').limit(500);
    if (error) { toast('error', error.message); return; }
    setFittings((data ?? []) as TrackFitting[]);
  }

  function setEvidencePhoto(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast('error', 'Use a JPEG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('error', 'Photo must be 10 MB or smaller.'); return; }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearEvidencePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null); setPhotoPreview('');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  async function registerComplaint(e: React.FormEvent) {
    e.preventDefault();
    const fitting = fittings.find((item) => item.id === form.fitId);
    if (!fitting) { toast('error', 'Select a track fitting.'); return; }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${session?.user.id ?? 'staff'}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('complaint-photos').upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('complaints').insert({ fit_id: fitting.id, qr_id: fitting.qr_id, complaint_type: form.complaintType, priority: form.priority, description: form.description, is_defect: form.isDefect, photo_url: photoUrl, status: 'Open', registered_by: session?.user.id ?? null });
      if (error) throw error;
      await supabase.from('notifications').insert({ type: 'new_complaint', title: 'New Complaint Registered', message: `${form.complaintType} for ${fitting.qr_id} (${fitting.component_id}) — Priority: ${form.priority}`, fit_id: fitting.id });
      await logAudit(session?.user.id ?? null, 'register_complaint', 'complaint', null, `${form.complaintType} for ${fitting.qr_id}`);
      toast('success', 'Complaint registered successfully');
      setRegisterOpen(false); setForm({ fitId: '', complaintType: 'Component Damage', priority: 'Medium', description: '', isDefect: true }); clearEvidencePhoto(); load();
    } catch (error) { toast('error', error instanceof Error ? error.message : 'Failed to register complaint'); }
    finally { setSaving(false); }
  }

  async function updateStatus(c: Complaint, status: Complaint['status']) {
    if (!canManageStatus) { toast('error', 'Only administrators and engineers can update complaint status.'); return; }
    const isFinalStatus = status === 'Resolved' || status === 'Rejected';
    const payload: any = { status, updated_at: new Date().toISOString(), resolved_at: isFinalStatus ? new Date().toISOString() : null };
    const { error } = await supabase.from('complaints').update(payload).eq('id', c.id);
    if (error) { toast('error', error.message); return; }
    await logAudit(session?.user.id ?? null, `update_complaint_${status.toLowerCase()}`, 'complaint', c.id, `${c.complaint_type} for ${c.qr_id} → ${status}`);
    toast('success', `Complaint marked as ${status}`);
    load();
  }

  function handleExport() {
    exportCsv('complaints', ['QR ID', 'Component', 'Type', 'Priority', 'Status', 'Description', 'Registered', 'Resolved'],
      complaints.map((c) => [c.qr_id ?? '', c.fitting?.component_id ?? '', c.complaint_type, c.priority, c.status, c.description, new Date(c.created_at).toLocaleDateString(), c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : '—']));
  }

  return (
    <>
      <PageHeader title="Complaints" subtitle="View and manage complaints registered for track fittings">
        <button onClick={openRegister} className="btn-primary"><Plus size={16} /> Register Complaint</button>
        {canManageStatus && <button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export CSV</button>}
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by QR ID, component, type, or description..." className="input pl-9" /></div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto"><option value="">All Status</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Rejected">Rejected</option></select>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="input w-auto"><option value="">All Priority</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select>
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading complaints..." /> : complaints.length === 0 ? <div className="card"><EmptyState icon={MessageSquareWarning} title="No complaints found" message="Complaints registered via the QR Scanner will appear here." /></div> : (
        <div className="space-y-3">
          {complaints.map((c, i) => {
            const pStyle = PRIORITY_STYLES[c.priority] ?? PRIORITY_STYLES.Medium;
            const isExpanded = expandedId === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`card border-l-4 ${pStyle.border} p-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-rail-700 dark:text-rail-300">{c.fitting?.component_id ?? 'Unknown'}</span>
                      <StatusBadge status={c.status} />
                      {c.is_defect && <span className="badge bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">Defect</span>}
                      <span className={`badge ${c.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : c.priority === 'High' ? 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400' : c.priority === 'Medium' ? 'bg-rail-100 text-rail-700 dark:bg-rail-500/15 dark:text-rail-300' : 'bg-slate-100 text-slate-600 dark:bg-rail-800 dark:text-slate-300'}`}>
                        <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${pStyle.dot}`} />{c.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{c.complaint_type}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                    {c.photo_url && <a href={c.photo_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 pr-3 text-xs font-medium text-rail-700 hover:border-rail-300 dark:border-rail-700 dark:bg-rail-900 dark:text-rail-300"><img src={c.photo_url} alt="Complaint evidence" className="h-14 w-20 object-cover" /><ImageIcon size={14} /> View defect photo</a>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.created_at).toLocaleString()}</span>
                      {c.qr_id && <span className="font-mono">{c.qr_id}</span>}
                      {c.resolved_at && <span>Resolved: {new Date(c.resolved_at).toLocaleDateString()}</span>}
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="mt-2 text-xs font-medium text-rail-600 hover:underline dark:text-rail-400">
                      {isExpanded ? 'Hide timeline' : 'View timeline'}
                    </button>
                    {isExpanded && (
                      <div className="mt-3 border-l-2 border-slate-200 pl-4 dark:border-rail-700">
                        <div className="space-y-3">
                          <div className="relative">
                            <div className="absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-rail-500 dark:border-rail-900" />
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Complaint Registered</p>
                            <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</p>
                          </div>
                          {c.status !== 'Open' && (
                            <div className="relative">
                              <div className="absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-accent-500 dark:border-rail-900" />
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Investigation Started</p>
                              <p className="text-xs text-slate-400">{new Date(c.updated_at).toLocaleString()}</p>
                            </div>
                          )}
                          {(c.status === 'Resolved' || c.status === 'Rejected') && (
                            <div className="relative">
                              <div className={`absolute -left-[21px] h-3 w-3 rounded-full border-2 border-white ${c.status === 'Resolved' ? 'bg-green-500' : 'bg-red-500'} dark:border-rail-900`} />
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.status === 'Resolved' ? 'Complaint Resolved' : 'Complaint Rejected'}</p>
                              <p className="text-xs text-slate-400">{c.resolved_at ? new Date(c.resolved_at).toLocaleString() : new Date(c.updated_at).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {canManageStatus && <label className="flex min-w-36 flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">Update status
                    <select value={c.status} onChange={(event) => updateStatus(c, event.target.value as Complaint['status'])} className="input py-1.5 text-xs">
                      <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Completed</option><option value="Rejected">Rejected</option>
                    </select>
                  </label>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register Complaint" size="lg">
        <form onSubmit={registerComplaint} className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Track Fitting</label><select required value={form.fitId} onChange={(e) => setForm({ ...form, fitId: e.target.value })} className="input"><option value="">Select a fitting...</option>{fittings.map((fitting) => <option key={fitting.id} value={fitting.id}>{fitting.component_id} ({fitting.qr_id}) — {fitting.station_name}</option>)}</select></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Complaint Type</label><select value={form.complaintType} onChange={(e) => setForm({ ...form, complaintType: e.target.value })} className="input">{COMPLAINT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Complaint['priority'] })} className="input"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={4} placeholder="Describe the issue in detail..." /></div>
          <div><div className="mb-1 flex items-center justify-between gap-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defect photo <span className="font-normal text-slate-400">(optional)</span></label><span className="text-xs text-slate-400">Max 10 MB</span></div><input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setEvidencePhoto(e.target.files?.[0])} className="hidden" /><input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setEvidencePhoto(e.target.files?.[0])} className="hidden" />{photoPreview ? <div className="relative overflow-hidden rounded-xl border border-slate-200 p-2 dark:border-rail-700"><img src={photoPreview} alt="Selected complaint evidence" className="max-h-48 w-full rounded-lg object-contain" /><button type="button" onClick={clearEvidencePhoto} className="absolute right-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-xs text-white">Remove</button></div> : <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => uploadInputRef.current?.click()} className="btn-secondary justify-center"><Upload size={16} /> Upload photo</button><button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-secondary justify-center"><Camera size={16} /> Take photo</button></div>}</div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><input type="checkbox" checked={form.isDefect} onChange={(e) => setForm({ ...form, isDefect: e.target.checked })} className="mt-0.5 h-4 w-4 accent-red-600" /><span><span className="font-semibold">Mark as defect</span><br /><span className="text-xs">Flags this complaint for defect follow-up.</span></span></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setRegisterOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-danger">{saving ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareWarning size={16} />}{saving ? 'Registering...' : 'Register Complaint'}</button></div>
        </form>
      </Modal>
    </>
  );
}
