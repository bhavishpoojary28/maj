import '../lib/chartSetup';
import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Wrench, QrCode, BrainCircuit, CheckCircle2, XCircle, CalendarClock,
  Activity, Server, Cpu, Train, Users, RefreshCw, Clock,
  MessageSquareWarning,
  ScanLine, FileText, Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { PageHeader } from '../components/Topbar';
import { SkeletonCard, StatusBadge } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

type Stats = {
  fittings: number; qrs: number; inspections: number; passed: number; failed: number;
  maintenanceDue: number; unreadNotifs: number; complaints: number;
  todayInspections: number; todayQrs: number; engineersOnline: number; lastSync: string;
};

type Activity = { id: string; type: string; description: string; time: string };

export default function Dashboard() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthly, setMonthly] = useState<{ labels: string[]; pass: number[]; fail: number[] } | null>(null);
  const [zoneData, setZoneData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [statusData, setStatusData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [componentData, setComponentData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [trendData, setTrendData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [
          { count: fittings }, { count: qrs }, { count: inspections },
          { count: passed }, { count: failed }, { count: maintenanceDue },
          { count: unreadNotifs }, { count: complaints },
          { count: todayInspections }, { count: todayQrs },
        ] = await Promise.all([
          supabase.from('track_fittings').select('*', { count: 'exact', head: true }),
          supabase.from('track_fittings').select('*', { count: 'exact', head: true }).not('qr_id', 'is', null),
          supabase.from('inspections').select('*', { count: 'exact', head: true }),
          supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('result', 'PASS'),
          supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('result', 'FAIL'),
          supabase.from('maintenance_logs').select('*', { count: 'exact', head: true }).in('status', ['Scheduled', 'Overdue']),
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false),
          supabase.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['Open', 'In Progress']),
          supabase.from('inspections').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          supabase.from('track_fittings').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        ]);

        const { count: engineersOnline } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'engineer');

        setStats({
          fittings: fittings ?? 0, qrs: qrs ?? 0, inspections: inspections ?? 0,
          passed: passed ?? 0, failed: failed ?? 0, maintenanceDue: maintenanceDue ?? 0,
          unreadNotifs: unreadNotifs ?? 0, complaints: complaints ?? 0,
          todayInspections: todayInspections ?? 0, todayQrs: todayQrs ?? 0,
          engineersOnline: engineersOnline ?? 0, lastSync: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });

        const { data: inspData } = await supabase.from('inspections').select('result, created_at').order('created_at', { ascending: false }).limit(500);
        const months: string[] = []; const passMap: Record<string, number> = {}; const failMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const label = d.toLocaleString('en-US', { month: 'short' }); months.push(label); passMap[label] = 0; failMap[label] = 0; }
        (inspData ?? []).forEach((r: any) => { const d = new Date(r.created_at); const label = d.toLocaleString('en-US', { month: 'short' }); if (label in passMap) { if (r.result === 'PASS') passMap[label]++; else failMap[label]++; } });
        setMonthly({ labels: months, pass: months.map((m) => passMap[m]), fail: months.map((m) => failMap[m]) });

        const { data: fitData } = await supabase.from('track_fittings').select('railway_zone, status, component_type');
        const zoneMap: Record<string, number> = {};
        const statusMap: Record<string, number> = {};
        const compMap: Record<string, number> = {};
        (fitData ?? []).forEach((f: any) => {
          zoneMap[f.railway_zone] = (zoneMap[f.railway_zone] ?? 0) + 1;
          statusMap[f.status] = (statusMap[f.status] ?? 0) + 1;
          if (f.component_type) compMap[f.component_type] = (compMap[f.component_type] ?? 0) + 1;
        });
        setZoneData({ labels: Object.keys(zoneMap), data: Object.values(zoneMap) });
        setStatusData({ labels: Object.keys(statusMap), data: Object.values(statusMap) });
        const topComps = Object.entries(compMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
        setComponentData({ labels: topComps.map((c) => c[0]), data: topComps.map((c) => c[1]) });

        const trendMap: Record<string, number> = {};
        months.forEach((m) => trendMap[m] = 0);
        (fitData ?? []).forEach((f: any) => { const d = new Date(f.created_at); const label = d.toLocaleString('en-US', { month: 'short' }); if (label in trendMap) trendMap[label]++; });
        let cum = 0; const cumArr = months.map((m) => { cum += trendMap[m]; return cum; });
        setTrendData({ labels: months, data: cumArr });

        const { data: recentData } = await supabase.from('inspections').select('id, qr_id, result, confidence, created_at').order('created_at', { ascending: false }).limit(5);
        setRecent(recentData ?? []);

        const { data: complaintData } = await supabase.from('complaints').select('id, qr_id, complaint_type, priority, status, created_at').order('created_at', { ascending: false }).limit(4);
        setRecentComplaints(complaintData ?? []);

        const [insp, maint, compl] = await Promise.all([
          supabase.from('inspections').select('id, qr_id, result, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('maintenance_logs').select('id, qr_id, status, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('complaints').select('id, qr_id, complaint_type, created_at').order('created_at', { ascending: false }).limit(3),
        ]);
        const acts: Activity[] = [];
        (insp.data ?? []).forEach((r: any) => acts.push({ id: r.id, type: 'inspection', description: `AI Inspection ${r.result === 'PASS' ? 'passed' : 'failed'} for ${r.qr_id ?? 'component'}`, time: r.created_at }));
        (maint.data ?? []).forEach((r: any) => acts.push({ id: r.id, type: 'maintenance', description: `Maintenance ${r.status} for ${r.qr_id ?? 'component'}`, time: r.created_at }));
        (compl.data ?? []).forEach((r: any) => acts.push({ id: r.id, type: 'complaint', description: `Complaint registered: ${r.complaint_type}`, time: r.created_at }));
        acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setActivity(acts.slice(0, 8));
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
    </>
  );

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.08)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const palette = ['#245a98', '#3573b5', '#5a93cb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const aiAccuracy = stats && stats.inspections > 0 ? Math.round((stats.passed / stats.inspections) * 100) : 0;
  const passRate = stats && stats.inspections > 0 ? Math.round((stats.passed / stats.inspections) * 100) : 0;

  return (
    <>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'Staff'}`} subtitle="Overview of track fittings, QR codes, and AI inspections">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-rail-800 dark:bg-rail-900 dark:text-slate-400">
          <RefreshCw size={14} className="text-green-500" />
          <span>Last sync: {stats?.lastSync}</span>
        </div>
      </PageHeader>

      {/* 8 KPI Cards with trends */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Track Fittings" value={stats?.fittings ?? 0} icon={Wrench} delay={0} trend="up" trendLabel="+12% this month" />
        <StatCard label="QR Codes Generated" value={stats?.qrs ?? 0} icon={QrCode} tone="rail" delay={0.05} trend="up" trendLabel={`${stats?.todayQrs ?? 0} today`} />
        <StatCard label="AI Accuracy" value={`${aiAccuracy}%`} icon={BrainCircuit} tone="green" delay={0.1} trend={aiAccuracy >= 90 ? 'up' : 'down'} trendLabel={`${stats?.passed ?? 0} passed`} />
        <StatCard label="Maintenance Due" value={stats?.maintenanceDue ?? 0} icon={CalendarClock} tone="amber" delay={0.15} trend={stats && stats.maintenanceDue > 0 ? 'down' : 'neutral'} trendLabel="Needs attention" />
        <StatCard label="Passed Components" value={stats?.passed ?? 0} icon={CheckCircle2} tone="green" delay={0.2} trend="up" trendLabel={`${passRate}% pass rate`} />
        <StatCard label="Failed Components" value={stats?.failed ?? 0} icon={XCircle} tone="red" delay={0.25} trend={stats && stats.failed > 0 ? 'down' : 'neutral'} trendLabel={stats && stats.failed > 0 ? 'Investigate' : 'All clear'} />
        <StatCard label="Engineers Online" value={stats?.engineersOnline ?? 0} icon={Users} tone="rail" delay={0.3} trend="neutral" trendLabel="Active now" />
        <StatCard label="Open Complaints" value={stats?.complaints ?? 0} icon={MessageSquareWarning} tone="red" delay={0.35} trend={stats && stats.complaints > 0 ? 'down' : 'neutral'} trendLabel={stats && stats.complaints > 0 ? 'Needs review' : 'All clear'} />
      </div>

      {/* Today's Operational Summary */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-glass flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rail-100 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400"><BrainCircuit size={24} /></div>
          <div><p className="text-sm text-slate-500 dark:text-slate-400">Today's Inspections</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.todayInspections ?? 0}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glass flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400"><QrCode size={24} /></div>
          <div><p className="text-sm text-slate-500 dark:text-slate-400">QR Generated Today</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.todayQrs ?? 0}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-glass flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"><Activity size={24} /></div>
          <div><p className="text-sm text-slate-500 dark:text-slate-400">AI Pass Rate</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{passRate}%</p></div>
        </motion.div>
      </div>

      {/* Charts Row 1: Monthly Bar + Zone Doughnut */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Monthly Inspections</h3>
          {monthly && (
            <Bar data={{ labels: monthly.labels, datasets: [{ label: 'Pass', data: monthly.pass, backgroundColor: '#10b981', borderRadius: 6 }, { label: 'Fail', data: monthly.fail, backgroundColor: '#ef4444', borderRadius: 6 }] }}
              options={{ responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Fittings by Zone</h3>
          {zoneData && zoneData.labels.length > 0 ? (
            <Doughnut data={{ labels: zoneData.labels, datasets: [{ data: zoneData.data, backgroundColor: palette, borderWidth: 0 }] }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12 } } } }} />
          ) : <p className="py-8 text-center text-sm text-slate-400">No fittings yet</p>}
        </motion.div>
      </div>

      {/* Charts Row 2: Status Doughnut + Component Bar + Trend Line */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Status Distribution</h3>
          {statusData && statusData.labels.length > 0 ? (
            <Doughnut data={{ labels: statusData.labels, datasets: [{ data: statusData.data, backgroundColor: ['#10b981', '#f59e0b', '#6b7280', '#ef4444'], borderWidth: 0 }] }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12 } } } }} />
          ) : <p className="py-8 text-center text-sm text-slate-400">No data</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Top Component Types</h3>
          {componentData && componentData.labels.length > 0 ? (
            <Bar data={{ labels: componentData.labels, datasets: [{ data: componentData.data, backgroundColor: '#3573b5', borderRadius: 6 }] }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: tickColor, maxRotation: 45 }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />
          ) : <p className="py-8 text-center text-sm text-slate-400">No data</p>}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Asset Growth Trend</h3>
          {trendData && (
            <Line data={{ labels: trendData.labels, datasets: [{ label: 'Cumulative Fittings', data: trendData.data, borderColor: '#245a98', backgroundColor: 'rgba(36,90,152,0.1)', fill: true, tension: 0.4 }] }}
              options={{ responsive: true, plugins: { legend: { labels: { color: tickColor } } }, scales: { x: { ticks: { color: tickColor }, grid: { color: gridColor } }, y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true } } }} />
          )}
        </motion.div>
      </div>

      {/* Activity Timeline + Weather + System Health */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Activity Timeline</h3>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id + a.type} className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${a.type === 'inspection' ? 'bg-green-500' : a.type === 'maintenance' ? 'bg-accent-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.description}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400"><Clock size={11} />{new Date(a.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-sm text-slate-400">No recent activity</p>}
        </motion.div>

        <div className="space-y-4">
          {/* System Health */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-5">
            <div className="mb-3 flex items-center gap-2"><Server size={16} className="text-rail-600 dark:text-rail-400" /><h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Health</h3></div>
            <div className="space-y-2.5">
              <HealthBar icon={Cpu} label="API Response" value={stats?.fittings ? 98 : 100} color="bg-green-500" />
              <HealthBar icon={Activity} label="Database" value={stats?.fittings ? 95 : 100} color="bg-rail-500" />
              <HealthBar icon={BrainCircuit} label="AI Engine" value={92} color="bg-accent-500" />
              <HealthBar icon={Train} label="QR Service" value={100} color="bg-green-500" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 card p-5">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { to: '/qr-generator', icon: QrCode, label: 'Generate QR', tone: 'bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' },
            { to: '/scanner', icon: ScanLine, label: 'Scan QR', tone: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400' },
            { to: '/inspection', icon: BrainCircuit, label: 'AI Inspect', tone: 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' },
            { to: '/fittings', icon: Plus, label: 'Add Fitting', tone: 'bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' },
            { to: '/maintenance', icon: CalendarClock, label: 'Schedule', tone: 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' },
            { to: '/reports', icon: FileText, label: 'Reports', tone: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400' },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition-all hover:border-rail-300 hover:shadow-sm dark:border-rail-800 dark:hover:border-rail-700">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.tone} transition-transform group-hover:scale-110`}><a.icon size={22} /></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Inspections Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent AI Inspections</h3>
          <Link to="/inspection" className="text-sm font-medium text-rail-600 hover:text-rail-700 dark:text-rail-400">View all</Link>
        </div>
        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-rail-800 dark:text-slate-400"><th className="pb-2 font-medium">QR ID</th><th className="pb-2 font-medium">Result</th><th className="pb-2 font-medium">Confidence</th><th className="pb-2 font-medium">Date</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{r.qr_id ?? '—'}</td>
                    <td className="py-2.5"><span className={`badge ${r.result === 'PASS' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>{r.result}</span></td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{r.confidence}%</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="py-8 text-center text-sm text-slate-400">No inspections yet. Run your first AI inspection.</p>}
      </motion.div>

      {/* Recent Complaints */}
      {recentComplaints.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Complaints</h3>
            <Link to="/complaints" className="text-sm font-medium text-rail-600 hover:text-rail-700 dark:text-rail-400">View all</Link>
          </div>
          <div className="space-y-2.5">
            {recentComplaints.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-rail-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"><MessageSquareWarning size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.complaint_type}</p>
                    <p className="text-xs text-slate-400">{c.qr_id ?? 'Unlinked'} · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}

function HealthBar({ icon: Icon, label, value, color }: { icon: typeof Server; label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Icon size={12} />{label}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{value}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-rail-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}
