import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Camera, CameraOff, Search, CheckCircle2, AlertCircle, MessageSquareWarning, Loader2, Upload, X } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import Modal from '../components/Modal';
import { LoadingSpinner, EmptyState, StatusBadge } from '../components/ui';
import { supabase, COMPLAINT_TYPES, type TrackFitting, type Inspection, type MaintenanceLog, type Complaint } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { logAudit } from '../lib/audit';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner() {
  const { session } = useAuth();
  const toast = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualQr, setManualQr] = useState('');
  const [result, setResult] = useState<TrackFitting | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState<{ qrId: string; time: string }[]>([]);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ complaint_type: 'Component Damage', priority: 'Medium' as Complaint['priority'], description: '' });
  const [savingComplaint, setSavingComplaint] = useState(false);
  const [complaintPhoto, setComplaintPhoto] = useState<File | null>(null);
  const [complaintPhotoPreview, setComplaintPhotoPreview] = useState('');
  const [markAsDefect, setMarkAsDefect] = useState(true);

  function parseQrId(raw: string): string {
    const match = raw.match(/QRID:([^|]+)/);
    return match ? match[1].trim() : raw.trim();
  }

  async function lookup(qrId: string) {
    setLoading(true); setError(''); setResult(null);
    try {
      const parsed = parseQrId(qrId);
      const { data, error } = await supabase.from('track_fittings').select('*').or(`qr_id.eq.${parsed},component_id.eq.${parsed}`).maybeSingle();
      if (error) throw error;
      if (!data) { setError('No fitting found for this QR / Component ID.'); return; }
      setResult(data as TrackFitting);
      setScanHistory((prev) => [{ qrId: parsed, time: new Date().toLocaleString() }, ...prev].slice(0, 10));
      const [{ data: insp }, { data: maint }, { data: comp }] = await Promise.all([
        supabase.from('inspections').select('*').eq('fit_id', data.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('maintenance_logs').select('*').eq('fit_id', data.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('complaints').select('*').eq('fit_id', data.id).order('created_at', { ascending: false }).limit(10),
      ]);
      setInspections((insp ?? []) as Inspection[]);
      setMaintenance((maint ?? []) as MaintenanceLog[]);
      setComplaints((comp ?? []) as Complaint[]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Lookup failed'); }
    finally { setLoading(false); }
  }

  async function startScan() {
    setError(''); setScanning(true);
    if (!window.isSecureContext) {
      setError('Camera scanning requires HTTPS on a mobile device. This HTTP LAN address cannot access the camera. Open the app through an HTTPS URL, then allow camera permission.');
      setScanning(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported by this browser. Use a current mobile browser over HTTPS.');
      setScanning(false);
      return;
    }
    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qr;
      await html5Qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (decoded) => { stopScan(); lookup(decoded); }, () => {});
    } catch (err) {
      const message = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings, then try again.'
        : 'Could not start the camera. Check that no other app is using it and try again.';
      setError(message);
      setScanning(false);
    }
  }

  async function stopScan() {
    if (scannerRef.current) { try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch {} scannerRef.current = null; }
    setScanning(false);
  }

  useEffect(() => { return () => { stopScan(); }; }, []);

  function selectComplaintPhoto(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast('error', 'Use a JPEG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('error', 'Photo must be 10 MB or smaller.'); return; }
    setComplaintPhoto(file);
    setComplaintPhotoPreview(URL.createObjectURL(file));
  }

  function clearComplaintPhoto() {
    if (complaintPhotoPreview) URL.revokeObjectURL(complaintPhotoPreview);
    setComplaintPhoto(null);
    setComplaintPhotoPreview('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraPhotoInputRef.current) cameraPhotoInputRef.current.value = '';
  }

  async function handleRegisterComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setSavingComplaint(true);
    try {
      let photoUrl: string | null = null;
      if (complaintPhoto) {
        const extension = complaintPhoto.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${session?.user.id ?? 'staff'}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('complaint-photos').upload(path, complaintPhoto, { contentType: complaintPhoto.type, upsert: false });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('complaints').insert({
        fit_id: result.id, qr_id: result.qr_id,
        complaint_type: complaintForm.complaint_type,
        priority: complaintForm.priority,
        description: complaintForm.description,
        photo_url: photoUrl,
        is_defect: markAsDefect,
        status: 'Open',
        registered_by: session?.user.id ?? null,
      });
      if (error) throw error;
      await supabase.from('notifications').insert({
        type: 'new_complaint', title: 'New Complaint Registered',
        message: `${complaintForm.complaint_type} for ${result.qr_id} (${result.component_id}) — Priority: ${complaintForm.priority}`,
        fit_id: result.id,
      });
      await logAudit(session?.user.id ?? null, 'register_complaint', 'complaint', null, `${complaintForm.complaint_type} for ${result.qr_id}`);
      setComplaintModalOpen(false);
      setComplaintForm({ complaint_type: 'Component Damage', priority: 'Medium', description: '' });
      setMarkAsDefect(true);
      clearComplaintPhoto();
      toast('success', 'Complaint registered successfully');
      const { data } = await supabase.from('complaints').select('*').eq('fit_id', result.id).order('created_at', { ascending: false }).limit(10);
      setComplaints((data ?? []) as Complaint[]);
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to register complaint'); }
    finally { setSavingComplaint(false); }
  }

  return (
    <>
      <PageHeader title="QR Scanner" subtitle="Scan a QR code, view details, and register complaints with photo evidence" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex gap-2">
            <button onClick={scanning ? stopScan : startScan} className={scanning ? 'btn-danger' : 'btn-primary'}>
              {scanning ? <><CameraOff size={16} /> Stop Camera</> : <><Camera size={16} /> Start Camera</>}
            </button>
          </div>
          <div id="qr-reader" className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-rail-700" style={{ minHeight: scanning ? 280 : 0 }} />
          {!scanning && <div className="flex flex-col items-center py-12 text-slate-400"><ScanLine size={48} /><p className="mt-2 text-sm">Camera is off. Click "Start Camera" to scan.</p></div>}
          {error && <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"><AlertCircle size={16} /> {error}</div>}
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-rail-800">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manual QR ID / Component ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={manualQr} onChange={(e) => setManualQr(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && manualQr && lookup(manualQr)} placeholder="RQR-XXX-XXXXXX or FIT-123456" className="input pl-9" /></div>
              <button onClick={() => manualQr && lookup(manualQr)} disabled={!manualQr || loading} className="btn-primary">Lookup</button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Component Details</h3>
          {loading ? <LoadingSpinner label="Looking up..." /> : result ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={16} /> Component found</div>
                <button onClick={() => setComplaintModalOpen(true)} className="btn-danger py-2 text-xs">
                  <MessageSquareWarning size={15} /> Register Complaint
                </button>
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-4 dark:bg-rail-900">
                {[['Component ID', result.component_id], ['QR ID', result.qr_id], ['Track', result.track_number], ['Zone', result.railway_zone], ['Station', result.station_name], ['Type', result.component_type], ['Material', result.material], ['Installed', result.installation_date], ['Last Inspection', result.last_inspection_date ?? '—']].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">{l}</span><span className="font-medium text-slate-700 dark:text-slate-200">{v}</span></div>
                ))}
                <div className="flex justify-between pt-1"><span className="text-sm text-slate-500 dark:text-slate-400">Status</span><StatusBadge status={result.status} /></div>
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">AI Inspection History</h4>
                {inspections.length > 0 ? <div className="space-y-2">{inspections.map((i) => <div key={i.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-rail-800"><StatusBadge status={i.result} /><span className="text-slate-600 dark:text-slate-400">{i.confidence}%</span><span className="text-xs text-slate-400">{new Date(i.created_at).toLocaleDateString()}</span></div>)}</div> : <p className="text-sm text-slate-400">No inspections recorded.</p>}
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Complaints</h4>
                {complaints.length > 0 ? <div className="space-y-2">{complaints.map((c) => <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-rail-800"><div><span className="font-medium text-slate-700 dark:text-slate-300">{c.complaint_type}</span><span className="ml-2 text-xs text-slate-400">{c.priority}</span></div><StatusBadge status={c.status} /></div>)}</div> : <p className="text-sm text-slate-400">No complaints registered.</p>}
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Maintenance History</h4>
                {maintenance.length > 0 ? <div className="space-y-2">{maintenance.map((m) => <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-rail-800"><span className="font-medium text-slate-700 dark:text-slate-300">{m.type}</span><StatusBadge status={m.status} /><span className="text-xs text-slate-400">{m.scheduled_date}</span></div>)}</div> : <p className="text-sm text-slate-400">No maintenance logs.</p>}
              </div>
            </motion.div>
          ) : <EmptyState icon={ScanLine} title="No component scanned" message="Scan a QR code or enter an ID to view details and register complaints." />}
        </div>
      </div>

      {scanHistory.length > 0 && (
        <div className="card mt-6 p-5">
          <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">Scan History</h3>
          <div className="space-y-1">{scanHistory.map((s, i) => <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-rail-900"><span className="font-mono text-xs text-slate-700 dark:text-slate-300">{s.qrId}</span><span className="text-xs text-slate-400">{s.time}</span></div>)}</div>
        </div>
      )}

      <Modal open={complaintModalOpen} onClose={() => setComplaintModalOpen(false)} title="Register Complaint">
        <form onSubmit={handleRegisterComplaint} className="space-y-4">
          {result && <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-rail-900"><p className="font-semibold text-slate-700 dark:text-slate-200">{result.component_id}</p><p className="font-mono text-xs text-slate-500 dark:text-slate-400">{result.qr_id} · {result.station_name}</p></div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Complaint Type</label>
            <select value={complaintForm.complaint_type} onChange={(e) => setComplaintForm({ ...complaintForm, complaint_type: e.target.value })} className="input">{COMPLAINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
            <select value={complaintForm.priority} onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value as Complaint['priority'] })} className="input"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea required value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} className="input" rows={4} placeholder="Describe the issue in detail..." />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Defect photo <span className="font-normal text-slate-400">(optional)</span></label><span className="text-xs text-slate-400">JPEG, PNG, WebP · max 10 MB</span></div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => selectComplaintPhoto(e.target.files?.[0])} className="hidden" />
            <input ref={cameraPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => selectComplaintPhoto(e.target.files?.[0])} className="hidden" />
            {complaintPhotoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-rail-700 dark:bg-rail-900"><img src={complaintPhotoPreview} alt="Selected complaint evidence" className="max-h-52 w-full rounded-lg object-contain" /><button type="button" onClick={clearComplaintPhoto} className="absolute right-3 top-3 rounded-full bg-slate-900/75 p-1.5 text-white"><X size={14} /></button></div>
            ) : (
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => photoInputRef.current?.click()} className="btn-secondary justify-center"><Upload size={16} /> Upload photo</button><button type="button" onClick={() => cameraPhotoInputRef.current?.click()} className="btn-secondary justify-center"><Camera size={16} /> Take photo</button></div>
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"><input type="checkbox" checked={markAsDefect} onChange={(e) => setMarkAsDefect(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" /><span><span className="font-semibold">Mark as defect</span><br /><span className="text-xs">Flags this complaint as a confirmed defect for follow-up.</span></span></label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setComplaintModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={savingComplaint} className="btn-danger">{savingComplaint ? <Loader2 size={16} className="animate-spin" /> : <MessageSquareWarning size={16} />} {savingComplaint ? 'Registering...' : 'Register Complaint'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
