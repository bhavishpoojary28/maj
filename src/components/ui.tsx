import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    'Under Maintenance': 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
    Decommissioned: 'bg-slate-200 text-slate-600 dark:bg-rail-800 dark:text-slate-300',
    Flagged: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Scheduled: 'bg-rail-100 text-rail-700 dark:bg-rail-500/15 dark:text-rail-300',
    'In Progress': 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
    Completed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    Overdue: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    PASS: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    FAIL: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Open: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
    Resolved: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    Low: 'bg-slate-100 text-slate-600 dark:bg-rail-800 dark:text-slate-300',
    Medium: 'bg-rail-100 text-rail-700 dark:bg-rail-500/15 dark:text-rail-300',
    High: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  };
  return <span className={`badge ${map[status] ?? 'bg-slate-100 text-slate-600 dark:bg-rail-800 dark:text-slate-300'}`}>{status}</span>;
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
      {start > 1 && <span className="px-1 text-sm text-slate-400">…</span>}
      {pages.map((p) => (
        <button key={p} onClick={() => onPage(p)} className={`h-8 w-8 rounded-lg text-sm font-medium transition ${p === page ? 'bg-rail-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-rail-800'}`}>{p}</button>
      ))}
      {end < totalPages && <span className="px-1 text-sm text-slate-400">…</span>}
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, actionTo, actionLabel }: {
  icon: LucideIcon; title: string; message: string; actionTo?: string; actionLabel?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-rail-800/60 dark:text-slate-600">
        <Icon size={36} />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {actionTo && actionLabel && (
        <Link to={actionTo} className="btn-primary mt-5">{actionLabel}</Link>
      )}
    </motion.div>
  );
}

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-rail-600 dark:border-rail-800 dark:border-t-rail-400" />
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-8 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function Card({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card ${hover ? 'hover:shadow-elevated' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-rail-600 dark:text-rail-400" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {action}
    </div>
  );
}
