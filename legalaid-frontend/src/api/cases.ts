import { api } from './axios';

export const casesApi = {
  create: (data: { title: string; description: string }) => api.post('/cases', data).then((r) => r.data),
  list: (params?: Record<string, string | number>) => api.get('/cases', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/cases/${id}`).then((r) => r.data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/cases/${id}/status`, data).then((r) => r.data),
  assign: (id: string, volunteerId: string) => api.patch(`/cases/${id}/assign`, { volunteerId }).then((r) => r.data),
  setOutcome: (id: string, outcome: string) => api.patch(`/cases/${id}/outcome`, { outcome }).then((r) => r.data),
  manualClassify: (id: string, data: { domain: string; urgency: string }) =>   // 👈 ye add karo
    api.patch(`/cases/${id}/classify`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/cases/${id}`).then((r) => r.data),
  myStatusBreakdown: () => api.get('/cases/stats/status-breakdown').then((r) => r.data),
};

export const documentsApi = {
  upload: (caseId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/cases/${caseId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  list: (caseId: string) => api.get(`/cases/${caseId}/documents`).then((r) => r.data),
  downloadUrl: (id: string) => `${api.defaults.baseURL}/documents/${id}/download`,
  download: (id: string, filename: string) =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),
  delete: (id: string) => api.delete(`/documents/${id}`).then((r) => r.data),   // 👈 naya
};
export const notesApi = {
  create: (caseId: string, data: { content: string; draft?: boolean }) =>
    api.post(`/cases/${caseId}/notes`, data).then((r) => r.data),
  list: (caseId: string) => api.get(`/cases/${caseId}/notes`).then((r) => r.data),
  approve: (id: string, content: string) => api.patch(`/notes/${id}/approve`, { content }).then((r) => r.data),
};

export const aiApi = {
  predictOutcome: (caseId: string) => api.post('/ai/predict-outcome', { caseId }).then((r) => r.data),
};

export const appointmentsApi = {
  book: (data: { caseId: string; volunteerId: string; startsAt: string; endsAt: string }) =>
    api.post('/appointments', data).then((r) => r.data),
  list: () => api.get('/appointments').then((r) => r.data),
  update: (id: string, data: { action: string; startsAt?: string; endsAt?: string }) =>
    api.patch(`/appointments/${id}`, data).then((r) => r.data),
  setAvailability: (data: { dayOfWeek: number; startTime: string; endTime: string }) =>
    api.post('/availability', data).then((r) => r.data),
  getAvailability: (volunteerId: string) => api.get(`/availability/${volunteerId}`).then((r) => r.data),
  deleteAvailability: (id: string) => api.delete(`/availability/${id}`).then((r) => r.data),
};

export const usersApi = {
  volunteers: () => api.get('/users/volunteers').then((r) => r.data),
  all: (role?: string) => api.get('/users', { params: role ? { role } : {} }).then((r) => r.data),
  update: (id: string, data: { name?: string; email?: string; role?: string }) =>
    api.patch(`/users/${id}`, data).then((r) => r.data),
  setActive: (id: string, isActive: boolean) =>
    api.patch(`/users/${id}/active`, { isActive }).then((r) => r.data),
};

export const adminApi = {
  volume: () => api.get('/admin/stats/volume').then((r) => r.data),
  resolutionTime: () => api.get('/admin/stats/resolution-time').then((r) => r.data),
  outcomes: () => api.get('/admin/stats/outcomes').then((r) => r.data),
  utilisation: () => api.get('/admin/stats/utilisation').then((r) => r.data),
  statusBreakdown: () => api.get('/admin/stats/status-breakdown').then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  updateUser: (id: string, data: { name?: string; email?: string; role?: string; maxActiveCases?: number }) =>
    api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};
