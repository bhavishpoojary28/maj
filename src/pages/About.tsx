import { motion } from 'framer-motion';
import {
  Train, BrainCircuit, QrCode, ShieldCheck, Target,
  BookOpen, GraduationCap, Users, Calendar, Code2, Database,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

export default function About() {
  return (
    <>
      <PageHeader title="About This Project" subtitle="AI-Based Development of Laser-Based QR Code Marking on Track Fittings for Indian Railways" />

      {/* Project Title Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 overflow-hidden p-0"
      >
        <div className="bg-gradient-to-br from-rail-700 to-rail-900 p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Train size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-snug">
                AI-Based Development of Laser-Based QR Code Marking on Track Fittings for Indian Railways
              </h2>
              <p className="mt-2 text-sm text-rail-200">
                A final-year engineering project demonstrating the integration of artificial intelligence,
                laser marking technology, and QR code systems for railway asset management.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          {[
            { icon: GraduationCap, label: 'Project Type', value: 'Final Year B.E.' },
            { icon: Calendar, label: 'Academic Year', value: '2025–2026' },
            { icon: Users, label: 'Department', value: 'Computer Science' },
            { icon: Code2, label: 'Tech Stack', value: 'React + Supabase' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400">
                <item.icon size={20} />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Objective */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Target size={18} className="text-rail-600 dark:text-rail-400" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Project Objective</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The objective of this project is to develop an AI-assisted system that automates the inspection
          of laser-engraved QR codes on railway track fittings. By combining computer vision techniques
          for quality assessment with a centralized asset management platform, the system ensures that
          every track component is uniquely identifiable, traceable, and maintained throughout its lifecycle.
          This replaces manual inspection methods with a faster, more reliable, and data-driven approach.
        </p>
      </motion.div>

      {/* Key Modules */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-rail-600 dark:text-rail-400" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Key Modules</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: QrCode, title: 'QR Code Generation', desc: 'Generate unique QR codes for each track fitting with downloadable formats (PNG, SVG, PDF).' },
            { icon: BrainCircuit, title: 'AI-Assisted Inspection', desc: 'Analyze QR code images using computer vision metrics like blur, contrast, and damage detection.' },
            { icon: ShieldCheck, title: 'Asset Management', desc: 'Track all railway fittings with status monitoring, GPS mapping, and maintenance scheduling.' },
            { icon: Train, title: 'Complaint Management', desc: 'Register and track complaints with priority levels and status workflow tracking.' },
            { icon: Database, title: 'Reporting & Analytics', desc: 'Generate professional PDF reports and visualize system data through interactive charts.' },
          ].map((m) => (
            <div key={m.title} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm dark:border-rail-800">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400">
                <m.icon size={20} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Problem Statement & Solution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <h3 className="mb-3 text-base font-semibold text-red-600 dark:text-red-400">Problem Statement</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-red-500">•</span> Manual identification of track components is slow and error-prone.</li>
            <li className="flex gap-2"><span className="text-red-500">•</span> Painted markings fade due to weather and wear, making components unidentifiable.</li>
            <li className="flex gap-2"><span className="text-red-500">•</span> No centralized system to track inspection history and maintenance schedules.</li>
            <li className="flex gap-2"><span className="text-red-500">•</span> Human inspection of markings is subjective and inconsistent.</li>
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
          <h3 className="mb-3 text-base font-semibold text-green-600 dark:text-green-400">Proposed Solution</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-green-500">•</span> Laser engrave permanent QR codes on each track fitting for durable identification.</li>
            <li className="flex gap-2"><span className="text-green-500">•</span> AI-assisted image analysis evaluates QR code quality with measurable metrics.</li>
            <li className="flex gap-2"><span className="text-green-500">•</span> Centralized cloud database stores all asset, inspection, and maintenance records.</li>
            <li className="flex gap-2"><span className="text-green-500">•</span> Automated PASS/FAIL decisions with confidence scoring ensure consistency.</li>
          </ul>
        </motion.div>
      </div>
    </>
  );
}
