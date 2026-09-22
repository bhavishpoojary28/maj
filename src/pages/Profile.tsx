import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, MapPin, Calendar, Train, Activity } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS, ROLE_COLORS, RAILWAY_ZONES } from '../lib/supabase';
import { PageHeader } from '../components/Topbar';

export default function Profile() {
  const { profile, session } = useAuth();
  if (!profile) return null;
  const role = profile.role;
  const zoneName = RAILWAY_ZONES.find((z) => z.code === profile.zone)?.name ?? profile.zone;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your account information and access details" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-rail-700 to-rail-900">
          <div className="absolute -bottom-10 left-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-rail-600 text-2xl font-bold text-white shadow-lg dark:border-rail-950">{profile.full_name.charAt(0).toUpperCase()}</div>
        </div>
        <div className="px-6 pb-6 pt-14">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h2>
          <span className={`badge mt-1 ${ROLE_COLORS[role]}`}><ShieldCheck size={11} />{ROLE_LABELS[role]}</span>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard icon={Mail} label="Email" value={session?.user?.email ?? '-'} />
            <InfoCard icon={MapPin} label="Zone" value={zoneName} />
            <InfoCard icon={Train} label="Zone Code" value={profile.zone} />
            <InfoCard icon={Calendar} label="Joined" value={new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <InfoCard icon={Activity} label="User ID" value={profile.id.slice(0, 8) + '...'} />
            <InfoCard icon={ShieldCheck} label="Access Level" value={ROLE_LABELS[role]} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-rail-800 dark:bg-rail-900/50">
      <div className="flex items-center gap-2 text-slate-400"><Icon size={14} /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
