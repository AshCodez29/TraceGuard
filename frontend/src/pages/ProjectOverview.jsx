import { useNavigate, useParams } from 'react-router';
import OverviewCharts from '../components/dashboard/OverviewCharts.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { DEMO_FINDINGS } from '../services/demoData.js';

export default function ProjectOverview() {
  const { projectId } = useParams(); const { accessibleProjects } = useProjects(); const { hasPermission, isDemo } = useAuth(); const navigate = useNavigate();
  const project = accessibleProjects.find((item) => item.id === projectId);
  return <><div className="page-heading-row"><div><h1>{project?.name}</h1><p className="mute page-subtitle">{project?.database} · {project?.team} · owner {project?.owner}</p></div><span className="chip ok">Read-only connection</span></div>
    {isDemo ? <OverviewCharts name={project?.name} /> : <div className="gl empty-state">Project metrics will appear after the backend scan and metrics endpoints are available.</div>}
    <div className="stats"><div className="gl"><b>{isDemo ? DEMO_FINDINGS.length : '—'}</b><span className="mute">{isDemo ? 'Sample findings' : 'Findings'}</span></div><div className="gl"><b>{isDemo ? '31' : '—'}</b><span className="mute">Rows affected</span></div><div className="gl"><b>{isDemo ? '2' : '—'}</b><span className="mute">Relationships implicated</span></div></div>
    <section className="gl card"><b>Project overview</b><p className="mute">Explore this project’s schema, integrity results, traceability and security analysis.</p>{hasPermission('scan.start') && <button className="pri" onClick={() => navigate(`/projects/${projectId}/integrity`)}>Run integrity scan</button>}</section>
    {isDemo && <p className="demo-label">Statistics and charts are illustrative sample data; no database scan has been performed.</p>}
  </>;
}
