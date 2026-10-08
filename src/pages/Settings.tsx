import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, ShieldCheck, Bell, Palette, Globe, Save, Loader2,
  CheckCircle2, UserPlus, Sun, Moon, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useTheme } from '../lib/theme';
import { ROLE_LABELS, RAILWAY_ZONES } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/Topbar';

export default function Settings() {
  const { profile, session } = useAuth();
  const toast = useToast();
  const { mode, palette, setMode, setPalette } = useTheme();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [zone, setZone] = useState(profile?.zone ?? 'NR');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setSaved(false);
    try {
      if (profile) {
        await supabase.from('profiles').update({ full_name: fullName, zone }).eq('id', profile.id);
        await supabase.auth.updateUser({ data: { full_name: fullName, zone } });
      }
      setSaved(true);
      toast('success', 'Settings saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { toast('error', err instanceof Error ? err.message : 'Failed to save settings'); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {saved && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={16} /> Settings saved successfully</motion.div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={handleSave} className="card">
          <div className="mb-4 flex items-center gap-2"><User size={18} className="text-rail-600 dark:text-rail-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h2></div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={session?.user?.email ?? ''} disabled className="input pl-9 opacity-60" /></div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <div className="relative"><ShieldCheck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={profile ? ROLE_LABELS[profile.role] : ''} disabled className="input pl-9 opacity-60" /></div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Railway Zone</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="input">{RAILWAY_ZONES.map((z) => <option key={z.code} value={z.code}>{z.name} ({z.code})</option>)}</select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2"><Bell size={18} className="text-rail-600 dark:text-rail-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2></div>
            <div className="space-y-3">
              <label className="flex items-center justify-between"><span className="text-sm text-slate-700 dark:text-slate-300">Email Notifications</span><input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} className="toggle" /></label>
              <label className="flex items-center justify-between"><span className="text-sm text-slate-700 dark:text-slate-300">Push Notifications</span><input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} className="toggle" /></label>
            </div>
          </div>

          {profile?.role === 'admin' && (
            <div className="card">
              <div className="mb-2 flex items-center gap-2"><UserPlus size={18} className="text-rail-600 dark:text-rail-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Staff Accounts</h2></div>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Create accounts for authorized railway staff.</p>
              <Link to="/register" className="btn-primary w-full"><UserPlus size={16} /> Add Staff Account</Link>
            </div>
          )}

          {/* Appearance & Themes */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-rail-600 dark:text-rail-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance & Theme</h2>
              </div>
              <span className="badge bg-rail-500/15 text-rail-700 dark:text-rail-300">
                {palette === 'sophia' ? 'Sophia Pro' : 'Classic Blue'}
              </span>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Customize the look and feel of RailQR AI. Switch between the classic Indian Railways industrial theme and the refined Sophia Pro editorial theme.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Theme Palette
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Classic Blue Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPalette('classic');
                      toast('success', 'Switched to Classic Rail Blue theme');
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      palette === 'classic'
                        ? 'border-rail-600 bg-rail-50/70 ring-2 ring-rail-500/20 dark:border-rail-500 dark:bg-rail-900/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-rail-800 dark:bg-rail-900/20 dark:hover:border-rail-700'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Classic Blue</span>
                      {palette === 'classic' && <CheckCircle2 size={16} className="text-rail-600 dark:text-rail-400" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Indian Railways navy palette with crisp sans-serif typography.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#1d497b' }} title="Navy 700" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#3573b5' }} title="Blue 500" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#dbe7f4' }} title="Light 100" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#06122a' }} title="Dark 950" />
                    </div>
                  </button>

                  {/* Sophia Pro Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPalette('sophia');
                      toast('success', 'Switched to Sophia Pro theme');
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      palette === 'sophia'
                        ? 'border-[#954e26] bg-[#fdf6f2] ring-2 ring-[#954e26]/20 dark:border-[#d29878] dark:bg-[#34221f]/50'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-rail-800 dark:bg-rail-900/20 dark:hover:border-rail-700'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Sophia Pro</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#f7daca] px-1.5 py-0.5 text-[10px] font-bold text-[#7c3812] dark:bg-[#4d3422] dark:text-[#f8d4c2]">
                          <Sparkles size={10} /> Pro
                        </span>
                      </div>
                      {palette === 'sophia' && <CheckCircle2 size={16} className="text-[#954e26] dark:text-[#d29878]" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Warm terracotta, peach cream, serif headings & pill buttons.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#954e26' }} title="Terracotta 700" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#bd6230' }} title="Sienna 500" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#f7daca' }} title="Peach 200" />
                      <span className="h-3.5 w-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: '#322120' }} title="Espresso 950" />
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-medium transition ${
                      mode === 'light'
                        ? 'border-rail-600 bg-rail-50 text-rail-700 shadow-sm dark:border-rail-500 dark:bg-rail-900 dark:text-rail-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-rail-800 dark:text-slate-400 dark:hover:bg-rail-800/40'
                    }`}
                  >
                    <Sun size={16} /> Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-sm font-medium transition ${
                      mode === 'dark'
                        ? 'border-rail-600 bg-rail-50 text-rail-700 shadow-sm dark:border-rail-500 dark:bg-rail-900 dark:text-rail-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-rail-800 dark:text-slate-400 dark:hover:bg-rail-800/40'
                    }`}
                  >
                    <Moon size={16} /> Dark Mode
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2"><Globe size={18} className="text-rail-600 dark:text-rail-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">System</h2></div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between"><span>Version</span><span className="font-medium text-slate-800 dark:text-slate-200">1.0.0</span></div>
              <div className="flex justify-between"><span>Environment</span><span className="font-medium text-slate-800 dark:text-slate-200">Production</span></div>
              <div className="flex justify-between"><span>Backend</span><span className="font-medium text-slate-800 dark:text-slate-200">Supabase</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
