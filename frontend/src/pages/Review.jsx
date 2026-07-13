import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Send, Check, X, RefreshCw, Pencil } from 'lucide-react';

import {
  listEmails,
  updateEmail,
  bulkStatus,
  regenerateEmail,
  sendEmails,
  getImport,
} from '../api/client';
import { useAppStore } from '../store/useAppStore';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { toast } from '../components/Toaster';

const FILTERS = ['all', 'generated', 'approved', 'rejected', 'sent', 'failed'];

export default function Review() {
  const qc = useQueryClient();
  const activeImportId = useAppStore((s) => s.activeImportId);

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);

  const impQuery = useQuery({
    queryKey: ['import', activeImportId],
    queryFn: () => getImport(activeImportId),
    enabled: !!activeImportId,
  });

  const emailsQuery = useQuery({
    queryKey: ['emails', activeImportId, status, search],
    queryFn: () => listEmails({ importId: activeImportId, status, search }),
    enabled: !!activeImportId,
  });

  const emails = emailsQuery.data || [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['emails'] });

  const statusMut = useMutation({
    mutationFn: ({ ids, status }) => bulkStatus(ids, status),
    onSuccess: (d, vars) => {
      invalidate();
      setSelected(new Set());
      toast.success(`${vars.ids.length} email(s) marked ${vars.status}`);
    },
  });

  const sendMut = useMutation({
    mutationFn: sendEmails,
    onSuccess: (d) => {
      invalidate();
      setSelected(new Set());
      if (d.failed) toast.error(`${d.sent} sent, ${d.failed} failed`);
      else toast.success(`${d.sent} email(s) sent`);
    },
    onError: (e) => toast.error(e.message),
  });

  const regenMut = useMutation({
    mutationFn: regenerateEmail,
    onSuccess: () => {
      invalidate();
      toast.success('Email regenerated');
    },
    onError: (e) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: ({ id, data }) => updateEmail(id, data),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success('Email updated');
    },
  });

  const allSelected = emails.length > 0 && selected.size === emails.length;
  const ids = useMemo(() => [...selected], [selected]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(emails.map((e) => e._id)));
  }

  if (!activeImportId) {
    return (
      <div className="card text-center text-slate-500">
        No active import selected. Go to <strong>File Import</strong>, choose an import, and generate emails first.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Review &amp; Send</h1>
          <p className="text-sm text-slate-500">{impQuery.data?.filename} · {emails.length} emails</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              className="input pl-8"
              placeholder="Search recipient, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className="card flex items-center justify-between bg-brand-50 py-3 dark:bg-brand-900/20">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <button className="btn-ghost py-1" onClick={() => statusMut.mutate({ ids, status: 'approved' })}>
              <Check size={14} /> Approve
            </button>
            <button className="btn-ghost py-1" onClick={() => statusMut.mutate({ ids, status: 'rejected' })}>
              <X size={14} /> Reject
            </button>
            <button className="btn-primary py-1" disabled={sendMut.isPending} onClick={() => sendMut.mutate(ids)}>
              <Send size={14} /> {sendMut.isPending ? 'Sending…' : 'Send selected'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2 font-medium">Recipient</th>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Subject</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {emailsQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">Loading…</td>
              </tr>
            )}
            {!emailsQuery.isLoading && emails.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No emails yet. Generate some from the File Import page.
                </td>
              </tr>
            )}
            {emails.map((e) => (
              <tr key={e._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggle(e._id)} />
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{e.contactName || '—'}</div>
                  <div className="text-xs text-slate-500">{e.recipientEmail}</div>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{e.company || '—'}</td>
                <td className="max-w-[260px] truncate px-3 py-2">{e.subject}</td>
                <td className="px-3 py-2"><StatusBadge status={e.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost px-2 py-1" onClick={() => setEditing(e)} title="Edit / preview">
                      <Pencil size={14} />
                    </button>
                    <button className="btn-ghost px-2 py-1" onClick={() => regenMut.mutate(e._id)} title="Regenerate">
                      <RefreshCw size={14} />
                    </button>
                    <button
                      className="btn-primary px-2 py-1"
                      disabled={sendMut.isPending}
                      onClick={() => sendMut.mutate([e._id])}
                      title="Send"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal email={editing} onClose={() => setEditing(null)} onSave={(data) => saveMut.mutate({ id: editing._id, data })} saving={saveMut.isPending} />
    </div>
  );
}

function EditModal({ email, onClose, onSave, saving }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');

  // Re-seed local state whenever a new email is opened.
  useEffect(() => {
    if (email) {
      setSubject(email.subject || '');
      setBody(email.body || '');
      setCc((email.cc || []).join(', '));
      setBcc((email.bcc || []).join(', '));
    }
  }, [email]);

  const split = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <Modal open={!!email} onClose={onClose} title="Edit email" width="max-w-2xl">
      {email && (
        <div className="space-y-3">
          <div className="text-sm text-slate-500">
            To: <strong>{email.recipientEmail}</strong> · {email.company}
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea className="input min-h-[200px]" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">CC (comma-separated)</label>
              <input className="input" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
            <div>
              <label className="label">BCC (comma-separated)</label>
              <input className="input" value={bcc} onChange={(e) => setBcc(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              disabled={saving}
              onClick={() => onSave({ subject, body, cc: split(cc), bcc: split(bcc) })}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
