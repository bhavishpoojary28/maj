import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: string; type: ToastType; message: string };

type ToastContextValue = { toast: (type: ToastType, message: string) => void };
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertCircle };
const COLORS = {
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  error: 'bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-rail-500/15 text-rail-600 dark:text-rail-400',
  warning: 'bg-accent-500/15 text-accent-600 dark:text-accent-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-rail-800 dark:bg-rail-900">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${COLORS[t.type]}`}><Icon size={18} /></span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.message}</p>
                <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
