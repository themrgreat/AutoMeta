import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Pencil, Trash2, Wand2 } from 'lucide-react';

import {
  listTemplates,
  createTemplate,
  updateTemplate,
  cloneTemplate,
  deleteTemplate,
  enhancePrompt,
} from '../api/client';
import Modal from '../components/Modal';
import { toast } from '../components/Toaster';

const EMPTY = { name: '', category: 'Custom', tone: 'Professional', instruction: '' };
const TONES = ['Professional', 'Friendly', 'Enthusiastic', 'Warm', 'Direct'];
const VARS = ['{{company_name}}', '{{contact_name}}', '{{website}}', '{{industry}}', '{{location}}'];

export default function Templates() {
  const qc = useQueryClient();
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: listTemplates });

  const [editing, setEditing] = useState(null); // {…template} or null
  const [form, setForm] = useState(EMPTY);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['templates'] });

  const saveMut = useMutation({
    mutationFn: (data) => (data._id ? updateTemplate(data._id, data) : createTemplate(data)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success('Template saved');
    },
    onError: (e) => toast.error(e.message),
  });

  const cloneMut = useMutation({
    mutationFn: cloneTemplate,
    onSuccess: () => {
      invalidate();
      toast.success('Template cloned');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      invalidate();
      toast.info('Template deleted');
    },
  });

  const enhanceMut = useMutation({
    mutationFn: enhancePrompt,
    onSuccess: (data) => {
      setForm((f) => ({ ...f, instruction: data.enhanced }));
      toast.success('Prompt enhanced with AI');
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setForm(EMPTY);
    setEditing({});
  }
  function openEdit(t) {
    setForm({ _id: t._id, name: t.name, category: t.category, tone: t.tone, instruction: t.instruction });
    setEditing(t);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt Templates</h1>
          <p className="text-sm text-slate-500">Reusable AI briefs. Use {'{{variables}}'} to personalize per contact.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={16} /> New template
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => (
          <div key={t._id} className="card flex flex-col">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {t.category} · {t.tone}
                </span>
              </div>
            </div>
            <p className="mb-4 flex-1 text-sm text-slate-500 line-clamp-4">{t.instruction}</p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => openEdit(t)}>
                <Pencil size={14} /> Edit
              </button>
              <button className="btn-ghost" onClick={() => cloneMut.mutate(t._id)} title="Clone">
                <Copy size={14} />
              </button>
              {!t.isSeed && (
                <button className="btn-ghost text-rose-500" onClick={() => deleteMut.mutate(t._id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={form._id ? 'Edit template' : 'New template'} width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Tone</label>
            <select className="input" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
              {TONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0">AI instruction</label>
              <button
                className="btn-ghost py-1 text-xs"
                disabled={!form.instruction || enhanceMut.isPending}
                onClick={() => enhanceMut.mutate(form.instruction)}
              >
                <Wand2 size={13} /> {enhanceMut.isPending ? 'Enhancing…' : 'Enhance with AI'}
              </button>
            </div>
            <textarea
              className="input min-h-[140px]"
              value={form.instruction}
              onChange={(e) => setForm({ ...form, instruction: e.target.value })}
              placeholder="Write a personalized outreach email for {{company_name}}…"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {VARS.map((v) => (
                <button
                  key={v}
                  className="badge bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
                  onClick={() => setForm((f) => ({ ...f, instruction: `${f.instruction}${v}` }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(form)}>
              {saveMut.isPending ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
