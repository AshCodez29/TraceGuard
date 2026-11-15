import api from './api.js';
import { DEMO_TABLES } from './demoData.js';

export const schemaService = {
  async getSchema(projectId, { demo = false } = {}) {
    if (demo) return DEMO_TABLES;
    const { data } = await api.get(`/projects/${projectId}/schema`);
    return data;
  },
};
