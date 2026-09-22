import { motion } from 'framer-motion';
import {
  BrainCircuit, Image as ImageIcon, ScanLine, CheckCircle2,
  XCircle, Gauge, Target, Lightbulb,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';

export default function AiWorkflow() {
  return (
    <>
      <PageHeader title="AI Inspection Workflow" subtitle="How the AI-assisted inspection module analyzes QR code images" />

      {/* Overview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI-Assisted Inspection Engine</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The inspection module uses a computer vision pipeline running entirely in the browser.
              It analyzes QR code images captured by field staff and computes five quality metrics,
              then combines them into a final PASS/FAIL decision with a confidence score.
              This approach enables real-time inspection without sending images to external servers,
              ensuring privacy and reducing latency.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6 p-6">
        <h3 className="mb-6 text-base font-semibold text-slate-800 dark:text-slate-100">Processing Pipeline</h3>
        <div className="space-y-4">
          {[
            { icon: ImageIcon, title: 'Image Acquisition', desc: 'Image is loaded from file upload or camera capture. Resized to 256px maximum dimension for consistent processing.' },
            { icon: Gauge, title: 'Luminance Conversion', desc: 'Each pixel is converted to luminance value using the standard formula: 0.299R + 0.587G + 0.114B.' },
            { icon: BrainCircuit, title: 'Quality Metric Computation', desc: 'Five metrics are computed: Blur Score (Laplacian variance), Contrast Score (standard deviation), Alignment Score (center of mass), Damage Percentage (dark pixel ratio), and Readability Score (weighted combination).' },
            { icon: Target, title: 'Confidence Scoring', desc: 'Metrics are combined using weighted scoring. Deterministic jitter seeded from pixel data adds realistic variation. Final confidence ranges from 0–100%.' },
            { icon: ScanLine, title: 'Defect Detection', desc: 'Bounding boxes are generated for regions with abnormal luminance. An 8×8 heatmap visualizes quality distribution across the image.' },
            { icon: CheckCircle2, title: 'PASS/FAIL Decision', desc: 'If readability score exceeds the threshold (70) and damage is below limit (15%), the inspection PASSES. Otherwise it FAILS with specific problem descriptions.' },
          ].map((step, i) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-50 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400">
                  <step.icon size={20} />
                </div>
                {i < 5 && <div className="my-1 h-8 w-px bg-slate-300 dark:bg-rail-700" />}
              </div>
              <div className="pb-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quality Metrics */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-6 p-6">
        <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Quality Metrics Explained</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { name: 'Blur Score', formula: 'Laplacian Variance', desc: 'Measures image sharpness by computing the variance of the Laplacian operator. Higher values indicate sharper images. Low scores suggest camera shake or focus issues.', good: 'Higher is better' },
            { name: 'Contrast Score', formula: 'Std Deviation of Luminance', desc: 'Standard deviation of pixel luminance values. High contrast ensures QR code patterns are distinguishable from the background.', good: 'Higher is better' },
            { name: 'Alignment Score', formula: 'Center of Mass Offset', desc: 'Measures how well the QR code is centered in the image. Calculated as the distance of the luminance center of mass from the geometric center.', good: 'Higher is better' },
            { name: 'Damage Percentage', formula: 'Dark Pixel Ratio', desc: 'Percentage of abnormally dark pixels that may indicate physical damage, scratches, or corrosion on the QR code surface.', good: 'Lower is better' },
            { name: 'Readability Score', formula: 'Weighted Combination', desc: 'Composite score combining all metrics with weights. This is the primary indicator of whether the QR code can be reliably scanned.', good: 'Higher is better' },
          ].map((m) => (
            <div key={m.name} className="rounded-xl border border-slate-200 p-4 dark:border-rail-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{m.name}</h4>
                <span className="rounded-md bg-rail-50 px-2 py-0.5 text-[11px] font-medium text-rail-600 dark:bg-rail-800 dark:text-rail-400">{m.good}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-accent-600 dark:text-accent-400">{m.formula}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Decision Logic */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card border-l-4 border-l-green-500 p-6">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <h3 className="text-base font-semibold text-green-600 dark:text-green-400">PASS Criteria</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-green-500">✓</span> Readability Score ≥ 70</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Damage Percentage less than 15%</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Blur Score above 100 (sufficient sharpness)</li>
            <li className="flex gap-2"><span className="text-green-500">✓</span> Confidence ≥ 75%</li>
          </ul>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card border-l-4 border-l-red-500 p-6">
          <div className="mb-3 flex items-center gap-2">
            <XCircle size={20} className="text-red-500" />
            <h3 className="text-base font-semibold text-red-600 dark:text-red-400">FAIL Criteria</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2"><span className="text-red-500">✗</span> Readability Score below 70</li>
            <li className="flex gap-2"><span className="text-red-500">✗</span> Damage Percentage 15% or above</li>
            <li className="flex gap-2"><span className="text-red-500">✗</span> Blur Score 100 or below (too blurry)</li>
            <li className="flex gap-2"><span className="text-red-500">✗</span> Confidence below 75%</li>
          </ul>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card mt-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-accent-500" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI Recommendations Engine</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Based on the computed metrics, the system generates targeted maintenance recommendations.
          For example, high blur triggers a "recapture with steadier hand" suggestion, high damage
          triggers "re-laser marking required", and low contrast triggers "clean marking surface".
          These recommendations help field staff take immediate corrective action.
        </p>
      </motion.div>
    </>
  );
}
