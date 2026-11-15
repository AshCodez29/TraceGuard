import { NavLink, useLocation, useNavigate, useParams } from 'react-router';
import { hasPermission as roleHasPermission, canAccessProject } from '../../config/permissions.js';
import { ROLE_NAVIGATION, ROUTE_BY_NAV, WORKSPACE_NAVIGATION } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProjects } from '../../context/ProjectContext.jsx';

function destination(itemId, selectedId) {
  const section = ROUTE_BY_NAV[itemId];
  if (section && selectedId) return `/projects/${selectedId}/${section}`;
  if (itemId === 'dashboard') return '/dashboard';
  if (itemId === 'users') return '/users';
  if (itemId === 'project-management') return '/project-management';
  if (itemId === 'my-projects') return '/my-projects';
  if (itemId === 'assigned-projects') return '/assigned-projects';
  if (itemId === 'connections') return '/connections';
  if (itemId === 'scan-history') return '/scan-history';
  if (itemId === 'reports') return '/reports';
  if (itemId === 'settings') return '/settings';
  return selectedId ? `/projects/${selectedId}/overview` : '/dashboard';
}

export default function Sidebar() {
  const { user, hasPermission } = useAuth();
  const { accessibleProjects, selectedProject, selectProject } = useProjects();
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = accessibleProjects.find((p) => p.id === projectId) || selectedProject;
  const inWorkspace = location.pathname.startsWith('/projects/') && projectId && projectId !== 'new';
  const rows = inWorkspace
    ? WORKSPACE_NAVIGATION.filter(([, , , permission]) => hasPermission(permission))
    : (ROLE_NAVIGATION[user?.role] || []).filter(([id]) => {
      const permission = ({ dashboard: 'dashboard.view', users: 'users.manage', 'project-management': 'projects.manage', 'my-projects': 'projects.viewOwnShared', 'assigned-projects': 'projects.viewAssigned', connections: 'connections.view', 'scan-history': 'scan.history', 'schema-explorer': 'schema.view', 'integrity-scanner': 'scan.start', 'integrity-results': 'findings.view', traceability: 'traceability.view', 'security-analysis': 'security.view', reports: 'reports.view', settings: 'settings.manage' })[id];
      return roleHasPermission(user?.role, permission);
    });

  const linkFor = (id) => {
    if (inWorkspace) return `/projects/${projectId}/${id}`;
    return destination(id, project?.id);
  };

  return <aside className="lp gl">
    {inWorkspace && project && <div className="side-project">
      <div className="side-project-name">{project.name}</div>
      <div className="side-project-meta">{project.database} · {user?.role === 'AUDITOR' ? 'read-only' : 'connected'}</div>
    </div>}
    <nav className="side-nav" aria-label={inWorkspace ? 'Project workspace' : `${user?.role} navigation`}>
      <div className="side-nav-label">{inWorkspace ? 'Workspace' : `${user?.role} workspace`}</div>
      {rows.map(([id, label, icon, permission]) => {
        const to = linkFor(id);
        const badge = id === 'integrity' || id === 'integrity-results' ? '5' : '';
        return <NavLink key={id} to={to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
          <span className="side-ic" aria-hidden="true">{icon}</span><span>{label}</span>
          {badge && <span className="side-badge">{badge}</span>}
        </NavLink>;
      })}
    </nav>
    <div className="side-nav">
      <div className="side-nav-label">{user?.role === 'AUDITOR' ? 'Assigned projects' : inWorkspace ? 'Projects' : 'Recent projects'}</div>
      {accessibleProjects.length ? accessibleProjects.map((item) => <button key={item.id} className={`pi ${item.id === project?.id ? 'on' : ''}`} onClick={() => { selectProject(item.id); navigate(`/projects/${item.id}/overview`); }}>
        <span className="dt" style={{ color: item.status === 'completed' ? 'var(--g)' : 'var(--p)' }} />
        <span className="sp project-name-clip">{item.name}</span>
        <span className="mute project-state">{item.status === 'completed' ? 'Done' : 'Active'}</span>
      </button>) : <div className="empty-side">No accessible projects.</div>}
    </div>
  </aside>;
}
