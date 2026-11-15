export const ROLE_PERMISSIONS = {
  ADMIN: [
    'dashboard.view', 'users.manage', 'projects.viewAll', 'projects.create', 'projects.manage',
    'connections.view', 'connections.manage', 'scan.history', 'scan.start', 'schema.view',
    'findings.view', 'findings.manage', 'traceability.view', 'security.view', 'reports.view',
    'reports.generate', 'reports.download', 'settings.manage', 'fix.approve', 'fix.dryRun',
    'fix.verify', 'links.review',
  ],
  DEVELOPER: [
    'dashboard.view', 'projects.viewOwnShared', 'projects.create', 'projects.manageOwn',
    'connections.view', 'connections.manage', 'scan.history', 'scan.start', 'schema.view',
    'findings.view', 'findings.manage', 'traceability.view', 'security.view', 'reports.view',
    'reports.generate', 'reports.download', 'fix.propose', 'fix.dryRun', 'fix.verify', 'links.review',
  ],
  AUDITOR: [
    'dashboard.view', 'projects.viewAssigned', 'scan.history', 'schema.view', 'findings.view',
    'traceability.view', 'security.view', 'reports.view', 'reports.download',
  ],
};

export const hasPermission = (role, permission) =>
  Boolean(ROLE_PERMISSIONS[role]?.includes(permission));

export const SECTION_PERMISSION = {
  dashboard: 'dashboard.view', users: 'users.manage', 'project-management': 'projects.manage',
  'my-projects': 'projects.viewOwnShared', 'assigned-projects': 'projects.viewAssigned',
  connections: 'connections.view', 'scan-history': 'scan.history', 'schema-explorer': 'schema.view',
  'integrity-scanner': 'scan.start', 'integrity-results': 'findings.view',
  traceability: 'traceability.view', 'security-analysis': 'security.view',
  reports: 'reports.view', settings: 'settings.manage',
};

export const canAccessProject = (role, username, project) => {
  if (!project || project.active === false) return false;
  if (role === 'ADMIN') return true;
  if (role === 'DEVELOPER') {
    return project.owner === username || project.sharedWith?.includes(username);
  }
  if (role === 'AUDITOR') return project.assignedTo?.includes(username) ?? false;
  return false;
};
