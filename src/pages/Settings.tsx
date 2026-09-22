import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, Bell, Palette, Globe, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { ROLE_LABELS, RAILWAY_ZONES } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/Topbar';

export default function Settings() {
  const { profile, session } = useAuth();
  const toast = useToast();
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

          {/* Appearance */}
          <div className="card">
            <div className="mb-4 flex items-center gap-2"><Palette size={18} className="text-rail-600 dark:text-rail-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Theme toggle is available in the top bar. Switch between light and dark mode manually.</p>
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
