import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Train, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Otp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      // OTP verification would go through Supabase auth verify
      // For demo, accept any 6-digit code
      if (otp.join('').length === 6) navigate('/dashboard');
      else throw new Error('Enter the 6-digit code');
    } catch (err) { setError(err instanceof Error ? err.message : 'Verification failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rail-950 via-rail-900 to-rail-800 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur"><Train size={28} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-white">Verify OTP</h1>
          <p className="mt-1 text-sm text-rail-200">Enter the 6-digit code sent to your email</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl backdrop-blur dark:bg-rail-900/95">
          {error && <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"><AlertCircle size={16} />{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl border-2 border-slate-200 text-center text-xl font-bold text-slate-900 focus:border-rail-500 focus:outline-none dark:border-rail-700 dark:bg-rail-800 dark:text-white" />
              ))}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}{loading ? 'Verifying...' : 'Verify Code'}</button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400"><Link to="/login" className="flex items-center justify-center gap-1 font-semibold text-rail-600 hover:text-rail-700 dark:text-rail-400"><ArrowLeft size={14} /> Back to sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
