import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ScanLine, Clock, Search, Camera, RotateCcw, Lightbulb, Grid3x3,
  Gauge, Wrench, ShieldCheck, Activity,
} from 'lucide-react';
import { PageHeader } from '../components/Topbar';
import { LoadingSpinner, EmptyState, StatusBadge } from '../components/ui';
import { supabase, type TrackFitting, type Inspection } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { runAiInspection, type AiCheckResult } from '../lib/aiInspection';
import { logAudit } from '../lib/audit';

export default function AiInspectionPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [fittings, setFittings] = useState<TrackFitting[]>([]);
  const [history, setHistory] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFit, setSelectedFit] = useState<TrackFitting | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AiCheckResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [cameraMode, setCameraMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: fits }, { data: insp }] = await Promise.all([
        supabase.from('track_fittings').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setFittings((fits ?? []) as TrackFitting[]);
      setHistory((insp ?? []) as Inspection[]);
      setLoading(false);
    })();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    if (!window.isSecureContext) {
      toast('error', 'Camera capture requires HTTPS on a mobile device. Open the app through an HTTPS URL.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('error', 'Camera access is not supported by this browser. Use a current browser over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraMode(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 100);
    } catch (err) {
      toast('error', err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow it in browser settings and try again.'
        : 'Could not start the camera. Check that no other app is using it and try again.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraMode(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setImagePreview(dataUrl);
    setResult(null);
    setSaved(false);
    stopCamera();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setResult(null); setSaved(false); };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setResult(null); setSaved(false); };
    reader.readAsDataURL(file);
  }

  async function runInspection() {
    if (!imagePreview) return; setAnalyzing(true); setResult(null); setSaved(false);
    try { const r = await runAiInspection(imagePreview); setResult(r); }
    catch (e) { toast('error', e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setAnalyzing(false); }
  }

  async function saveResult() {
    if (!result) return;
    const { error } = await supabase.from('inspections').insert({ fit_id: selectedFit?.id ?? null, qr_id: selectedFit?.qr_id ?? null, result: result.result, confidence: result.confidence, problems: result.problems, image_url: imagePreview || null, inspector_id: session?.user.id ?? null });
    if (error) { toast('error', error.message); return; }
    if (selectedFit) await supabase.from('track_fittings').update({ last_inspection_date: new Date().toISOString().slice(0, 10) }).eq('id', selectedFit.id);
    if (result.result === 'FAIL') await supabase.from('notifications').insert({ type: 'failed_inspection', title: 'Failed AI Inspection', message: `${selectedFit?.qr_id ?? 'Unknown QR'} failed with ${result.confidence}% confidence. Issues: ${result.problems.join(', ') || 'none'}`, fit_id: selectedFit?.id ?? null });
    await logAudit(session?.user.id ?? null, 'ai_inspection', 'inspection', null, `${result.result} (${result.confidence}%) for ${selectedFit?.qr_id ?? 'unlinked'}`);
    setSaved(true);
    toast('success', 'Inspection saved to database');
    const { data } = await supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(20);
    setHistory((data ?? []) as Inspection[]);
  }

  const filteredFits = fittings.filter((f) => f.component_id.toLowerCase().includes(search.toLowerCase()) || f.qr_id.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <LoadingSpinner label="Loading..." />;

  const confidenceColor = result ? (result.confidence >= 90 ? 'text-green-500' : result.confidence >= 70 ? 'text-accent-500' : 'text-red-500') : '';
  const confidenceBg = result ? (result.confidence >= 90 ? 'from-green-400 to-green-600' : result.confidence >= 70 ? 'from-accent-400 to-accent-600' : 'from-red-400 to-red-600') : '';

  return (
    <>
      <PageHeader title="AI Inspection" subtitle="Upload or capture a laser-marked QR image for automated quality inspection" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Component Selector */}
          <div className="card p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Select Component (optional)</label>
            <div className="relative mb-2">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fittings..." className="input pl-9" />
            </div>
            <select value={selectedFit?.id ?? ''} onChange={(e) => setSelectedFit(fittings.find((f) => f.id === e.target.value) ?? null)} className="input">
              <option value="">— Not linked —</option>
              {filteredFits.map((f) => <option key={f.id} value={f.id}>{f.component_id} ({f.qr_id})</option>)}
            </select>
          </div>

          {/* Upload / Camera */}
          <div className="card p-5">
            {cameraMode ? (
              <div className="overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline className="h-64 w-full object-contain" />
                <div className="flex justify-center gap-3 p-4">
                  <button onClick={capturePhoto} className="btn-primary"><Camera size={18} /> Capture</button>
                  <button onClick={stopCamera} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragOver ? 'border-rail-500 bg-rail-50 dark:bg-rail-800/40' : 'border-slate-300 bg-slate-50 hover:border-rail-400 hover:bg-rail-50 dark:border-rail-700 dark:bg-rail-900 dark:hover:border-rail-500'}`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg" />
                    {result && showBoxes && result.boundingBoxes.length > 0 && (
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
                        {result.boundingBoxes.map((bb, i) => (
                          <g key={i}>
                            <rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="none"
                              stroke={bb.severity === 'high' ? '#ef4444' : bb.severity === 'medium' ? '#f59e0b' : '#3b82f6'}
                              strokeWidth="0.004" strokeDasharray="0.01" />
                            <text x={bb.x} y={bb.y - 0.01} fill={bb.severity === 'high' ? '#ef4444' : bb.severity === 'medium' ? '#f59e0b' : '#3b82f6'} fontSize="0.025" fontWeight="bold">{bb.label}</text>
                          </g>
                        ))}
                      </svg>
                    )}
                    {result && showHeatmap && (
                      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 8 8" preserveAspectRatio="none">
                        {result.heatmap.map((cell, i) => (
                          <rect key={i} x={cell.x * 8} y={cell.y * 8} width={1} height={1}
                            fill={cell.intensity > 60 ? '#ef4444' : cell.intensity > 30 ? '#f59e0b' : '#10b981'}
                            opacity={cell.intensity / 100} />
                        ))}
                      </svg>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload size={36} className="text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Drag & drop or click to upload</p>
                    <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            )}

            <div className="mt-4 flex gap-2">
              {!cameraMode && !imagePreview && <button onClick={startCamera} className="btn-secondary flex-1"><Camera size={16} /> Use Camera</button>}
              {imagePreview && <button onClick={() => { setImagePreview(''); setResult(null); setSaved(false); }} className="btn-secondary"><RotateCcw size={16} /> Reset</button>}
              <button onClick={runInspection} disabled={!imagePreview || analyzing} className="btn-primary flex-1">
                {analyzing ? <><Loader2 size={18} className="animate-spin" /> Running AI Analysis...</> : <><BrainCircuit size={18} /> Run AI Inspection</>}
              </button>
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Inspection Result</h3>
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${result.result === 'PASS' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
                    {result.result === 'PASS' ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                    <span className="text-lg font-bold">{result.result}</span>
                  </div>
                </div>

                {/* Confidence Meter + Visual Quality Indicator */}
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400"><Gauge size={16} /> AI Confidence</span>
                      <span className={`text-2xl font-bold ${confidenceColor}`}>{result.confidence}%</span>
                    </div>
                    <div className="relative h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-rail-800">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full bg-gradient-to-r ${confidenceBg}`} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>0%</span><span>50%</span><span>100%</span></div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400"><Activity size={16} /> Damage Level</span>
                      <span className={`text-2xl font-bold ${result.checks.damage.pass ? 'text-green-500' : 'text-red-500'}`}>{100 - result.checks.damage.score}%</span>
                    </div>
                    <div className="relative h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-rail-800">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${100 - result.checks.damage.score}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${100 - result.checks.damage.score > 40 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-green-400 to-green-600'}`} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>0%</span><span>50%</span><span>100%</span></div>
                  </div>
                </div>

                {/* Visual Quality Gauge */}
                <div className="mb-5 flex items-center justify-center rounded-xl bg-slate-50 p-4 dark:bg-rail-900/40">
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-rail-800" />
                      <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.confidence / 100) }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={result.result === 'PASS' ? 'stroke-green-500' : 'stroke-red-500'} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-bold ${confidenceColor}`}>{result.confidence}%</span>
                      <span className="text-xs text-slate-400">Quality Score</span>
                    </div>
                  </div>
                  <div className="ml-6 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Inspection Status</span><StatusBadge status={result.result} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Defects Found</span><span className="font-semibold text-slate-700 dark:text-slate-200">{result.problems.length}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Readability</span><span className={`font-semibold ${result.checks.readability.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{result.checks.readability.score}%</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Alignment</span><span className={`font-semibold ${result.checks.alignment.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{result.checks.alignment.score}%</span></div>
                  </div>
                </div>

                {/* Defect Classification Cards */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.values(result.checks).map((c) => (
                    <div key={c.label} className={`rounded-xl border p-3 ${c.pass ? 'border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/5' : 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5'}`}>
                      <div className="mb-1 flex items-center justify-between">
                        {c.pass ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                        <span className={`font-mono text-xs font-bold ${c.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{c.score}%</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Toggle Overlays */}
                {imagePreview && (
                  <div className="mb-4 flex gap-2">
                    <button onClick={() => setShowBoxes(!showBoxes)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${showBoxes ? 'bg-rail-100 text-rail-700 dark:bg-rail-800 dark:text-rail-300' : 'bg-slate-100 text-slate-500 dark:bg-rail-900 dark:text-slate-400'}`}>Bounding Boxes</button>
                    <button onClick={() => setShowHeatmap(!showHeatmap)} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${showHeatmap ? 'bg-rail-100 text-rail-700 dark:bg-rail-800 dark:text-rail-300' : 'bg-slate-100 text-slate-500 dark:bg-rail-900 dark:text-slate-400'}`}><Grid3x3 size={12} /> Heatmap</button>
                  </div>
                )}

                {/* Detected Problems */}
                {result.problems.length > 0 && (
                  <div className="mb-4 rounded-xl bg-red-50 p-4 dark:bg-red-500/10">
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-400"><AlertTriangle size={16} /> Detected Defects</p>
                    <div className="space-y-1.5">
                      {result.problems.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 dark:bg-rail-900/40">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Maintenance Actions */}
                <div className="mb-4 rounded-xl bg-rail-50 p-4 dark:bg-rail-800/40">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rail-800 dark:text-rail-200"><Wrench size={16} /> Suggested Maintenance Actions</p>
                  <div className="flex items-start gap-2">
                    <Lightbulb size={16} className="mt-0.5 flex-shrink-0 text-accent-500" />
                    <span className="text-sm text-rail-800 dark:text-rail-200">{result.recommendation}</span>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-rail-800">
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={12} /> {new Date().toLocaleString()}</span>
                  {saved ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400"><CheckCircle2 size={16} /> Saved to database</span>
                  ) : (
                    <button onClick={saveResult} className="btn-primary"><ShieldCheck size={16} /> Save Result</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={18} className="text-rail-600 dark:text-rail-400" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Inspection History</h3>
          </div>
          {history.length > 0 ? (
            <div className="max-h-[560px] space-y-2.5 overflow-y-auto">
              {history.map((i) => (
                <div key={i.id} className="rounded-xl border border-slate-200 p-3 transition hover:shadow-sm dark:border-rail-800">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{i.qr_id ?? 'Unlinked'}</span>
                    <StatusBadge status={i.result} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Gauge size={11} /> {i.confidence}% confidence</span>
                    <span>{new Date(i.created_at).toLocaleDateString()}</span>
                  </div>
                  {i.problems.length > 0 && <p className="mt-1.5 text-xs text-red-500">{i.problems.join(', ')}</p>}
                </div>
              ))}
            </div>
          ) : <EmptyState icon={ScanLine} title="No inspections yet" message="Run your first AI inspection to see results here." />}
        </div>
      </div>
    </>
  );
}
