import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wrench, QrCode, ScanLine, BrainCircuit,
  CalendarClock, MessageSquareWarning, FileText, BarChart3,
  Bell, Settings, Database,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

const MODULES = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Centralized overview with KPIs, charts, activity timeline, and system health monitoring. Displays real-time statistics for fittings, inspections, and maintenance.', route: '/dashboard' },
  { icon: Wrench, title: 'Track Fitting Management', desc: 'Full CRUD operations for railway track components. Supports image upload, GPS coordinates, status tracking, and CSV/Excel export.', route: '/fittings' },
  { icon: QrCode, title: 'QR Code Generator', desc: 'Generates unique QR codes for each fitting. Supports PNG, SVG, and PDF download. Includes bulk generation and print-ready label formatting.', route: '/qr-generator' },
  { icon: ScanLine, title: 'QR Scanner', desc: 'Camera-based QR scanning using html5-qrcode library. Manual lookup fallback. Displays full component history including inspections and complaints.', route: '/scanner' },
  { icon: BrainCircuit, title: 'AI Inspection Module', desc: 'Computer vision-based image analysis. Computes blur, contrast, alignment, damage, and readability scores. Outputs PASS/FAIL with confidence percentage.', route: '/inspection' },
  { icon: CalendarClock, title: 'Maintenance Scheduling', desc: 'Schedule and track maintenance activities. Calendar view, priority levels, engineer assignment, and completion tracking.', route: '/maintenance' },
  { icon: MessageSquareWarning, title: 'Complaint Management', desc: 'Register, photograph, flag defects, track, and resolve complaints with a priority-based workflow.', route: '/complaints' },
  { icon: FileText, title: 'Reports', desc: 'Generate professional PDF reports for individual components, summary statistics, and engineer performance. Excel export support.', route: '/reports' },
  { icon: BarChart3, title: 'Analytics', desc: 'Data visualization with Chart.js. Inspection trends, zone analysis, component distribution, and maintenance frequency charts.', route: '/analytics' },
  { icon: Bell, title: 'Notifications', desc: 'Real-time notification center for failed inspections, maintenance reminders, and system alerts with unread badges.', route: '/notifications' },
  { icon: Database, title: 'Database', desc: 'Supabase PostgreSQL with 7 tables: profiles, track_fittings, inspections, maintenance_logs, complaints, notifications, audit_logs.', route: '/fittings' },
  { icon: Settings, title: 'Settings', desc: 'User profile management, zone assignment, and system configuration.', route: '/settings' },
];

export default function Modules() {
  return (
    <>
      <PageHeader title="Project Modules" subtitle="Complete overview of all functional modules in the RailQR AI system" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card group p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rail-50 text-rail-600 transition-transform group-hover:scale-110 dark:bg-rail-800/60 dark:text-rail-400">
                <m.icon size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{m.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
