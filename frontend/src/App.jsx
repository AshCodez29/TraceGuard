import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserManagement from './pages/UserManagement.jsx';
import ProjectManagement from './pages/ProjectManagement.jsx';
import DatabaseConnections from './pages/DatabaseConnections.jsx';
import ScanHistory from './pages/ScanHistory.jsx';
import SchemaExplorer from './pages/SchemaExplorer.jsx';
import IntegrityScanner from './pages/IntegrityScanner.jsx';
import IntegrityResults from './pages/IntegrityResults.jsx';
import Traceability from './pages/Traceability.jsx';
import SecurityAnalysis from './pages/SecurityAnalysis.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import ProjectCreation from './pages/ProjectCreation.jsx';
import ProjectOverview from './pages/ProjectOverview.jsx';
import { MyProjects, AssignedProjects } from './pages/ProjectLists.jsx';
import Header from './components/common/Header.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import StatusBar from './components/common/StatusBar.jsx';
import FindingDetails from './components/integrity/FindingDetails.jsx';
import SchemaDetails from './components/schema/SchemaDetails.jsx';
import { RequireAuth } from './components/common/ProtectedRoute.jsx';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext.jsx';
import { useProjects } from './context/ProjectContext.jsx';
import { useAuth } from './context/AuthContext.jsx';

function AppFrame() {
  const location = useLocation();
  const { selectedFindingId, setSelectedFindingId, selectedTable, setSelectedTable } = useWorkspace();
  const showDetails = /\/(integrity|schema)$/.test(location.pathname);
  const isSchema = location.pathname.endsWith('/schema');
  return <div id="app">
    <Header />
    <div className={`body ${showDetails ? '' : 'n2'}`}>
      <Sidebar />
      <main className="mid"><div className="ctr"><Outlet /></div></main>
      {showDetails && <aside className="rp gl" aria-live="polite">{isSchema ? <SchemaDetails tableName={selectedTable} /> : <FindingDetails selectedId={selectedFindingId} />}</aside>}
    </div>
    <StatusBar />
  </div>;
}

function AppLayout() { return <WorkspaceProvider><AppFrame /></WorkspaceProvider>; }

function ProjectAccessGuard() {
  const { projectId } = useParams(); const { accessibleProjects, loading } = useProjects();
  if (loading) return <div className="gl empty-state">Loading project access…</div>;
  return accessibleProjects.some((project) => project.id === projectId) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function ProjectCreationRoute() {
  const { hasPermission } = useAuth();
  return hasPermission('projects.create') ? <ProjectCreation /> : <Navigate to="/dashboard" replace />;
}

function PermissionPage({ permission, children }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<PermissionPage permission="users.manage"><UserManagement /></PermissionPage>} />
        <Route path="project-management" element={<PermissionPage permission="projects.manage"><ProjectManagement /></PermissionPage>} />
        <Route path="my-projects" element={<PermissionPage permission="projects.viewOwnShared"><MyProjects /></PermissionPage>} />
        <Route path="assigned-projects" element={<PermissionPage permission="projects.viewAssigned"><AssignedProjects /></PermissionPage>} />
        <Route path="connections" element={<PermissionPage permission="connections.view"><DatabaseConnections /></PermissionPage>} />
        <Route path="scan-history" element={<PermissionPage permission="scan.history"><ScanHistory /></PermissionPage>} />
        <Route path="reports" element={<PermissionPage permission="reports.view"><Reports /></PermissionPage>} />
        <Route path="settings" element={<PermissionPage permission="settings.manage"><Settings /></PermissionPage>} />
        <Route path="projects/new" element={<ProjectCreationRoute />} />
        <Route path="projects/:projectId" element={<ProjectAccessGuard />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ProjectOverview />} />
          <Route path="schema" element={<PermissionPage permission="schema.view"><SchemaExplorer /></PermissionPage>} />
          <Route path="integrity" element={<PermissionPage permission="findings.view"><IntegrityResults /></PermissionPage>} />
          <Route path="integrity-scanner" element={<PermissionPage permission="scan.start"><IntegrityScanner /></PermissionPage>} />
          <Route path="traceability" element={<PermissionPage permission="traceability.view"><Traceability /></PermissionPage>} />
          <Route path="security" element={<PermissionPage permission="security.view"><SecurityAnalysis /></PermissionPage>} />
          <Route path="reports" element={<PermissionPage permission="reports.view"><Reports /></PermissionPage>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Route>
  </Routes>;
}

export default function App() {
  return <AppRoutes />;
}
