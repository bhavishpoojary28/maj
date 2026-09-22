import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Train, QrCode, BrainCircuit, ShieldCheck, BarChart3,
  ArrowRight, CheckCircle2, Cpu, Camera, FileText,
} from 'lucide-react';

const FEATURES = [
  { icon: QrCode, title: 'QR Code Generation', desc: 'Generate unique QR codes for every track fitting with SVG, PNG, PDF export and bulk generation.' },
  { icon: BrainCircuit, title: 'AI Inspection', desc: 'Canvas-based image analysis detects blur, low contrast, and off-center markings with bounding boxes and heatmaps.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Daily, weekly, and monthly reports with engineer performance metrics and AI accuracy tracking.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Admin, Engineer, and Operator roles with granular permissions and audit logging.' },
];

const STATS = [
  { value: '25+', label: 'Track Fittings' },
  { value: '5', label: 'Quality Metrics' },
  { value: '10', label: 'Railway Zones' },
  { value: '12', label: 'Modules' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-rail-950">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg dark:border-rail-800/50 dark:bg-rail-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rail-700 text-white shadow"><Train size={20} /></div>
            <span className="text-lg font-bold text-rail-800 dark:text-white">RailQR AI</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-rail-700 dark:text-slate-300 dark:hover:text-white">Features</a>
            <a href="#stats" className="text-sm font-medium text-slate-600 hover:text-rail-700 dark:text-slate-300 dark:hover:text-white">Stats</a>
            <a href="#workflow" className="text-sm font-medium text-slate-600 hover:text-rail-700 dark:text-slate-300 dark:hover:text-white">Workflow</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-rail-700 dark:text-slate-200 dark:hover:text-white">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started <ArrowRight size={15} /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-rail-50 via-white to-white dark:from-rail-900 dark:via-rail-950 dark:to-rail-950" />
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-rail-200/40 blur-3xl dark:bg-rail-700/20" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-700/10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-rail-200 bg-rail-50 px-4 py-1.5 text-xs font-semibold text-rail-700 dark:border-rail-700 dark:bg-rail-900 dark:text-rail-300"><Cpu size={13} /> AI-Powered Railway Asset Management</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              AI-Powered Asset Management for <span className="text-rail-700 dark:text-rail-400">Indian Railways</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              RailQR AI transforms track fitting management with AI-powered inspection, QR code generation, defect reporting, and real-time asset tracking across the railway network.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary w-full sm:w-auto">Start Managing Assets <ArrowRight size={16} /></Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto">Sign In to Dashboard</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-slate-200 bg-slate-50 py-12 dark:border-rail-800 dark:bg-rail-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-3xl font-bold text-rail-700 dark:text-rail-400 lg:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything you need to manage railway assets</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">From QR generation to AI inspection and defect reporting — all in one platform.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-rail-300 hover:shadow-lg dark:border-rail-800 dark:bg-rail-900 dark:hover:border-rail-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rail-50 text-rail-700 transition group-hover:scale-110 dark:bg-rail-800 dark:text-rail-300"><f.icon size={24} /></div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-slate-50 py-20 dark:bg-rail-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How it works</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">A streamlined workflow from marking to inspection to maintenance.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { icon: QrCode, step: '01', title: 'Generate QR', desc: 'Create unique QR codes for each track fitting component.' },
              { icon: Camera, step: '02', title: 'AI Inspect', desc: 'Upload or capture images for automated quality inspection.' },
              { icon: FileText, step: '03', title: 'Track & Report', desc: 'Monitor maintenance, report defects, and track performance.' },
            ].map((w, i) => (
              <motion.div key={w.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rail-700 text-white shadow-lg"><w.icon size={26} /></div>
                <span className="mt-4 block text-xs font-bold text-rail-400">{w.step}</span>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rail-800 to-rail-950 p-10 text-center shadow-2xl">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
            <h2 className="relative text-3xl font-bold text-white">Ready to modernize your railway assets?</h2>
            <p className="relative mt-4 text-rail-200">Join the next generation of railway asset management with RailQR AI.</p>
            <Link to="/register" className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-rail-800 shadow-lg transition hover:bg-rail-50">Get Started Free <ArrowRight size={16} /></Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 dark:border-rail-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rail-700 text-white"><Train size={18} /></div>
            <span className="font-bold text-slate-800 dark:text-white">RailQR AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span>RailQR AI — QR Asset Management System for Indian Railways</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Indian Railways</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
