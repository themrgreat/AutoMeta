import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// Minimal global toast system. Call toast.success / toast.error from anywhere.
const useToastStore = create((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000);
  },
}));

export const toast = {
  success: (msg) => useToastStore.getState().push({ type: 'success', msg }),
  error: (msg) => useToastStore.getState().push({ type: 'error', msg }),
  info: (msg) => useToastStore.getState().push({ type: 'info', msg }),
};

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLORS = {
  success: 'border-emerald-200 text-emerald-700 dark:border-emerald-900',
  error: 'border-rose-200 text-rose-700 dark:border-rose-900',
  info: 'border-slate-200 text-slate-700 dark:border-slate-700',
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`card flex items-center gap-2 border ${COLORS[t.type]} max-w-sm py-3`}
            >
              <Icon size={18} />
              <span className="text-sm text-slate-700 dark:text-slate-200">{t.msg}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
