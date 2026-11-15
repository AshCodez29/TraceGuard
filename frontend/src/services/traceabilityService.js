import api from './api.js';
import { DEMO_TABLES } from './demoData.js';

export const traceabilityService = {
  async getGraph(projectId, { demo = false } = {}) {
    if (demo) return { tables: DEMO_TABLES, relationships: [] };
    const { data } = await api.get(`/projects/${projectId}/traceability`);
    return data;
  },
};
