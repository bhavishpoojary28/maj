import { motion } from 'framer-motion';
import {
  Code2, Database, BrainCircuit, QrCode,
  Palette, BarChart3,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

const STACK = [
  {
    category: 'Frontend Framework',
    icon: Code2,
    color: 'rail',
    items: [
      { name: 'React 18', desc: 'Component-based UI library with hooks' },
      { name: 'TypeScript', desc: 'Type-safe JavaScript for robust development' },
      { name: 'Vite', desc: 'Fast build tool with HMR and optimized bundling' },
      { name: 'React Router', desc: 'Client-side routing with protected routes' },
    ],
  },
  {
    category: 'Styling & UI',
    icon: Palette,
    color: 'accent',
    items: [
      { name: 'Tailwind CSS', desc: 'Utility-first CSS framework with custom theme' },
      { name: 'Framer Motion', desc: 'Animation library for transitions and gestures' },
      { name: 'Lucide React', desc: 'Open-source icon library with 1000+ icons' },
      { name: 'Custom Design System', desc: 'Railway-themed color palette with dark mode' },
    ],
  },
  {
    category: 'Backend & Database',
    icon: Database,
    color: 'green',
    items: [
      { name: 'Supabase', desc: 'Open-source Firebase alternative on PostgreSQL' },
      { name: 'PostgreSQL', desc: 'Relational database with RLS policies' },
      { name: 'Supabase Auth', desc: 'Email/password authentication with JWT' },
      { name: 'Supabase Storage', desc: 'Image storage for track fitting photos' },
    ],
  },
  {
    category: 'AI & Image Processing',
    icon: BrainCircuit,
    color: 'rail',
    items: [
      { name: 'Canvas API', desc: 'Client-side image rendering and pixel analysis' },
      { name: 'Laplacian Variance', desc: 'Blur detection algorithm' },
      { name: 'Luminance Analysis', desc: 'Contrast and brightness scoring' },
      { name: 'Bounding Box Detection', desc: 'Defect region identification' },
    ],
  },
  {
    category: 'QR & Document Tools',
    icon: QrCode,
    color: 'accent',
    items: [
      { name: 'qrcode (npm)', desc: 'QR code generation in PNG, SVG formats' },
      { name: 'html5-qrcode', desc: 'Camera-based QR code scanning' },
      { name: 'jsPDF', desc: 'PDF report and label generation' },
    ],
  },
  {
    category: 'Data Visualization',
    icon: BarChart3,
    color: 'green',
    items: [
      { name: 'Chart.js', desc: 'Interactive charts (bar, doughnut, line)' },
      { name: 'react-chartjs-2', desc: 'React wrapper for Chart.js' },
    ],
  },
];

export default function TechStack() {
  return (
    <>
      <PageHeader title="Technology Stack" subtitle="Tools, frameworks, and libraries used to build RailQR AI" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STACK.map((cat, i) => (
          <motion.div
            key={cat.category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                cat.color === 'rail' ? 'bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' :
                cat.color === 'accent' ? 'bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' :
                'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
              }`}>
                <cat.icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cat.category}</h3>
            </div>
            <div className="space-y-2.5">
              {cat.items.map((item) => (
                <div key={item.name} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rail-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
