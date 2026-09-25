import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, QrCode, ScanLine, BrainCircuit,
  CalendarClock, FileText, BarChart3, Bell, Train, LogOut, X,
  ShieldCheck, MessageSquareWarning, Settings, Home,
  Info, Network, Boxes, Code2, Cpu, GitBranch, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../lib/supabase';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { label: 'Asset Management', items: [
    { to: '/fittings', label: 'Track Fittings', icon: Wrench },
    { to: '/qr-generator', label: 'QR Generator', icon: QrCode },
    { to: '/scanner', label: 'QR Scanner', icon: ScanLine },
  ]},
  { label: 'Operations', items: [
    { to: '/inspection', label: 'AI Inspection', icon: BrainCircuit },
    { to: '/maintenance', label: 'Maintenance', icon: CalendarClock },
    { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { to: '/railradar', label: 'Live Train Tracker', icon: Train },
  ]},
  { label: 'System', items: [
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]},
  { label: 'Project Info', items: [
    { to: '/about', label: 'About Project', icon: Info },
    { to: '/modules', label: 'Modules', icon: Boxes },
    { to: '/architecture', label: 'Architecture', icon: Network },
    { to: '/tech-stack', label: 'Tech Stack', icon: Code2 },
    { to: '/ai-workflow', label: 'AI Workflow', icon: Cpu },
    { to: '/qr-lifecycle', label: 'QR Lifecycle', icon: GitBranch },
  ]},
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const role = profile?.role ?? 'operator';

  async function handleSignOut() { await signOut(); navigate('/login'); }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-rail-800 dark:bg-rail-950 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4 dark:border-rail-800">
          <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rail-700 text-white shadow-sm"><Train size={22} /></div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight text-rail-800 dark:text-white">RailQR AI</h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Indian Railways</p>
              </div>
            )}
          </NavLink>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-rail-800"><X size={20} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={onClose} title={collapsed ? item.label : undefined}
                    className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
                    <item.icon size={18} className="flex-shrink-0" /> {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <NavLink to="/" onClick={onClose} className={`nav-link nav-link-inactive ${collapsed ? 'lg:justify-center lg:px-2' : ''}`} title={collapsed ? 'Landing Page' : undefined}>
            <Home size={18} className="flex-shrink-0" /> {!collapsed && <span>Landing Page</span>}
          </NavLink>
        </nav>

        {/* User + Sign Out */}
        <div className="border-t border-slate-200 p-3 dark:border-rail-800">
          <div className={`mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-rail-900/60 ${collapsed ? 'lg:justify-center lg:bg-transparent lg:p-0' : ''}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rail-600 text-sm font-bold text-white shadow-sm">{profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}</div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profile?.full_name ?? 'User'}</p>
                <span className={`badge mt-0.5 ${ROLE_COLORS[role]}`}><ShieldCheck size={11} />{ROLE_LABELS[role]}</span>
              </div>
            )}
          </div>
          {!collapsed && <button onClick={handleSignOut} className="btn-secondary w-full"><LogOut size={16} /> Sign Out</button>}
          {collapsed && <button onClick={handleSignOut} className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-rail-800"><LogOut size={18} /></button>}
          <button onClick={() => setCollapsed(!collapsed)} className="mt-2 hidden w-full items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:flex dark:hover:bg-rail-800 dark:hover:text-slate-200" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={16} /> <span className="ml-1 text-xs font-medium">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
