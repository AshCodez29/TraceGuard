import { Navigate, Outlet, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProjects } from '../../context/ProjectContext.jsx';

export default function ProjectAccessRoute() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { accessibleProjects, loading } = useProjects();
  if (loading) return <div className="gl empty-state">Loading project access…</div>;
  const allowed = accessibleProjects.some((project) => project.id === projectId);
  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace state={{ denied: true, role: user?.role }} />;
}
