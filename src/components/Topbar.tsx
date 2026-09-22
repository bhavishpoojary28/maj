import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, Search, X } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';
import { supabase, type TrackFitting } from '../lib/supabase';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<TrackFitting[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('track_fittings').select('*')
        .or(`qr_id.ilike.%${q}%,component_id.ilike.%${q}%,station_name.ilike.%${q}%`).limit(5);
      if (data) setResults(data as TrackFitting[]);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false)
      .then(({ count }) => setNotifCount(count ?? 0));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-rail-800 dark:bg-rail-950/80">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-rail-900"><Menu size={20} /></button>
      <div ref={searchRef} className="relative hidden flex-1 max-w-md sm:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} placeholder="Search QR ID, Component ID, Station..." className="input pl-9" />
        {q && showResults && (
          <div className="absolute mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-rail-800 dark:bg-rail-900">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">No results found</p>
            ) : (
              results.map((r) => (
                <button key={r.id} onClick={() => { navigate('/fittings'); setShowResults(false); setQ(''); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-rail-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rail-50 text-rail-600 dark:bg-rail-800 dark:text-rail-400"><Search size={14} /></div>
                  <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.component_id}</p><p className="text-xs text-slate-500">{r.component_type} · {r.station_name}</p></div>
                </button>
              ))
            )}
          </div>
        )}
        {q && <button onClick={() => { setQ(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear search"><X size={14} /></button>}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-rail-900" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link to="/notifications" className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-rail-900">
          <Bell size={20} />
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-rail-950">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </Link>
        <Link to="/profile" className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-3 transition hover:bg-slate-100 dark:hover:bg-rail-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rail-600 text-sm font-bold text-white shadow-sm">{profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}</div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">{profile?.full_name ?? 'User'}</p>
            <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">{profile?.zone ?? 'NR'} Zone</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
