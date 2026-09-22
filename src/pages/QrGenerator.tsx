import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Download, FileText, Copy, Check, Layers, Printer, FileImage, Search, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import { LoadingSpinner, EmptyState } from '../components/ui';
import { supabase, type TrackFitting } from '../lib/supabase';
import { downloadQrPng, downloadQrPdf, generateQrDataUrl, exportCsv, generateQrSvg, downloadSvg, printQr, type QrPayload } from '../lib/qr';
import { useToast } from '../lib/toast';

export default function QrGenerator() {
  const toast = useToast();
  const [fittings, setFittings] = useState<TrackFitting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TrackFitting | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<TrackFitting[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('track_fittings').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) { setFittings(data as TrackFitting[]); setHistory((data as TrackFitting[]).slice(0, 5)); }
      setLoading(false);
    });
  }, []);

  const filtered = fittings.filter((f) => !search || f.component_id.toLowerCase().includes(search.toLowerCase()) || f.qr_id.toLowerCase().includes(search.toLowerCase()) || f.station_name.toLowerCase().includes(search.toLowerCase()));

  async function selectFitting(f: TrackFitting) {
    setSelected(f); setCopied(false); setQrDataUrl(''); setValidationError('');
    if (!f.qr_id) { setValidationError('No QR ID assigned to this fitting'); return; }
    if (!f.component_id) { setValidationError('Component ID missing'); return; }
    try {
      const url = await generateQrDataUrl(f.qr_id);
      setQrDataUrl(url);
    } catch {
      setValidationError('Failed to generate QR code');
    }
  }

  function handleAction(name: string, fn: () => Promise<void> | void) {
    return async () => {
      if (!selected?.qr_id) { toast('error', 'Select a fitting with a QR ID first'); return; }
      setGenerating(name);
      try { await fn(); }
      catch { toast('error', `${name} failed`); }
      finally { setGenerating(null); }
    };
  }

  const downloadPng = handleAction('PNG', async () => { if (selected?.qr_id) { await downloadQrPng(selected.qr_id, selected.component_id); toast('success', 'PNG downloaded successfully'); } });
  const downloadPdf = handleAction('PDF', async () => {
    if (!selected?.qr_id) return;
    const qrDataUrl = await generateQrDataUrl(selected.qr_id);
    const payload: QrPayload = { componentId: selected.component_id, qrId: selected.qr_id, railwayZone: selected.railway_zone, trackNumber: selected.track_number, installationDate: selected.installation_date, manufacturingDetails: selected.manufacturer ?? 'N/A' };
    downloadQrPdf(payload, qrDataUrl, selected.component_id);
    toast('success', 'PDF downloaded successfully');
  });
  const downloadSvgFile = handleAction('SVG', async () => { if (selected?.qr_id) { const svg = await generateQrSvg(selected.qr_id); downloadSvg(svg, selected.component_id); toast('success', 'SVG downloaded successfully'); } });
  const printLabel = handleAction('Print', () => {
    if (!selected || !qrDataUrl) return;
    printQr(`<html><head><title>QR Label - ${selected.component_id}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;font-family:sans-serif}h1{font-size:18px;margin-bottom:10px}p{font-size:12px;color:#666}img{width:300px;height:300px}</style></head><body><h1>${selected.component_id}</h1><img src="${qrDataUrl}" /><p>${selected.qr_id}</p><p>Station: ${selected.station_name} | Zone: ${selected.railway_zone}</p></body></html>`);
    toast('success', 'Print dialog opened');
  });

  function copyData() {
    if (!selected) return;
    const data = JSON.stringify({ component_id: selected.component_id, qr_id: selected.qr_id, track_number: selected.track_number, station: selected.station_name, zone: selected.railway_zone, type: selected.component_type, material: selected.material }, null, 2);
    navigator.clipboard.writeText(data);
    setCopied(true);
    toast('success', 'Data copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleBulk(id: string) {
    const next = new Set(bulkSelected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setBulkSelected(next);
  }

  async function downloadBulkPng() {
    const selectedFits = fittings.filter((f) => bulkSelected.has(f.id));
    for (const f of selectedFits) { if (f.qr_id) await downloadQrPng(f.qr_id, f.component_id); }
    toast('success', `${selectedFits.length} QR codes downloaded successfully`);
  }

  function exportHistoryCsv() {
    exportCsv('qr_history', ['Component ID', 'QR ID', 'Track', 'Station', 'Zone', 'Type', 'Created'],
      history.map((f) => [f.component_id, f.qr_id, f.track_number, f.station_name, f.railway_zone, f.component_type, f.created_at]));
    toast('success', 'History exported to CSV');
  }

  return (
    <>
      <PageHeader title="QR Code Generator" subtitle="Generate, download, and print QR codes for track fittings">
        <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }} className={bulkMode ? 'btn-primary' : 'btn-secondary'}><Layers size={16} /> {bulkMode ? 'Exit Bulk' : 'Bulk Mode'}</button>
        {bulkMode && bulkSelected.size > 0 && <button onClick={downloadBulkPng} className="btn-primary"><Download size={16} /> Download {bulkSelected.size}</button>}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="card p-4 lg:col-span-2">
          <div className="relative mb-4"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by component, QR ID, or station..." className="input pl-9" /></div>
          {loading ? <LoadingSpinner label="Loading fittings..." /> : filtered.length === 0 ? <EmptyState icon={QrCode} title="No fittings found" message="Add track fittings first to generate QR codes." /> : (
            <div className="max-h-[500px] space-y-2 overflow-y-auto">
              {filtered.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} onClick={() => !bulkMode && selectFitting(f)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${selected?.id === f.id ? 'border-rail-500 bg-rail-50 shadow-sm dark:bg-rail-800/40' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm dark:border-rail-800 dark:hover:border-rail-700'}`}>
                  {bulkMode && <input type="checkbox" checked={bulkSelected.has(f.id)} onChange={() => toggleBulk(f.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded border-slate-300 text-rail-600 focus:ring-rail-500" />}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-rail-50 text-rail-600 dark:bg-rail-800 dark:text-rail-400"><QrCode size={20} /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{f.component_id}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{f.qr_id || 'No QR'} · {f.station_name} · {f.railway_zone}</p></div>
                  {!f.qr_id && <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400">No QR</span>}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview & Actions */}
        <div className="card p-5">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="mb-1 text-center text-sm font-bold text-slate-800 dark:text-slate-100">{selected.component_id}</h3>
                <p className="mb-4 text-center text-xs text-slate-500 dark:text-slate-400">{selected.qr_id || 'No QR ID assigned'}</p>

                {validationError ? (
                  <div className="mb-4 flex flex-col items-center justify-center rounded-xl bg-accent-50 py-12 text-center dark:bg-accent-500/10">
                    <AlertCircle size={40} className="mb-2 text-accent-500" />
                    <p className="text-sm font-medium text-accent-700 dark:text-accent-400">{validationError}</p>
                  </div>
                ) : (
                  <div ref={qrRef} className="mb-4 flex justify-center rounded-xl bg-white p-4 shadow-sm dark:bg-rail-900" style={{ minHeight: '200px' }}>
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" width={240} height={240} className="rounded-lg" /> : <div className="flex h-48 w-48 items-center justify-center"><Loader2 size={32} className="animate-spin text-rail-500" /></div>}
                  </div>
                )}

                <div className="mb-4 space-y-1.5 rounded-lg bg-slate-50 p-3 dark:bg-rail-900/50">
                  <p className="flex justify-between text-xs"><span className="text-slate-500">QR ID:</span><span className="font-mono font-medium text-slate-700 dark:text-slate-300">{selected.qr_id || '—'}</span></p>
                  <p className="flex justify-between text-xs"><span className="text-slate-500">Track:</span><span className="font-medium text-slate-700 dark:text-slate-300">{selected.track_number}</span></p>
                  <p className="flex justify-between text-xs"><span className="text-slate-500">Station:</span><span className="font-medium text-slate-700 dark:text-slate-300">{selected.station_name}</span></p>
                  <p className="flex justify-between text-xs"><span className="text-slate-500">Type:</span><span className="font-medium text-slate-700 dark:text-slate-300">{selected.component_type}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={downloadPng} disabled={!!generating} className="btn-secondary text-xs"><FileImage size={14} /> {generating === 'PNG' ? '...' : 'PNG'}</button>
                  <button onClick={downloadSvgFile} disabled={!!generating} className="btn-secondary text-xs"><Download size={14} /> {generating === 'SVG' ? '...' : 'SVG'}</button>
                  <button onClick={downloadPdf} disabled={!!generating} className="btn-secondary text-xs"><FileText size={14} /> {generating === 'PDF' ? '...' : 'PDF'}</button>
                  <button onClick={printLabel} disabled={!!generating} className="btn-secondary text-xs"><Printer size={14} /> {generating === 'Print' ? '...' : 'Print'}</button>
                  <button onClick={copyData} className="col-span-2 btn-primary text-xs">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Data'}</button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-rail-800 dark:text-slate-500"><QrCode size={32} /></div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Select a fitting</p>
                <p className="text-xs text-slate-400">Preview its QR code here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recently Generated</h3>
          {history.length > 0 && <button onClick={exportHistoryCsv} className="btn-secondary text-xs"><Download size={14} /> Export History</button>}
        </div>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-rail-800 dark:text-slate-400"><th className="pb-2 font-medium">Component</th><th className="pb-2 font-medium">QR ID</th><th className="pb-2 font-medium">Station</th><th className="pb-2 font-medium">Zone</th><th className="pb-2 font-medium">Created</th></tr></thead>
              <tbody>
                {history.map((f) => (
                  <tr key={f.id} className="table-row">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{f.component_id}</td>
                    <td className="py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{f.qr_id}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{f.station_name}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{f.railway_zone}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(f.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="py-6 text-center text-sm text-slate-400">No QR codes generated yet.</p>}
      </div>
    </>
  );
}
