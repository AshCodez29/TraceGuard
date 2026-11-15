import api from './api.js';
import { DEMO_SECURITY } from './demoData.js';

export const securityService = {
  async getFindings(projectId, { demo = false } = {}) {
    if (demo) return DEMO_SECURITY;
    const { data } = await api.get(`/projects/${projectId}/security`);
    return data.content || data.findings || data;
  },
};
