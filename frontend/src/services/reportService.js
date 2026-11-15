import api from './api.js';
import { DEMO_REPORTS } from './demoData.js';

export const reportService = {
  async list({ demo = false } = {}) {
    if (demo) return DEMO_REPORTS;
    const { data } = await api.get('/reports');
    return data.content || data.reports || data;
  },
  async generate(projectId) {
    const { data } = await api.post(`/projects/${projectId}/reports`);
    return data;
  },
  async download(reportId) {
    const { data } = await api.get(`/reports/${reportId}/download`, { responseType: 'blob' });
    return data;
  },
};
