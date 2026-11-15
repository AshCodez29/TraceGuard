export const ROLE_NAVIGATION = {
  ADMIN: [
    ['dashboard', 'Dashboard', '◈'], ['users', 'User Management', '♙'],
    ['project-management', 'Project Management', '▣'], ['connections', 'Database Connections', '◉'],
    ['scan-history', 'Scan History', '◷'], ['integrity-results', 'Integrity Results', '⚠'],
    ['traceability', 'Traceability', '⌘'], ['security-analysis', 'Security Analysis', '◇'],
    ['reports', 'Reports', '▤'], ['settings', 'Settings', '⚙'],
  ],
  DEVELOPER: [
    ['dashboard', 'Dashboard', '◈'], ['my-projects', 'My Projects', '▣'],
    ['connections', 'Database Connections', '◉'], ['schema-explorer', 'Schema Explorer', '▦'],
    ['integrity-scanner', 'Integrity Scanner', '⚠'], ['integrity-results', 'Integrity Results', '⚑'],
    ['traceability', 'Traceability', '⌘'], ['security-analysis', 'Security Analysis', '◇'],
    ['scan-history', 'Scan History', '◷'], ['reports', 'Reports', '▤'],
  ],
  AUDITOR: [
    ['dashboard', 'Dashboard', '◈'], ['assigned-projects', 'Assigned Projects', '▣'],
    ['schema-explorer', 'Schema Explorer', '▦'], ['integrity-results', 'Integrity Results', '⚑'],
    ['traceability', 'Traceability', '⌘'], ['security-analysis', 'Security Analysis', '◇'],
    ['scan-history', 'Scan History', '◷'], ['reports', 'Reports', '▤'],
  ],
};

export const WORKSPACE_NAVIGATION = [
  ['overview', 'Overview', '◈', 'dashboard.view'], ['schema', 'Schema', '▦', 'schema.view'],
  ['integrity', 'Integrity', '⚠', 'findings.view'], ['traceability', 'Traceability', '⌘', 'traceability.view'],
  ['security', 'Security', '◇', 'security.view'], ['reports', 'Reports', '▤', 'reports.view'],
];

export const ROUTE_BY_NAV = {
  'schema-explorer': 'schema', 'integrity-scanner': 'integrity', 'integrity-results': 'integrity',
  traceability: 'traceability', 'security-analysis': 'security',
};
