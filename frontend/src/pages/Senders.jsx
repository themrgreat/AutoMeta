import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShieldCheck, Star } from 'lucide-react';

import { listSenders, createSender, updateSender, verifySender, deleteSender } from '../api/client';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { toast } from '../components/Toaster';

const EMPTY = {
  senderName: '',
  email: '',
  smtpHost: 'smtp.zoho.com',
  smtpPort: 465,
  username: '',
  password: '',
  dailyLimit: 100,
  isDefault: false,
};

export default function Senders() {
  const qc = useQueryClient();
  const { data: senders } = useQuery({ queryKey: ['senders'], queryFn: listSenders });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['senders'] });

  const createMut = useMutation({
    mutationFn: createSender,
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setForm(EMPTY);
      toast.success('Sender account added');
    },
    onError: (e) => toast.error(e.message),
  });

  const verifyMut = useMutation({
    mutationFn: verifySender,
    onSuccess: (d) => {
      invalidate();
      d.ok ? toast.success('SMTP credentials verified') : toast.error(d.error);
    },
    onError: (e) => toast.error(e.message),
  });

  const defaultMut = useMutation({
    mutationFn: (id) => updateSender(id, { isDefault: true }),
    onSuccess: () => {
      invalidate();
      toast.success('Default sender updated');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteSender,
    onSuccess: () => {
      invalidate();
      toast.info('Sender removed');
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sender Accounts</h1>
          <p className="text-sm text-slate-500">Zoho Mail accounts used to send. Emails rotate across active accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Add account
        </button>
      </header>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-3 py-2 font-medium">Sender</th>
              <th className="px-3 py-2 font-medium">SMTP</th>
              <th className="px-3 py-2 font-medium">Today / Limit</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {senders?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No sender accounts yet. Add a Zoho Mail account to start sending.
                </td>
              </tr>
            )}
            {senders?.map((s) => (
              <tr key={s._id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {s.isDefault && <Star size={14} className="fill-amber-400 text-amber-400" />}
                    {s.senderName}
                  </div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </td>
                <td className="px-3 py-3 text-slate-500">
                  {s.smtpHost}:{s.smtpPort}
                </td>
                <td className="px-3 py-3 text-slate-500">
                  {s.sentToday} / {s.dailyLimit}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost py-1" onClick={() => verifyMut.mutate(s._id)} title="Verify SMTP">
                      <ShieldCheck size={14} /> Verify
                    </button>
                    {!s.isDefault && (
                      <button className="btn-ghost py-1" onClick={() => defaultMut.mutate(s._id)} title="Set default">
                        <Star size={14} />
                      </button>
                    )}
                    <button className="btn-ghost py-1 text-rose-500" onClick={() => deleteMut.mutate(s._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Zoho sender account">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sender name</label>
              <input className="input" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">SMTP host</label>
              <input className="input" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} />
            </div>
            <div>
              <label className="label">SMTP port</label>
              <input
                type="number"
                className="input"
                value={form.smtpPort}
                onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="label">App password</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Daily limit</label>
              <input
                type="number"
                className="input"
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Set as default
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Use a Zoho <strong>app-specific password</strong>, not your login password. The password is encrypted at rest.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={createMut.isPending} onClick={() => createMut.mutate(form)}>
              {createMut.isPending ? 'Saving…' : 'Add account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
