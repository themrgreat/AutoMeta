import axios from 'axios';

// All requests are relative to /api; Vite proxies them to the backend in dev.
export const api = axios.create({ baseURL: '/api' });

// Surface backend error messages to callers/toasts.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ── Imports ──────────────────────────────────────────────
export const uploadFile = (formData) =>
  api.post('/imports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const listImports = () => api.get('/imports').then((r) => r.data);
export const getImport = (id) => api.get(`/imports/${id}`).then((r) => r.data);
export const deleteImport = (id) => api.delete(`/imports/${id}`).then((r) => r.data);

// ── Templates ────────────────────────────────────────────
export const listTemplates = () => api.get('/templates').then((r) => r.data);
export const createTemplate = (data) => api.post('/templates', data).then((r) => r.data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data).then((r) => r.data);
export const cloneTemplate = (id) => api.post(`/templates/${id}/clone`).then((r) => r.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then((r) => r.data);
export const enhancePrompt = (prompt) => api.post('/templates/enhance', { prompt }).then((r) => r.data);

// ── Senders ──────────────────────────────────────────────
export const listSenders = () => api.get('/senders').then((r) => r.data);
export const createSender = (data) => api.post('/senders', data).then((r) => r.data);
export const updateSender = (id, data) => api.put(`/senders/${id}`, data).then((r) => r.data);
export const verifySender = (id) => api.post(`/senders/${id}/verify`).then((r) => r.data);
export const deleteSender = (id) => api.delete(`/senders/${id}`).then((r) => r.data);

// ── Generation ───────────────────────────────────────────
export const generateEmails = (data) => api.post('/generate', data).then((r) => r.data);

// ── Emails ───────────────────────────────────────────────
export const listEmails = (params) => api.get('/emails', { params }).then((r) => r.data);
export const emailStats = (importId) =>
  api.get('/emails/stats', { params: { importId } }).then((r) => r.data);
export const updateEmail = (id, data) => api.patch(`/emails/${id}`, data).then((r) => r.data);
export const bulkStatus = (ids, status) =>
  api.post('/emails/bulk-status', { ids, status }).then((r) => r.data);
export const regenerateEmail = (id) => api.post(`/emails/${id}/regenerate`).then((r) => r.data);
export const sendEmails = (ids) => api.post('/emails/send', { ids }).then((r) => r.data);
