import { motion } from 'framer-motion';
import {
  Database, BrainCircuit, Smartphone,
  Server, ShieldCheck, QrCode, Train,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

export default function Architecture() {
  return (
    <>
      <PageHeader title="System Architecture" subtitle="Technical architecture and data flow of the RailQR AI platform" />

      {/* Architecture Layers */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 p-6">
        <h3 className="mb-6 text-base font-semibold text-slate-800 dark:text-slate-100">Three-Tier Architecture</h3>
        <div className="space-y-4">
          {[
            {
              layer: 'Presentation Layer (Frontend)',
              icon: Smartphone,
              color: 'rail',
              techs: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Chart.js'],
              desc: 'Responsive web interface with dark mode, animations, and interactive data visualizations. Handles all user interactions including QR scanning, image upload, and report generation.',
            },
            {
              layer: 'Application Layer (Backend)',
              icon: Server,
              color: 'accent',
              techs: ['Supabase Auth', 'PostgreSQL Database', 'Row Level Security', 'Edge Functions', 'REST API'],
              desc: 'Supabase provides authentication, real-time database access, and secure API endpoints. Row Level Security ensures data access control based on user roles.',
            },
            {
              layer: 'AI/Processing Layer',
              icon: BrainCircuit,
              color: 'green',
              techs: ['Canvas API', 'Computer Vision', 'Image Analysis', 'Quality Scoring', 'Defect Detection'],
              desc: 'Client-side AI engine analyzes QR code images using luminance analysis, Laplacian blur detection, contrast measurement, and damage estimation to produce quality metrics.',
            },
          ].map((tier, i) => (
            <motion.div
              key={tier.layer}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="rounded-xl border border-slate-200 p-5 dark:border-rail-800"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                  tier.color === 'rail' ? 'bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' :
                  tier.color === 'accent' ? 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' :
                  'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
                }`}>
                  <tier.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tier.layer}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{tier.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tier.techs.map((t) => (
                      <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-rail-800 dark:text-slate-300">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Data Flow Diagram */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card mb-6 p-6">
        <h3 className="mb-6 text-base font-semibold text-slate-800 dark:text-slate-100">Data Flow Diagram</h3>
        <div className="flex flex-col items-center gap-3">
          {[
            { icon: Train, label: 'Track Fitting Registered', desc: 'Component data entered into system' },
            { icon: QrCode, label: 'QR Code Generated', desc: 'Unique QR ID assigned and code created' },
            { icon: Smartphone, label: 'QR Code Scanned', desc: 'Field staff scans component for inspection' },
            { icon: BrainCircuit, label: 'AI Inspection Runs', desc: 'Image analyzed for quality metrics' },
            { icon: Database, label: 'Results Stored', desc: 'Pass/Fail and metrics saved to database' },
          ].map((step, i) => (
            <div key={step.label} className="flex w-full max-w-md flex-col items-center">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-rail-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400">
                  <step.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              </div>
              {i < 5 && <div className="h-6 w-px bg-slate-300 dark:bg-rail-700" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security Architecture */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-rail-600 dark:text-rail-400" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Security Architecture</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { title: 'Authentication', desc: 'Supabase Auth with email/password. JWT tokens with automatic refresh.' },
            { title: 'Row Level Security', desc: 'Database-level access control. Users can only access authorized data.' },
            { title: 'Role-Based Access', desc: 'Three roles: Admin, Engineer, Operator with differentiated permissions.' },
            { title: 'Audit Logging', desc: 'All critical actions logged with user ID, timestamp, and action details.' },
          ].map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-200 p-4 dark:border-rail-800">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
