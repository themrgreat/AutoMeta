const STYLES = {
  generated: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  sending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  sent: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || STYLES.generated}`}>{status}</span>;
}
