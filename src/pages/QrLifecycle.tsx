import { motion } from 'framer-motion';
import {
  QrCode, ScanLine, BrainCircuit, Wrench,
  CalendarClock, FileText, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

const STAGES = [
  { icon: Wrench, title: '1. Component Registration', desc: 'A new track fitting is registered in the system with details like component ID, type, material, zone, station, and GPS coordinates.', color: 'rail' },
  { icon: QrCode, title: '2. QR Code Generation', desc: 'A unique QR ID is generated (format: RQR-ZONE-TIMESTAMP). The QR code is created encoding the component data and made available for download.', color: 'accent' },
  { icon: ScanLine, title: '3. Field Scanning', desc: 'During routine inspections, field staff scan the QR code using a mobile camera. The system retrieves the full component history instantly.', color: 'rail' },
  { icon: BrainCircuit, title: '4. AI Inspection', desc: 'A photo of the QR code is analyzed by the AI engine for quality metrics. PASS/FAIL is determined with confidence score and defect regions highlighted.', color: 'accent' },
  { icon: CalendarClock, title: '5. Maintenance Action', desc: 'Based on inspection results, maintenance is scheduled and all actions are logged.', color: 'green' },
  { icon: FileText, title: '6. Reporting', desc: 'Comprehensive PDF reports are generated for audits, compliance, and management review. Analytics dashboards show trends and system performance.', color: 'rail' },
  { icon: CheckCircle2, title: '7. Lifecycle Complete', desc: 'When a component reaches end-of-life, it is decommissioned in the system. Full history from registration to decommission is preserved.', color: 'accent' },
];

export default function QrLifecycle() {
  return (
    <>
      <PageHeader title="QR Code Lifecycle" subtitle="End-to-end journey of a QR code from generation to decommissioning" />

      {/* Circular Flow Visualization */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 p-6">
        <h3 className="mb-6 text-center text-base font-semibold text-slate-800 dark:text-slate-100">Complete Lifecycle Flow</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage, i) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-xl border border-slate-200 p-4 dark:border-rail-800"
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                stage.color === 'rail' ? 'bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' :
                stage.color === 'accent' ? 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' :
                'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
              }`}>
                <stage.icon size={24} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stage.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{stage.desc}</p>
              {i < STAGES.length - 1 && (
                <div className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center lg:flex">
                  <div className="h-full w-px bg-slate-300 dark:bg-rail-700" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* QR ID Format */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">QR ID Format</h3>
        <div className="rounded-xl bg-rail-50 p-6 text-center dark:bg-rail-800/40">
          <p className="font-mono text-2xl font-bold text-rail-700 dark:text-rail-300">RQR-ZONE-TIMESTAMP</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Example: RQR-NR-7K3M9X</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-rail-800">
            <p className="font-mono text-sm font-bold text-rail-600 dark:text-rail-400">RQR</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fixed prefix indicating RailQR system</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-rail-800">
            <p className="font-mono text-sm font-bold text-accent-600 dark:text-accent-400">ZONE</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Railway zone code (NR, ER, WR, SR, etc.)</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-rail-800">
            <p className="font-mono text-sm font-bold text-green-600 dark:text-green-400">TIMESTAMP</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Base36-encoded timestamp + random suffix for uniqueness</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
