import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useNavigate } from 'react-router';
import { canAccessProject } from '../config/permissions.js';

export default function ProjectManagement() {
  const { user, hasPermission, isDemo } = useAuth();
  const { projects, selectProject, updateProject } = useProjects();
  const { showToast } = useToast(); const navigate = useNavigate();
  if (!hasPermission('projects.manage')) return <div className="gl empty-state">Project management is restricted to Admins.</div>;
  async function rename(project) { const next = window.prompt('Project name', project.name); if (!next?.trim()) return; try { await updateProject(project.id, { name: next.trim() }); showToast(isDemo ? 'Sample project renamed.' : 'Project updated.'); } catch { showToast('Could not update project.', 'error'); } }
  async function toggle(project) { try { await updateProject(project.id, { active: project.active === false }); showToast(isDemo ? 'Sample project status changed.' : 'Project status updated.'); } catch { showToast('Could not update project.', 'error'); } }
  return <><h1>Project Management</h1><p className="mute page-subtitle">Manage organization projects and project availability.</p>
    <div className="g3">{projects.map((project) => <article className="gl project-card" key={project.id}>
      <div className="project-card-top"><span className="dt" style={{ color: project.active === false ? 'var(--k)' : 'var(--g)' }} /><h2>{project.name}</h2></div>
      <p className="mute project-meta">{project.database} · {project.team} · {project.active === false ? 'Inactive' : 'Active'}</p>
      <div className="project-card-actions"><button className="pri" disabled={!canAccessProject(user.role, user.username, project)} onClick={() => { selectProject(project.id); navigate(`/projects/${project.id}/overview`); }}>Open</button><button onClick={() => rename(project)}>Edit</button><button onClick={() => toggle(project)}>{project.active === false ? 'Reactivate' : 'Deactivate'}</button></div>
    </article>)}</div>
  </>;
}
