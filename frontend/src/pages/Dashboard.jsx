import { useNavigate } from 'react-router';
import OverviewCharts from '../components/dashboard/OverviewCharts.jsx';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';

export default function Dashboard() {
  const { user, hasPermission, isDemo } = useAuth();
  const { accessibleProjects, loading, error } = useProjects();
  const navigate = useNavigate();
  const title = user.role === 'ADMIN' ? 'Application dashboard' : user.role === 'AUDITOR' ? 'Review dashboard' : 'Database integrity workspace';
  const description = user.role === 'ADMIN' ? 'Manage users, projects and analysis across your organization.' : user.role === 'AUDITOR' ? 'Review assigned projects, completed scans and findings.' : 'Explore your projects, inspect database integrity and run authorized scans.';
  return <>
    <div className="page-heading-row"><div><h1>{title}</h1><p className="mute page-subtitle">{description}</p></div>{hasPermission('projects.create') && <button className="pri" onClick={() => navigate('/projects/new')}>+ New project</button>}</div>
    {isDemo ? <OverviewCharts /> : <div className="gl empty-state">Scan metrics will appear when the backend provides dashboard data.</div>}
    <div className="stats">
      <div className="gl"><b>{accessibleProjects.length}</b><span className="mute">{user.role === 'AUDITOR' ? 'Assigned projects' : 'Accessible projects'}</span></div>
      <div className="gl"><b>{isDemo ? '5' : '—'}</b><span className="mute">{isDemo ? 'Sample findings' : 'Findings'}</span></div>
      <div className="gl"><b>{isDemo ? '4' : '—'}</b><span className="mute">{isDemo ? 'Recorded scans' : 'Recorded scans'}</span></div>
    </div>
    {error && <div className="box error-box">{error}</div>}
    <div className="section-head"><span className="section-title">{user.role === 'ADMIN' ? 'Organization projects' : user.role === 'AUDITOR' ? 'Assigned projects' : 'My projects'}</span>
      {hasPermission('projects.create') && <button onClick={() => navigate('/projects/new')}>Create project</button>}
    </div>
    {loading ? <div className="gl empty-state">Loading projects…</div> : accessibleProjects.length ? <div className="g3">{accessibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className="gl empty-state">{user.role === 'AUDITOR' ? 'No projects have been assigned to you yet.' : 'No projects match your access.'}{hasPermission('projects.create') && <div className="empty-action"><button className="pri" onClick={() => navigate('/projects/new')}>Create project</button></div>}</div>}
    {user.role === 'DEVELOPER' && <div className="gl card starter-card"><b>Start with an authorized data source</b><p className="mute">Connect MySQL or upload a SQL dump, then run an integrity scan.</p><button className="pri" onClick={() => navigate('/connections')}>Database connections</button><button className="secondary-action" onClick={() => navigate('/projects/new')}>Upload SQL dump</button></div>}
    {isDemo && <p className="demo-label">Sample dashboard values are mock data; no database scan has been performed.</p>}
  </>;
}
