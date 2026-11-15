import { useNavigate } from 'react-router';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';

function ProjectList({ assigned = false }) {
  const { accessibleProjects } = useProjects();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const title = assigned ? 'Assigned Projects' : 'My Projects';
  return <><div className="page-heading-row"><div><h1>{title}</h1><p className="mute page-subtitle">{assigned ? 'Read-only projects assigned to your auditor account.' : 'Projects you own or that have been explicitly shared with you.'}</p></div>{hasPermission('projects.create') && <button className="pri" onClick={() => navigate('/projects/new')}>+ New project</button>}</div>
    {accessibleProjects.length ? <div className="g3">{accessibleProjects.map((project) => <ProjectCard key={project.id} project={project} management={!assigned && project.owner === 'priya'} />)}</div> : <div className="gl empty-state">{assigned ? 'No projects have been assigned to you yet.' : 'No shared or owned projects are available.'}</div>}
  </>;
}

export function MyProjects() { return <ProjectList />; }
export function AssignedProjects() { return <ProjectList assigned />; }
