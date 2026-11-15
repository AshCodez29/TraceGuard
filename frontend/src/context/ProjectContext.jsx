import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { canAccessProject } from '../config/permissions.js';
import { useAuth } from './AuthContext.jsx';
import { projectService } from '../services/projectService.js';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');

  const refreshProjects = useCallback(async () => {
    if (!user) { setProjects([]); setSelectedProjectId(null); return; }
    setLoading(true); setError('');
    try {
      const rows = await projectService.list({ demo: isDemo });
      setProjects(rows);
      setSelectedProjectId((current) => rows.some((p) => p.id === current) ? current : rows[0]?.id || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load projects.');
    } finally { setLoading(false); }
  }, [user, isDemo]);

  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  const accessibleProjects = useMemo(
    () => projects.filter((p) => canAccessProject(user?.role, user?.username, p)),
    [projects, user],
  );
  const selectedProject = accessibleProjects.find((p) => p.id === selectedProjectId) || accessibleProjects[0] || null;
  const selectProject = useCallback((id) => {
    const project = projects.find((p) => p.id === id);
    if (canAccessProject(user?.role, user?.username, project)) setSelectedProjectId(id);
  }, [projects, user]);
  const createProject = useCallback(async (payload) => {
    const created = await projectService.create(payload, { demo: isDemo });
    if (isDemo) setProjects((rows) => [created, ...rows]);
    else await refreshProjects();
    setSelectedProjectId(created.id);
    return created;
  }, [isDemo, refreshProjects]);
  const updateProject = useCallback(async (id, patch) => {
    await projectService.update(id, patch, { demo: isDemo });
    if (isDemo) setProjects((rows) => rows.map((p) => p.id === id ? { ...p, ...patch } : p));
    else await refreshProjects();
  }, [isDemo, refreshProjects]);

  const value = useMemo(() => ({
    projects, accessibleProjects, selectedProject, selectedProjectId, selectProject,
    createProject, updateProject, refreshProjects, loading, error,
  }), [projects, accessibleProjects, selectedProject, selectedProjectId, selectProject, createProject, updateProject, refreshProjects, loading, error]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export const useProjects = () => {
  const value = useContext(ProjectContext);
  if (!value) throw new Error('useProjects must be used within ProjectProvider');
  return value;
};
