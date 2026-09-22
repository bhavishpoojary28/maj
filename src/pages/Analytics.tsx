import '../lib/chartSetup';
import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/Topbar';
import { LoadingSpinner } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { useToast } from '../lib/toast';

export default function Analytics() {
  const { theme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<{ labels: string[]; pass: number[]; fail: number[] } | null>(null);
  const [passFail, setPassFail] = useState<{ pass: number; fail: number } | null>(null);
  const [zoneData, setZoneData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [typeData, setTypeData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [maintFreq, setMaintFreq] = useState<{ labels: string[]; data: number[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: inspData }, { data: fitData }, { data: maintData }] = await Promise.all([
          supabase.from('inspections').select('result, created_at').order('created_at', { ascending: false }).limit(1000),
          supabase.from('track_fittings').select('railway_zone, component_type'),
          supabase.from('maintenance_logs').select('type, created_at').limit(1000),
        ]);
        const months: string[] = []; const passMap: Record<string, number> = {}; const failMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' }); months.push(label); passMap[label] = 0; failMap[label] = 0; }
        let pass = 0, fail = 0;
        (inspData ?? []).forEach((r: any) => { const d = new Date(r.created_at); const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' }); if (passMap.hasOwnProperty(label)) { if (r.result === 'PASS') { passMap[label]++; pass++; } else { failMap[label]++; fail++; } } else if (r.result === 'PASS') pass++; else fail++; });
        setMonthly({ labels: months, pass: months.map((m) => passMap[m]), fail: months.map((m) => failMap[m]) });
        setPassFail({ pass, fail });
        const zoneMap: Record<string, number> = {}; (fitData ?? []).forEach((f: any) => { zoneMap[f.railway_zone] = (zoneMap[f.railway_zone] ?? 0) + 1; }); setZoneData({ labels: Object.keys(zoneMap), data: Object.values(zoneMap) });
        const typeMap: Record<string, number> = {}; (fitData ?? []).forEach((f: any) => { typeMap[f.component_type] = (typeMap[f.component_type] ?? 0) + 1; }); setTypeData({ labels: Object.keys(typeMap), data: Object.values(typeMap) });
        const maintMap: Record<string, number> = {}; (maintData ?? []).forEach((m: any) => { maintMap[m.type] = (maintMap[m.type] ?? 0) + 1; }); setMaintFreq({ labels: Object.keys(maintMap), data: Object.values(maintMap) });
      } catch (e) { toast('error', 'Failed to load analytics data'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingSpinner label="Loading analytics..." />;
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const palette = ['#245a98', '#3573b5', '#5a93cb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

  return (
    <>
      <PageHeader title="Analytics" subtitle="Inspection trends, zone analysis, and maintenance frequency" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Monthly Inspections (12 months)</h3>
          {monthly && <Line data={{ labels: monthly.labels, datasets: [{ label: 'Pass', data: monthly.pass, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.3, fill: true }, { label: 'Fail', data: monthly.fail, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3, fill: true }] }} options={{ responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Pass vs Fail</h3>
          {passFail && (passFail.pass > 0 || passFail.fail > 0) ? <Doughnut data={{ labels: ['Pass', 'Fail'], datasets: [{ data: [passFail.pass, passFail.fail], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] }} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12 } } } }} /> : <p className="py-8 text-center text-sm text-slate-400">No inspection data yet</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Railway Zone Analysis</h3>
          {zoneData && zoneData.labels.length > 0 ? <Bar data={{ labels: zoneData.labels, datasets: [{ label: 'Fittings', data: zoneData.data, backgroundColor: palette, borderRadius: 6 }] }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} /> : <p className="py-8 text-center text-sm text-slate-400">No fitting data yet</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Component Type Analysis</h3>
          {typeData && typeData.labels.length > 0 ? <Doughnut data={{ labels: typeData.labels, datasets: [{ data: typeData.data, backgroundColor: palette, borderWidth: 0 }] }} options={{ responsive: true, plugins: { legend: { position: 'right', labels: { color: tickColor, boxWidth: 10, font: { size: 10 } } } } }} /> : <p className="py-8 text-center text-sm text-slate-400">No fitting data yet</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Maintenance Frequency by Type</h3>
          {maintFreq && maintFreq.labels.length > 0 ? <Bar data={{ labels: maintFreq.labels, datasets: [{ label: 'Maintenance Logs', data: maintFreq.data, backgroundColor: '#3573b5', borderRadius: 6 }] }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} /> : <p className="py-8 text-center text-sm text-slate-400">No maintenance data yet</p>}
        </motion.div>
      </div>
    </>
  );
}
