import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Train, Mail, Lock, User, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { RAILWAY_ZONES, type Role } from '../lib/supabase';
import { PageHeader } from '../components/Topbar';

const ROLES: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'operator', label: 'Operator' },
];

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-red-400', 'bg-accent-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];
  return { score, label: labels[score], color: colors[score] };
}

export default function Register() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<Role>('operator');
  const [zone, setZone] = useState('NR');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signUp(email, password, fullName, role, zone); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Registration failed'); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add Staff Account" subtitle="Create an account for authorized railway personnel" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-rail-800 dark:bg-rail-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15"><ShieldCheck size={28} /></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account created</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your staff account is ready. You can now sign in.</p>
          <Link to="/settings" className="btn-primary mt-5 w-full">Back to Settings</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Staff Account" subtitle="Create an account for authorized railway personnel" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rail-700 text-white shadow-lg"><Train size={28} /></div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your staff account</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-rail-800 dark:bg-rail-900">
          {error && <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"><AlertCircle size={16} />{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative"><User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-9" placeholder="Rajesh Kumar" /></div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="inspector@railqr.in" /></div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative"><Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPw ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9 pr-9" placeholder="Min 6 characters" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              {password && <div className="mt-2"><div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-slate-200 dark:bg-rail-800'}`} />)}<div className="flex-1 rounded-full bg-slate-200 dark:bg-rail-800" /></div><p className="mt-1 text-xs text-slate-500">{strength.label}</p></div>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Railway Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="input">{RAILWAY_ZONES.map((z) => <option key={z.code} value={z.code}>{z.name} ({z.code})</option>)}</select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : null}{loading ? 'Creating account...' : 'Create Account'}</button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
