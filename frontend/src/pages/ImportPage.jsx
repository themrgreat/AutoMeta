import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileSpreadsheet, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';

import {
  uploadFile,
  listImports,
  getImport,
  deleteImport,
  listTemplates,
  generateEmails,
} from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../components/Toaster';

export default function ImportPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeImportId, setActiveImport } = useAppStore();
  const [templateId, setTemplateId] = useState('');

  const importsQuery = useQuery({ queryKey: ['imports'], queryFn: listImports });
  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: listTemplates });
  const activeImport = useQuery({
    queryKey: ['import', activeImportId],
    queryFn: () => getImport(activeImportId),
    enabled: !!activeImportId,
  });

  const uploadMut = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setActiveImport(data.id);
      qc.invalidateQueries({ queryKey: ['imports'] });
      toast.success(`Imported ${data.rowCount} rows · ${data.validEmailCount} valid emails`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteImport,
    onSuccess: (_d, id) => {
      if (id === activeImportId) setActiveImport(null);
      qc.invalidateQueries({ queryKey: ['imports'] });
      toast.info('Import deleted');
    },
  });

  const generateMut = useMutation({
    mutationFn: generateEmails,
    onSuccess: (data) => {
      toast.success(`Generated ${data.generated} emails${data.failed ? `, ${data.failed} failed` : ''}`);
      qc.invalidateQueries({ queryKey: ['emails'] });
      navigate('/review');
    },
    onError: (e) => toast.error(e.message),
  });

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    uploadMut.mutate(fd);
    e.target.value = '';
  }

  const imp = activeImport.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">File Import</h1>
        <p className="text-sm text-slate-500">Upload an Excel or CSV file of contacts to start an outreach run.</p>
      </header>

      {/* Upload dropzone */}
      <label className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed py-10 text-center hover:border-brand-400">
        <UploadCloud className="text-brand-500" size={32} />
        <span className="font-medium">{uploadMut.isPending ? 'Uploading…' : 'Click to upload .xlsx, .xls, or .csv'}</span>
        <span className="text-xs text-slate-500">Up to 100 columns and 1,000+ rows</span>
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} disabled={uploadMut.isPending} />
      </label>

      {/* Recent imports */}
      {importsQuery.data?.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-semibold">Recent imports</h2>
          <div className="space-y-2">
            {importsQuery.data.map((it) => (
              <div
                key={it._id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  it._id === activeImportId
                    ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <button className="flex items-center gap-2 text-left" onClick={() => setActiveImport(it._id)}>
                  <FileSpreadsheet size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-medium">{it.filename}</div>
                    <div className="text-xs text-slate-500">
                      {it.rowCount} rows · {it.validEmailCount} valid emails · email col: {it.emailColumn || 'none'}
                    </div>
                  </div>
                  {it._id === activeImportId && <CheckCircle2 size={16} className="text-brand-600" />}
                </button>
                <button className="text-slate-400 hover:text-rose-500" onClick={() => deleteMut.mutate(it._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview + generate */}
      {imp && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Preview · {imp.filename}</h2>
            <div className="flex items-center gap-2">
              <select className="input max-w-xs" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Select a prompt template…</option>
                {templatesQuery.data?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                disabled={!templateId || generateMut.isPending}
                onClick={() => generateMut.mutate({ importId: imp._id, templateId })}
              >
                <Sparkles size={16} />
                {generateMut.isPending ? 'Generating…' : 'Generate emails'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {imp.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-500">
                      {c}
                      {c === imp.emailColumn && <span className="ml-1 text-brand-500">✉</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imp.rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {imp.columns.map((c) => (
                      <td key={c} className="max-w-[220px] truncate px-3 py-2 text-slate-700 dark:text-slate-300">
                        {String(row[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {imp.rowCount > 20 && (
            <p className="text-xs text-slate-500">Showing first 20 of {imp.rowCount} rows.</p>
          )}
        </div>
      )}
    </div>
  );
}
