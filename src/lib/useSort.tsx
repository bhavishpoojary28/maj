import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export function useSort<T extends Record<string, any>>(items: T[], defaultKey: string, defaultDir: SortDir = 'desc') {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [items, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  return { sorted, sortKey, sortDir, toggleSort };
}

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-slate-300 dark:text-slate-600" />;
  return dir === 'asc' ? <ChevronUp size={13} className="text-rail-600 dark:text-rail-400" /> : <ChevronDown size={13} className="text-rail-600 dark:text-rail-400" />;
}

export function SortableTh({ label, sortKey, currentKey, dir, onSort, className = '' }: {
  label: string; sortKey: string; currentKey: string; dir: SortDir; onSort: (k: string) => void; className?: string;
}) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`}>
      <button onClick={() => onSort(sortKey)} className="flex items-center gap-1 transition hover:text-slate-700 dark:hover:text-slate-200">
        {label}
        <SortIcon active={currentKey === sortKey} dir={dir} />
      </button>
    </th>
  );
}
