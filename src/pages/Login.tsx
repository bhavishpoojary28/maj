import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Train, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, ArrowRight,
  ShieldCheck, Cpu, QrCode, CheckCircle2, MessageSquareWarning,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import trainOnTrack from '../assets/train-on-track-login.png';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn(email, password); navigate('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-rail-950">
      {/* Left: Brand Panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-rail-950 lg:flex lg:flex-col">
        <img src={trainOnTrack} alt="Train travelling along railway tracks" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-rail-950/95 via-rail-900/80 to-rail-950/65" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rail-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex h-full flex-col p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur"><Train size={26} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-white">RailQR AI</h1>
              <p className="text-xs text-rail-200">Indian Railways Asset Management</p>
            </div>
          </div>

          <div className="mt-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h2 className="text-3xl font-bold leading-tight text-white">AI-Powered QR Code Marking & Inspection for Track Fittings</h2>
              <p className="mt-4 max-w-md text-rail-200">A comprehensive platform combining AI-assisted quality inspection, defect reporting, and real-time asset tracking across the railway network.</p>
            </motion.div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: QrCode, label: 'QR Code Generation' },
                { icon: Cpu, label: 'AI Quality Inspection' },
                { icon: MessageSquareWarning, label: 'Defect Reporting' },
                { icon: ShieldCheck, label: 'Role-Based Access' },
              ].map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rail-600/30 text-rail-200"><f.icon size={18} /></div>
                  <span className="text-sm font-medium text-rail-100">{f.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-2 text-xs text-rail-300">
              <CheckCircle2 size={14} className="text-green-400" />
              <span>Authorized personnel only · Indian Railways</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rail-700 text-white shadow-lg"><Train size={28} /></div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">RailQR AI</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Indian Railways Asset Management</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to access your dashboard</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-rail-800 dark:bg-rail-900/50">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <AlertCircle size={16} className="flex-shrink-0" />{error}
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="inspector@railqr.in" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9 pr-9" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rail-600 focus:ring-rail-500 dark:border-rail-600 dark:bg-rail-800" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-rail-600 hover:text-rail-700 dark:text-rail-400 dark:hover:text-rail-300">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-sm text-slate-400"><Link to="/" className="hover:text-rail-600 dark:hover:text-rail-400">Back to home</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
