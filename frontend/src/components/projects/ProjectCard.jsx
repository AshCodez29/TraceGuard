import { useNavigate } from 'react-router';
import { useProjects } from '../../context/ProjectContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { canAccessProject } from '../../config/permissions.js';

export default function ProjectCard({ project, management = false }) {
  const navigate = useNavigate();
  const { selectProject, updateProject } = useProjects();
  const { user, isDemo } = useAuth();
  const { showToast } = useToast();
  const canManage = management && (user.role === 'ADMIN' || (user.role === 'DEVELOPER' && project.owner === user.username));
  async function edit() {
    const name = window.prompt('Project name', project.name);
    if (!name?.trim()) return;
    try { await updateProject(project.id, { name: name.trim() }); showToast(isDemo ? 'Sample project updated.' : 'Project updated.'); }
    catch { showToast('Project could not be updated.', 'error'); }
  }
  return <article className="gl project-card">
    <div className="project-card-top"><span className="dt" style={{ color: project.status === 'completed' ? 'var(--g)' : 'var(--p)' }} /><h2>{project.name}</h2></div>
    <p className="mute project-meta">{project.database} · {project.team} · {project.status === 'completed' ? 'Completed' : 'Scan ready'}</p>
    <div className="project-card-actions">
      <button className="pri" disabled={!canAccessProject(user.role, user.username, project)} onClick={() => { selectProject(project.id); navigate(`/projects/${project.id}/overview`); }}>Open project</button>
      {canManage && <button onClick={edit}>Edit</button>}
    </div>
  </article>;
}
