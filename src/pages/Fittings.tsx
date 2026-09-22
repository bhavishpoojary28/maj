import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Search, Pencil, Trash2, Download, MapPin, FileSpreadsheet, Image as ImageIcon, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { StatusBadge, Pagination, EmptyState, LoadingSpinner } from '../components/ui';
import { supabase, RAILWAY_ZONES, COMPONENT_TYPES, MATERIALS, TRACK_TYPES, type TrackFitting } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { logAudit } from '../lib/audit';
import { exportCsv, exportExcel, generateQrId } from '../lib/qr';

const PAGE_SIZE = 8;
const emptyForm = {
  component_id: '', track_number: '', railway_zone: 'NR', division: '', section: '',
  station_name: '', component_type: 'Rail Joint', material: 'Manganese Steel',
  track_type: 'BG', manufacturer: '', installation_date: new Date().toISOString().slice(0, 10),
  maintenance_date: '', status: 'Active' as TrackFitting['status'],
  gps_lat: '', gps_lng: '', image_url: '',
};

export default function Fittings() {
  const { session } = useAuth();
  const toast = useToast();
  const [fittings, setFittings] = useState<TrackFitting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TrackFitting | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    let query = supabase.from('track_fittings').select('*', { count: 'exact' });
    if (search) query = query.or(`component_id.ilike.%${search}%,qr_id.ilike.%${search}%,station_name.ilike.%${search}%`);
    if (zoneFilter) query = query.eq('railway_zone', zoneFilter);
    if (statusFilter) query = query.eq('status', statusFilter);
    query = query.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count, error } = await query;
    if (error) console.error(error);
    setFittings((data ?? []) as TrackFitting[]);
    setTotalPages(Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, zoneFilter, statusFilter]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  function openAdd() { setEditing(null); setForm({ ...emptyForm, component_id: `FIT-${Date.now().toString().slice(-6)}` }); setModalOpen(true); }
  function openEdit(f: TrackFitting) {
    setEditing(f);
    setForm({
      component_id: f.component_id, track_number: f.track_number, railway_zone: f.railway_zone,
      division: f.division ?? '', section: f.section ?? '', station_name: f.station_name,
      component_type: f.component_type, material: f.material,
      track_type: f.track_type ?? 'BG', manufacturer: f.manufacturer ?? '',
      installation_date: f.installation_date, maintenance_date: f.maintenance_date ?? '',
      status: f.status, gps_lat: f.gps_lat?.toString() ?? '', gps_lng: f.gps_lng?.toString() ?? '',
      image_url: f.image_url ?? '',
    });
    setModalOpen(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const fileName = `fitting-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('fittings').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('fittings').getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Upload failed'); }
    finally { setUploading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      component_id: form.component_id, track_number: form.track_number, railway_zone: form.railway_zone,
      division: form.division || null, section: form.section || null, station_name: form.station_name,
      component_type: form.component_type, material: form.material,
      track_type: form.track_type || null, manufacturer: form.manufacturer || null,
      installation_date: form.installation_date,
      maintenance_date: form.maintenance_date || null,
      status: form.status,
      gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : null,
      gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : null,
      image_url: form.image_url || null,
    };
    try {
      if (editing) {
        const { error } = await supabase.from('track_fittings').update(payload).eq('id', editing.id);
        if (error) throw error;
        await logAudit(session?.user.id ?? null, 'update_fitting', 'track_fitting', editing.id, `Updated ${form.component_id}`);
      } else {
        const qrId = generateQrId(form.component_id);
        const { error } = await supabase.from('track_fittings').insert({ ...payload, qr_id: qrId, created_by: session?.user.id ?? null });
        if (error) throw error;
        await logAudit(session?.user.id ?? null, 'create_fitting', 'track_fitting', null, `Created ${form.component_id} (${qrId})`);
        await supabase.from('notifications').insert({ type: 'new_component', title: 'New Component Registered', message: `${form.component_id} on Track ${form.track_number} (${form.railway_zone})` });
      }
      setModalOpen(false); load(); toast('success', editing ? 'Fitting updated successfully' : 'Fitting created successfully');
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Save failed'); } finally { setSaving(false); }
  }

  const [deleteTarget, setDeleteTarget] = useState<TrackFitting | null>(null);

  async function handleDelete(f: TrackFitting) {
    const { error } = await supabase.from('track_fittings').delete().eq('id', f.id);
    if (error) { toast('error', error.message); return; }
    await logAudit(session?.user.id ?? null, 'delete_fitting', 'track_fitting', f.id, `Deleted ${f.component_id}`);
    toast('success', 'Fitting deleted successfully');
    load();
  }

  function handleExportCsv() {
    exportCsv('track_fittings',
      ['Component ID', 'QR ID', 'Track', 'Zone', 'Division', 'Section', 'Station', 'Type', 'Material', 'Track Type', 'Manufacturer', 'Install Date', 'Maintenance Date', 'Status'],
      fittings.map((f) => [f.component_id, f.qr_id, f.track_number, f.railway_zone, f.division ?? '', f.section ?? '', f.station_name, f.component_type, f.material, f.track_type ?? '', f.manufacturer ?? '', f.installation_date, f.maintenance_date ?? '', f.status]));
  }

  function handleExportExcel() {
    exportExcel('track_fittings',
      ['Component ID', 'QR ID', 'Track', 'Zone', 'Division', 'Section', 'Station', 'Type', 'Material', 'Track Type', 'Manufacturer', 'Install Date', 'Maintenance Date', 'Status'],
      fittings.map((f) => [f.component_id, f.qr_id, f.track_number, f.railway_zone, f.division ?? '', f.section ?? '', f.station_name, f.component_type, f.material, f.track_type ?? '', f.manufacturer ?? '', f.installation_date, f.maintenance_date ?? '', f.status]));
  }

  return (
    <>
      <PageHeader title="Track Fittings" subtitle="Manage railway track components and their QR codes">
        <button onClick={handleExportExcel} className="btn-secondary"><FileSpreadsheet size={16} /> Excel</button>
        <button onClick={handleExportCsv} className="btn-secondary"><Download size={16} /> CSV</button>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Fitting</button>
      </PageHeader>

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Component ID, QR ID, or station..." className="input pl-9" /></div>
          <div className="flex gap-2">
            <select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }} className="input w-auto"><option value="">All Zones</option>{RAILWAY_ZONES.map((z) => <option key={z.code} value={z.code}>{z.code}</option>)}</select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-auto"><option value="">All Status</option><option value="Active">Active</option><option value="Under Maintenance">Under Maintenance</option><option value="Flagged">Flagged</option><option value="Decommissioned">Decommissioned</option></select>
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading fittings..." /> : fittings.length === 0 ? <div className="card"><EmptyState icon={Wrench} title="No track fittings found" message="Add your first track fitting or adjust your filters." /></div> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fittings.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card overflow-hidden p-0">
              {f.image_url && <img src={f.image_url} alt={f.component_id} className="h-32 w-full object-cover" />}
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div><h3 className="font-mono text-sm font-bold text-rail-700 dark:text-rail-300">{f.component_id}</h3><p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{f.qr_id}</p></div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Type</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.component_type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Track</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.track_number}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Zone</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.railway_zone}</span></div>
                  {f.division && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Division</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.division}</span></div>}
                  {f.section && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Section</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.section}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Station</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.station_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Material</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.material}</span></div>
                  {f.track_type && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Track Type</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.track_type}</span></div>}
                  {f.manufacturer && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Manufacturer</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.manufacturer}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Installed</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.installation_date}</span></div>
                  {f.maintenance_date && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Next Maint.</span><span className="font-medium text-slate-700 dark:text-slate-200">{f.maintenance_date}</span></div>}
                  {f.gps_lat && <div className="flex items-center gap-1 pt-1 text-xs text-slate-400"><MapPin size={12} /> {f.gps_lat.toFixed(4)}, {f.gps_lng?.toFixed(4)}</div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(f)} className="btn-secondary flex-1 py-1.5 text-xs"><Pencil size={14} /> Edit</button>
                  <button onClick={() => setDeleteTarget(f)} className="btn-danger py-1.5 text-xs" aria-label={`Delete ${f.component_id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fitting' : 'Add Track Fitting'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Component Image</label>
            <div className="flex items-center gap-3">
              {form.image_url ? <img src={form.image_url} alt="preview" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-rail-700"><ImageIcon size={20} className="text-slate-400" /></div>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-secondary">{uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} {uploading ? 'Uploading...' : 'Upload'}</button>
              {form.image_url && <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="text-sm text-red-500 hover:text-red-600">Remove</button>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Component ID</label><input required value={form.component_id} onChange={(e) => setForm({ ...form, component_id: e.target.value })} className="input" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Track Number</label><input required value={form.track_number} onChange={(e) => setForm({ ...form, track_number: e.target.value })} className="input" placeholder="NDLS-AGC-1" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Railway Zone</label><select value={form.railway_zone} onChange={(e) => setForm({ ...form, railway_zone: e.target.value })} className="input">{RAILWAY_ZONES.map((z) => <option key={z.code} value={z.code}>{z.name} ({z.code})</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Division</label><input value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} className="input" placeholder="Delhi Division" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input" placeholder="NDLS-GZB" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Station Name</label><input required value={form.station_name} onChange={(e) => setForm({ ...form, station_name: e.target.value })} className="input" placeholder="New Delhi" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Component Type</label><select value={form.component_type} onChange={(e) => setForm({ ...form, component_type: e.target.value })} className="input">{COMPONENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Material</label><select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="input">{MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Track Type</label><select value={form.track_type} onChange={(e) => setForm({ ...form, track_type: e.target.value })} className="input">{TRACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manufacturer</label><input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="input" placeholder="SAIL / Tata Steel" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Installation Date</label><input type="date" required value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} className="input" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Next Maintenance Date</label><input type="date" value={form.maintenance_date} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} className="input" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TrackFitting['status'] })} className="input"><option value="Active">Active</option><option value="Under Maintenance">Under Maintenance</option><option value="Flagged">Flagged</option><option value="Decommissioned">Decommissioned</option></select></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">GPS Latitude</label><input type="number" step="any" value={form.gps_lat} onChange={(e) => setForm({ ...form, gps_lat: e.target.value })} className="input" placeholder="28.6139" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">GPS Longitude</label><input type="number" step="any" value={form.gps_lng} onChange={(e) => setForm({ ...form, gps_lng: e.target.value })} className="input" placeholder="77.2090" /></div>
          </div>
          {!editing && <p className="rounded-lg bg-rail-50 px-3 py-2 text-xs text-rail-700 dark:bg-rail-800/50 dark:text-rail-300">A unique QR ID will be auto-generated for this component.</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Fitting"
        message={`Are you sure you want to delete fitting ${deleteTarget?.component_id ?? ''}? This will also remove related inspection, maintenance, and complaint records.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
