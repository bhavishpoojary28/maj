import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Train, Mail, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send reset email'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rail-950 via-rail-900 to-rail-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur"><Train size={28} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-1 text-sm text-rail-200">We'll send you a recovery link</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur dark:bg-rail-900/95">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Mail size={24} /></div>
              <p className="text-sm text-slate-700 dark:text-slate-300">A password reset link has been sent to <strong>{email}</strong>. Check your inbox.</p>
              <Link to="/login" className="btn-primary mt-5 w-full">Back to Sign In</Link>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"><AlertCircle size={16} />{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" placeholder="inspector@railqr.in" /></div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : null}{loading ? 'Sending...' : 'Send Reset Link'} {!loading && <ArrowRight size={16} />}</button>
              </form>
              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400"><Link to="/login" className="flex items-center justify-center gap-1 font-semibold text-rail-600 hover:text-rail-700 dark:text-rail-400"><ArrowLeft size={14} /> Back to sign in</Link></p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
