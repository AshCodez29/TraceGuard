import api from './api.js';
import { DEMO_FINDINGS, DEMO_HISTORY } from './demoData.js';

export const scanService = {
  async start(projectId, { demo = false } = {}) {
    if (demo) return { id: `sample-${Date.now()}`, projectId, status: 'sample', demo: true };
    const { data } = await api.post(`/projects/${projectId}/scans`);
    return data;
  },
  async history(projectId, { demo = false } = {}) {
    if (demo) return DEMO_HISTORY.filter((row) => !projectId || row.projectId === projectId);
    const { data } = await api.get('/scans', { params: projectId ? { projectId } : {} });
    return data.content || data.scans || data;
  },
  async results(scanId, { demo = false } = {}) {
    if (demo) return DEMO_FINDINGS;
    const { data } = await api.get(`/scans/${scanId}/issues`);
    return data.content || data.issues || data;
  },
  async latestResults(projectId) {
    const { data } = await api.get(`/projects/${projectId}/issues`);
    return data.content || data.issues || data;
  },
};
