import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'rail' | 'green' | 'amber' | 'red' | 'slate';

const toneStyles: Record<Tone, { bg: string; text: string; ring: string; iconBg: string }> = {
  rail: { bg: 'from-rail-500/5 to-rail-500/0', text: 'text-rail-600 dark:text-rail-400', ring: 'ring-rail-200/60 dark:ring-rail-700/40', iconBg: 'bg-rail-100 text-rail-600 dark:bg-rail-800/60 dark:text-rail-400' },
  green: { bg: 'from-green-500/5 to-green-500/0', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-200/60 dark:ring-green-500/30', iconBg: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' },
  amber: { bg: 'from-accent-500/5 to-accent-500/0', text: 'text-accent-600 dark:text-accent-400', ring: 'ring-accent-200/60 dark:ring-accent-500/30', iconBg: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400' },
  red: { bg: 'from-red-500/5 to-red-500/0', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-200/60 dark:ring-red-500/30', iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  slate: { bg: 'from-slate-500/5 to-slate-500/0', text: 'text-slate-600 dark:text-slate-400', ring: 'ring-slate-200/60 dark:ring-rail-700', iconBg: 'bg-slate-100 text-slate-600 dark:bg-rail-800 dark:text-slate-400' },
};

export default function StatCard({
  label, value, icon: Icon, tone = 'rail', delay = 0, trend, trendLabel,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  delay?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  const t = toneStyles[tone];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={`card group relative overflow-hidden bg-gradient-to-br ${t.bg} p-5`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {trend && trendLabel && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
              <TrendIcon size={13} />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${t.iconBg} ring-1 ${t.ring} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}
