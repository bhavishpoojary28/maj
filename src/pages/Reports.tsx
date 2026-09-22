import '../lib/chartSetup';
import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Search, FileSpreadsheet, Calendar, TrendingUp,
  BrainCircuit, User, BarChart3, Filter, MapPin, CheckCircle2, XCircle,
  Clock, ChevronDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { PageHeader } from '../components/Topbar';
import { EmptyState, StatusBadge, SkeletonCard } from '../components/ui';
import { supabase, type TrackFitting, type Inspection, type MaintenanceLog, type Complaint, type Profile, RAILWAY_ZONES } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { exportExcel } from '../lib/qr';

type ReportRow = { fitting: TrackFitting; inspections: Inspection[]; maintenance: MaintenanceLog[]; complaints: Complaint[] };
type Period = 'daily' | 'weekly' | 'monthly';

export default function Reports() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [allInspections, setAllInspections] = useState<Inspection[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [tab, setTab] = useState<'component' | 'summary' | 'engineer'>('component');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: fits }, { data: insp }, { data: maint }, { data: engs }] = await Promise.all([
        supabase.from('track_fittings').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('inspections').select('*').order('created_at', { ascending: false }),
        supabase.from('maintenance_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'engineer'),
      ]);
      const fitData = (fits ?? []) as TrackFitting[];
      const fitIds = fitData.map((f) => f.id);
      let inspMap: Record<string, Inspection[]> = {}, maintMap: Record<string, MaintenanceLog[]> = {}, compMap: Record<string, Complaint[]> = {};
      if (fitIds.length > 0) {
        const [{ data: fitInsp }, { data: fitMaint }, { data: comp }] = await Promise.all([
          supabase.from('inspections').select('*').in('fit_id', fitIds).order('created_at', { ascending: false }),
          supabase.from('maintenance_logs').select('*').in('fit_id', fitIds).order('created_at', { ascending: false }),
          supabase.from('complaints').select('*').in('fit_id', fitIds).order('created_at', { ascending: false }),
        ]);
        (fitInsp ?? []).forEach((i: any) => { inspMap[i.fit_id] = [...(inspMap[i.fit_id] ?? []), i]; });
        (fitMaint ?? []).forEach((m: any) => { maintMap[m.fit_id] = [...(maintMap[m.fit_id] ?? []), m]; });
        (comp ?? []).forEach((c: any) => { compMap[c.fit_id] = [...(compMap[c.fit_id] ?? []), c]; });
      }
      setRows(fitData.map((f) => ({ fitting: f, inspections: inspMap[f.id] ?? [], maintenance: maintMap[f.id] ?? [], complaints: compMap[f.id] ?? [] })));
      setAllInspections((insp ?? []) as Inspection[]);
      setAllMaintenance((maint ?? []) as MaintenanceLog[]);
      setEngineers((engs ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const matchSearch = r.fitting.component_id.toLowerCase().includes(search.toLowerCase()) || r.fitting.qr_id.toLowerCase().includes(search.toLowerCase());
    const matchZone = !zoneFilter || r.fitting.railway_zone === zoneFilter;
    return matchSearch && matchZone;
  });

  function getPeriodDate(): Date {
    const d = new Date();
    if (period === 'daily') d.setDate(d.getDate() - 1);
    else if (period === 'weekly') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d;
  }

  function getDateFilteredInspections() {
    let insp = allInspections;
    if (dateFrom) insp = insp.filter((i) => new Date(i.created_at) >= new Date(dateFrom));
    if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59); insp = insp.filter((i) => new Date(i.created_at) <= end); }
    return insp;
  }

  function generatePdf(r: ReportRow) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); const pageH = doc.internal.pageSize.getHeight(); const f = r.fitting;

    // Header band
    doc.setFillColor(11, 31, 58); doc.rect(0, 0, pageW, 32, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('RailQR AI', 14, 14);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('Component Inspection Report', 14, 22);
    doc.setFontSize(8);
    doc.text(`Report ID: RQR-RPT-${Date.now().toString(36).toUpperCase()}`, pageW - 80, 14);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageW - 80, 20);
    doc.text(`Inspector: ${profile?.full_name ?? 'Unknown'}`, pageW - 80, 26);

    // QR Image (if available from fitting)
    if (f.image_url) {
      try { doc.addImage(f.image_url, 'PNG', pageW - 50, 38, 36, 36); } catch { /* skip if invalid */ }
    }

    // Component Information
    doc.setTextColor(20, 20, 20); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Component Information', 14, 42);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); let y = 50;
    const info: [string, string][] = [['Component ID', f.component_id], ['QR ID', f.qr_id], ['Track Number', f.track_number], ['Railway Zone', f.railway_zone], ['Division', f.division ?? '—'], ['Section', f.section ?? '—'], ['Station', f.station_name], ['Component Type', f.component_type], ['Material', f.material], ['Track Type', f.track_type ?? '—'], ['Manufacturer', f.manufacturer ?? '—'], ['Installation Date', f.installation_date], ['Last Inspection', f.last_inspection_date ?? '—'], ['Status', f.status]];
    for (const [label, value] of info) { doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(value, 60, y); y += 6; }

    // AI Inspection Summary
    y += 4; doc.setDrawColor(200, 200, 200); doc.line(14, y, pageW - 14, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('AI Inspection Summary', 14, y); y += 6; doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (r.inspections.length === 0) { doc.text('No inspections recorded.', 14, y); y += 5; } else {
      const passed = r.inspections.filter((i) => i.result === 'PASS').length;
      const failed = r.inspections.filter((i) => i.result === 'FAIL').length;
      const avgConf = r.inspections.length > 0 ? Math.round(r.inspections.reduce((s, i) => s + i.confidence, 0) / r.inspections.length) : 0;
      doc.setFont('helvetica', 'bold'); doc.text(`Total: ${r.inspections.length}`, 14, y); doc.text(`Passed: ${passed}`, 50, y); doc.text(`Failed: ${failed}`, 80, y); doc.text(`Avg Confidence: ${avgConf}%`, 110, y); y += 6;
      doc.setFont('helvetica', 'bold'); doc.text('Date', 14, y); doc.text('Result', 60, y); doc.text('Confidence', 90, y); doc.text('Problems', 120, y); y += 5; doc.setFont('helvetica', 'normal');
      r.inspections.forEach((i) => { if (y > pageH - 50) { doc.addPage(); y = 20; } doc.text(new Date(i.created_at).toLocaleDateString(), 14, y); doc.text(i.result, 60, y); doc.text(`${i.confidence}%`, 90, y); doc.text(i.problems.join('; ').slice(0, 60), 120, y); y += 5; });
    }

    // Complaints
    y += 6; if (y > pageH - 50) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Complaints', 14, y); y += 6; doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (r.complaints.length === 0) { doc.text('No complaints registered.', 14, y); y += 5; } else { doc.setFont('helvetica', 'bold'); doc.text('Date', 14, y); doc.text('Type', 50, y); doc.text('Priority', 100, y); doc.text('Status', 130, y); y += 5; doc.setFont('helvetica', 'normal'); r.complaints.forEach((c) => { if (y > pageH - 40) { doc.addPage(); y = 20; } doc.text(new Date(c.created_at).toLocaleDateString(), 14, y); doc.text(c.complaint_type.slice(0, 30), 50, y); doc.text(c.priority, 100, y); doc.text(c.status, 130, y); y += 5; }); }

    // Maintenance History
    y += 6; if (y > pageH - 50) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('Maintenance History', 14, y); y += 6; doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (r.maintenance.length === 0) { doc.text('No maintenance logs.', 14, y); y += 5; } else { doc.setFont('helvetica', 'bold'); doc.text('Scheduled', 14, y); doc.text('Type', 50, y); doc.text('Priority', 80, y); doc.text('Status', 100, y); doc.text('Notes', 130, y); y += 5; doc.setFont('helvetica', 'normal'); r.maintenance.forEach((m) => { if (y > pageH - 40) { doc.addPage(); y = 20; } doc.text(m.scheduled_date, 14, y); doc.text(m.type, 50, y); doc.text(m.priority ?? '—', 80, y); doc.text(m.status, 100, y); doc.text((m.notes ?? '').slice(0, 50), 130, y); y += 5; }); }

    // Signature Section
    y += 10; if (y > pageH - 40) { doc.addPage(); y = 20; }
    doc.setDrawColor(200, 200, 200); doc.line(14, y, pageW - 14, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Declaration & Signatures', 14, y); y += 6;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('I hereby certify that the information provided in this report is accurate and complete to the best of my knowledge.', 14, y); y += 8;

    // Two signature lines
    const sigY = y + 15;
    doc.setDrawColor(100, 100, 100); doc.line(20, sigY, 80, sigY); doc.line(pageW - 86, sigY, pageW - 20, sigY);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('Inspector Signature', 20, sigY + 5); doc.text('Authorizing Officer', pageW - 86, sigY + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text(`${profile?.full_name ?? 'Unknown'} (${profile?.role ?? ''})`, 20, sigY + 10);
    doc.text(`${profile?.zone ?? ''} Zone`, 20, sigY + 15);
    doc.text('Indian Railways', pageW - 86, sigY + 10);
    doc.text('Station Master / SSE', pageW - 86, sigY + 15);

    // Footer
    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text(`Generated by RailQR AI on ${new Date().toLocaleString()}`, 14, pageH - 8);
    doc.text('Indian Railways — Laser-Based QR Code Marking System', pageW - 90, pageH - 8);
    doc.save(`${f.qr_id}_report.pdf`);
  }

  function generateSummaryPdf() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(11, 31, 58); doc.rect(0, 0, pageW, 28, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text(`RailQR AI — ${period.charAt(0).toUpperCase() + period.slice(1)} Summary Report`, 14, 14); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`Period: ${getPeriodDate().toLocaleDateString()} to ${new Date().toLocaleDateString()}`, 14, 21);
    const periodInspections = getDateFilteredInspections();
    const periodMaintenance = allMaintenance.filter((m) => new Date(m.created_at) >= getPeriodDate());
    const passed = periodInspections.filter((i) => i.result === 'PASS').length;
    const failed = periodInspections.filter((i) => i.result === 'FAIL').length;
    const completed = periodMaintenance.filter((m) => m.status === 'Completed').length;
    doc.setTextColor(20, 20, 20); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Summary Statistics', 14, 40); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    let y = 48;
    const stats: [string, string][] = [['Total Components', String(rows.length)], ['Inspections (period)', String(periodInspections.length)], ['Passed', String(passed)], ['Failed', String(failed)], ['Pass Rate', `${periodInspections.length > 0 ? Math.round((passed / periodInspections.length) * 100) : 0}%`], ['Maintenance Tasks', String(periodMaintenance.length)], ['Completed', String(completed)], ['Pending', String(periodMaintenance.length - completed)]];
    for (const [label, value] of stats) { doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, 14, y); doc.setFont('helvetica', 'normal'); doc.text(value, 70, y); y += 6; }
    doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text(`Generated by: ${profile?.full_name ?? 'Unknown'}`, 14, pageH - 10); doc.text(`Date: ${new Date().toLocaleString()}`, pageW - 80, pageH - 10);
    doc.save(`${period}_summary_report.pdf`);
  }

  function exportComponentExcel() {
    exportExcel('component_reports', ['Component ID', 'QR ID', 'Track', 'Zone', 'Division', 'Section', 'Station', 'Type', 'Material', 'Track Type', 'Manufacturer', 'Status', 'Inspections', 'Maintenance', 'Complaints', 'Last Inspection'],
      filtered.map((r) => [r.fitting.component_id, r.fitting.qr_id, r.fitting.track_number, r.fitting.railway_zone, r.fitting.division ?? '', r.fitting.section ?? '', r.fitting.station_name, r.fitting.component_type, r.fitting.material, r.fitting.track_type ?? '', r.fitting.manufacturer ?? '', r.fitting.status, r.inspections.length, r.maintenance.length, r.complaints.length, r.fitting.last_inspection_date ?? '—']));
  }

  function exportSummaryExcel() {
    const periodDate = getPeriodDate();
    const periodInspections = getDateFilteredInspections();
    const passed = periodInspections.filter((i) => i.result === 'PASS').length;
    const failed = periodInspections.filter((i) => i.result === 'FAIL').length;
    exportExcel(`${period}_summary`, ['Metric', 'Value'], [
      ['Period', period], ['From', getPeriodDate().toLocaleDateString()], ['To', new Date().toLocaleDateString()],
      ['Total Components', rows.length], ['Total Inspections', periodInspections.length], ['Passed', passed], ['Failed', failed],
      ['Pass Rate (%)', periodInspections.length > 0 ? Math.round((passed / periodInspections.length) * 100) : 0],
      ['Maintenance Tasks', allMaintenance.filter((m) => new Date(m.created_at) >= periodDate).length],
      ['Completed Maintenance', allMaintenance.filter((m) => new Date(m.created_at) >= periodDate && m.status === 'Completed').length],
    ]);
  }

  function exportEngineerExcel() {
    const engData = engineers.map((e) => {
      const engMaint = allMaintenance.filter((m) => m.engineer_id === e.id);
      const completed = engMaint.filter((m) => m.status === 'Completed').length;
      return [e.full_name, e.zone, engMaint.length, completed, engMaint.length - completed, completed > 0 ? Math.round((completed / engMaint.length) * 100) : 0];
    });
    exportExcel('engineer_performance', ['Engineer', 'Zone', 'Assigned Tasks', 'Completed', 'Pending', 'Completion Rate (%)'], engData);
  }

  if (loading) return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
  );

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const palette = ['#245a98', '#3573b5', '#5a93cb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Summary chart data
  const periodInspections = getDateFilteredInspections();
  const passed = periodInspections.filter((i) => i.result === 'PASS').length;
  const failed = periodInspections.filter((i) => i.result === 'FAIL').length;
  const completed = allMaintenance.filter((m) => m.status === 'Completed').length;
  const passRate = periodInspections.length > 0 ? Math.round((passed / periodInspections.length) * 100) : 0;

  // Zone distribution chart
  const zoneMap: Record<string, number> = {};
  filtered.forEach((r) => { zoneMap[r.fitting.railway_zone] = (zoneMap[r.fitting.railway_zone] ?? 0) + 1; });

  // Monthly trend
  const months: string[] = [];
  const monthMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const label = d.toLocaleString('en-US', { month: 'short' }); months.push(label); monthMap[label] = 0; }
  periodInspections.forEach((i) => { const d = new Date(i.created_at); const label = d.toLocaleString('en-US', { month: 'short' }); if (label in monthMap) monthMap[label]++; });

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate detailed reports for components, summaries, and engineer performance">
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary"><Filter size={16} /> Filters <ChevronDown size={14} className={`transition ${showFilters ? 'rotate-180' : ''}`} /></button>
        {tab === 'component' && <button onClick={exportComponentExcel} className="btn-secondary"><FileSpreadsheet size={16} /> Excel</button>}
        {tab === 'summary' && <button onClick={exportSummaryExcel} className="btn-secondary"><FileSpreadsheet size={16} /> Excel</button>}
        {tab === 'engineer' && <button onClick={exportEngineerExcel} className="btn-secondary"><FileSpreadsheet size={16} /> Excel</button>}
      </PageHeader>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(['component', 'summary', 'engineer'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-rail-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-rail-900 dark:text-slate-300 dark:hover:bg-rail-800'}`}>
            {t === 'component' && <FileText size={14} className="mr-1 inline" />}
            {t === 'summary' && <BarChart3 size={14} className="mr-1 inline" />}
            {t === 'engineer' && <User size={14} className="mr-1 inline" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="card p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
                  <div className="relative"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Component or QR ID..." className="input-sm pl-8" /></div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Railway Zone</label>
                  <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="input-sm"><option value="">All Zones</option>{RAILWAY_ZONES.map((z) => <option key={z.code} value={z.code}>{z.code} — {z.name}</option>)}</select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Date From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Date To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-sm" />
                </div>
              </div>
              {(zoneFilter || dateFrom || dateTo || search) && (
                <button onClick={() => { setZoneFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); }} className="mt-3 text-xs font-medium text-rail-600 hover:text-rail-700 dark:text-rail-400">Clear all filters</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === 'component' && (
        <>
          {filtered.length === 0 ? <div className="card"><EmptyState icon={FileText} title="No reports available" message="Add track fittings to generate reports." /></div> : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r, i) => (
                <motion.div key={r.fitting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-5">
                  <div className="mb-3 flex items-start justify-between"><div><h3 className="font-mono text-sm font-bold text-rail-700 dark:text-rail-300">{r.fitting.component_id}</h3><p className="font-mono text-xs text-slate-500 dark:text-slate-400">{r.fitting.qr_id}</p></div><StatusBadge status={r.fitting.status} /></div>
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Zone</span><span className="font-medium text-slate-700 dark:text-slate-200">{r.fitting.railway_zone}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Station</span><span className="font-medium text-slate-700 dark:text-slate-200">{r.fitting.station_name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Inspections</span><span className="font-medium text-slate-700 dark:text-slate-200">{r.inspections.length}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Maintenance</span><span className="font-medium text-slate-700 dark:text-slate-200">{r.maintenance.length}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Complaints</span><span className="font-medium text-slate-700 dark:text-slate-200">{r.complaints.length}</span></div>
                  </div>
                  <button onClick={() => generatePdf(r)} className="btn-primary w-full"><Download size={16} /> Download PDF</button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'summary' && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Period Summary</h3>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${period === p ? 'bg-rail-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-rail-900 dark:text-slate-300'}`}><Calendar size={12} className="mr-1 inline" />{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label="Components" value={rows.length} icon={FileText} color="text-rail-600" />
              <StatBox label="Inspections" value={periodInspections.length} icon={BrainCircuit} color="text-accent-600" />
              <StatBox label="Pass Rate" value={`${passRate}%`} icon={TrendingUp} color="text-green-600" />
              <StatBox label="Maintenance" value={allMaintenance.length} icon={Calendar} color="text-rail-600" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox label="Passed" value={passed} icon={CheckCircle2} color="text-green-600" />
              <StatBox label="Failed" value={failed} icon={XCircle} color="text-red-600" />
              <StatBox label="Completed" value={completed} icon={CheckCircle2} color="text-green-600" />
              <StatBox label="Pending" value={allMaintenance.length - completed} icon={Clock} color="text-accent-600" />
            </div>
            <button onClick={generateSummaryPdf} className="btn-primary mt-5"><Download size={16} /> Download {period} PDF Report</button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Inspection Trend</h3>
              <Line data={{ labels: months, datasets: [{ label: 'Inspections', data: months.map((m) => monthMap[m]), borderColor: '#245a98', backgroundColor: 'rgba(36,90,152,0.1)', fill: true, tension: 0.4 }] }}
                options={{ responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Pass vs Fail</h3>
              <Doughnut data={{ labels: ['Passed', 'Failed'], datasets: [{ data: [passed, failed], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] }}
                options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12 } } } }} />
            </motion.div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Components by Zone</h3>
              {Object.keys(zoneMap).length > 0 ? (
                <Bar data={{ labels: Object.keys(zoneMap), datasets: [{ data: Object.values(zoneMap), backgroundColor: palette, borderRadius: 6 }] }}
                  options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />
              ) : <p className="py-8 text-center text-sm text-slate-400">No data</p>}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
              <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Maintenance Status</h3>
              <Doughnut data={{ labels: ['Completed', 'Scheduled', 'Overdue'], datasets: [{ data: [completed, allMaintenance.filter((m) => m.status === 'Scheduled').length, allMaintenance.filter((m) => m.status === 'Overdue').length], backgroundColor: ['#10b981', '#3573b5', '#ef4444'], borderWidth: 0 }] }}
                options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12 } } } }} />
            </motion.div>
          </div>
        </div>
      )}

      {tab === 'engineer' && (
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Engineer Performance</h3>
          {engineers.length === 0 ? <EmptyState icon={User} title="No engineers found" message="Add engineer profiles to track performance." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-rail-800 dark:text-slate-400"><th className="pb-2 pr-4 font-medium">Engineer</th><th className="pb-2 pr-4 font-medium">Zone</th><th className="pb-2 pr-4 font-medium">Assigned</th><th className="pb-2 pr-4 font-medium">Completed</th><th className="pb-2 pr-4 font-medium">Pending</th><th className="pb-2 font-medium">Completion Rate</th></tr></thead>
                <tbody>
                  {engineers.map((e) => {
                    const engMaint = allMaintenance.filter((m) => m.engineer_id === e.id);
                    const comp = engMaint.filter((m) => m.status === 'Completed').length;
                    const rate = engMaint.length > 0 ? Math.round((comp / engMaint.length) * 100) : 0;
                    return (
                      <tr key={e.id} className="table-row">
                        <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{e.full_name}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-400"><MapPin size={12} className="mr-1 inline" />{e.zone}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{engMaint.length}</td>
                        <td className="py-3 pr-4 text-green-600 dark:text-green-400">{comp}</td>
                        <td className="py-3 pr-4 text-accent-600 dark:text-accent-400">{engMaint.length - comp}</td>
                        <td className="py-3"><div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-rail-800"><div className="h-full rounded-full bg-rail-600" style={{ width: `${rate}%` }} /></div><span className="text-xs font-medium text-slate-700 dark:text-slate-300">{rate}%</span></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof FileText; color: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-rail-800 dark:bg-rail-900/50"><div className="flex items-center gap-2 text-slate-400"><Icon size={14} /><span className="text-xs font-medium uppercase">{label}</span></div><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p></div>;
}
