import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProjectCreation() {
  const { user, hasPermission, isDemo } = useAuth();
  const { createProject } = useProjects();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sourceMode, setSourceMode] = useState('file');
  const [fileName, setFileName] = useState('Drop a .sql file here, or browse');
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost:3306');
  const [database, setDatabase] = useState('northwind_broken');
  const [error, setError] = useState('');
  if (!hasPermission('projects.create')) return <div className="gl empty-state">Project creation is not available for this role.</div>;

  async function submit(event) {
    event.preventDefault(); setError('');
    if (!name.trim()) return setError('Enter a project name.');
    try {
      const project = await createProject({ name: name.trim(), team: 'Platform', database: database.trim() || name.trim(), owner: user.username, sharedWith: [], assignedTo: [] });
      showToast(isDemo ? 'Sample project created in this browser session.' : 'Project created.');
      navigate(`/projects/${project.id}/overview`);
    } catch (e) { setError(e.response?.data?.message || 'Project could not be created.'); }
  }

  return <><h1>New project</h1><p className="mute page-subtitle">Create a project under {user.organization || 'Northwind Labs'}.</p>
    <form className="g2 creation-grid" onSubmit={submit}>
      <div className="gl card"><label className="f" htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="northwind_broken" />
        {error && <div className="err">{error}</div>}<label className="f" htmlFor="team">Team</label><select id="team"><option>Platform</option><option>Billing</option><option>Data</option></select>
        <label className="f" htmlFor="owner">Data owner</label><input id="owner" value={user.username} readOnly />
      </div>
      <div className="gl card"><b>Database source</b><div className="seg source-switch"><button type="button" aria-pressed={sourceMode === 'file'} onClick={() => setSourceMode('file')}>Upload SQL file</button><button type="button" aria-pressed={sourceMode === 'mysql'} onClick={() => setSourceMode('mysql')}>Connect MySQL</button></div>
        {sourceMode === 'file' ? <label className="drop"><input type="file" accept=".sql" hidden onChange={(e) => setFileName(e.target.files?.[0]?.name || 'Drop a .sql file here, or browse')} />{fileName}</label> : <><label className="f" htmlFor="host">Host and port</label><input id="host" value={host} onChange={(e) => setHost(e.target.value)} /><label className="f" htmlFor="database">Database</label><input id="database" value={database} onChange={(e) => setDatabase(e.target.value)} /></>}
        <p className="readonly-note">The frontend demo does not upload or connect to a database. Real connections require backend authorization and read-only target credentials.</p>
        <button className="pri full-button">{isDemo ? 'Create sample project' : 'Create project'}</button>
      </div>
    </form>
  </>;
}
