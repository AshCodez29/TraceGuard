import api from './api.js';
import { DEMO_PROJECTS } from './demoData.js';

const copyDemoProjects = () => structuredClone(DEMO_PROJECTS);

export const projectService = {
  async list({ demo = false } = {}) {
    if (demo) return copyDemoProjects();
    const { data } = await api.get('/projects');
    return data.content || data.projects || data;
  },
  async create(project, { demo = false } = {}) {
    if (demo) return { ...project, id: `demo-${Date.now()}`, active: true, status: 'queued' };
    const { data } = await api.post('/projects', project);
    return data;
  },
  async update(id, patch, { demo = false } = {}) {
    if (demo) return { id, ...patch };
    const { data } = await api.patch(`/projects/${id}`, patch);
    return data;
  },
};
