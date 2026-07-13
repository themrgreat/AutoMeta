import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Mail, Send, CheckCircle2, Upload, FileText } from 'lucide-react';

import { listImports, listSenders, emailStats } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const activeImportId = useAppStore((s) => s.activeImportId);
  const imports = useQuery({ queryKey: ['imports'], queryFn: listImports });
  const senders = useQuery({ queryKey: ['senders'], queryFn: listSenders });
  const stats = useQuery({
    queryKey: ['emails', 'stats', activeImportId],
    queryFn: () => emailStats(activeImportId),
  });

  const totalLeads = (imports.data || []).reduce((sum, i) => sum + i.rowCount, 0);
  const s = stats.data || {};
  const generated = (s.generated || 0) + (s.approved || 0) + (s.sent || 0) + (s.rejected || 0) + (s.failed || 0);
  const sent = s.sent || 0;
  const activeSenders = (senders.data || []).filter((x) => x.status === 'active').length;
  const deliveryRate = generated ? Math.round((sent / (sent + (s.failed || 0) || 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your AI outreach activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total leads imported" value={totalLeads} accent="bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300" />
        <Stat icon={Mail} label="AI emails generated" value={generated} accent="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300" />
        <Stat icon={Send} label="Emails sent" value={sent} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" />
        <Stat icon={CheckCircle2} label="Delivery success rate" value={`${deliveryRate}%`} accent="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Email pipeline (active import)</h2>
          {generated === 0 ? (
            <p className="text-sm text-slate-500">No emails generated for the active import yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {['generated', 'approved', 'sent', 'rejected', 'failed'].map((k) => (
                <div key={k} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <StatusBadge status={k} />
                  <span className="text-lg font-semibold">{s[k] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Sender accounts</h2>
          <div className="mb-3 text-3xl font-bold">{activeSenders}</div>
          <p className="text-sm text-slate-500">active of {senders.data?.length || 0} configured</p>
          <Link to="/senders" className="btn-ghost mt-4 w-full">Manage senders</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/import" className="card flex items-center gap-3 hover:border-brand-300">
          <Upload size={20} className="text-brand-600" /> <span className="font-medium">Import a file</span>
        </Link>
        <Link to="/templates" className="card flex items-center gap-3 hover:border-brand-300">
          <FileText size={20} className="text-brand-600" /> <span className="font-medium">Manage templates</span>
        </Link>
        <Link to="/review" className="card flex items-center gap-3 hover:border-brand-300">
          <Mail size={20} className="text-brand-600" /> <span className="font-medium">Review &amp; send</span>
        </Link>
      </div>
    </div>
  );
}
