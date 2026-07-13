import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Send,
  Mail,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/import', label: 'File Import', icon: Upload },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/review', label: 'Review & Send', icon: Mail },
  { to: '/senders', label: 'Sender Accounts', icon: Send },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles size={18} />
        </div>
        <span className="text-lg font-bold">Outreach AI</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button onClick={toggleTheme} className="btn-ghost mt-2 justify-start">
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </button>
    </aside>
  );
}
