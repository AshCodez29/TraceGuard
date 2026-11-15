import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_CONNECTIONS } from '../services/demoData.js';
import { connectionService } from '../services/connectionService.js';

export default function DatabaseConnections() {
  const { hasPermission, isDemo } = useAuth(); const { accessibleProjects } = useProjects(); const { showToast } = useToast();
  const [connections, setConnections] = useState(() => isDemo ? structuredClone(DEMO_CONNECTIONS) : []);
  const [showForm, setShowForm] = useState(false); const [name, setName] = useState(''); const [host, setHost] = useState('localhost:3306');
  const allowedIds = new Set(accessibleProjects.map((p) => p.id));
  const rows = connections.filter((c) => allowedIds.has(c.projectId));
  useEffect(() => { if (!isDemo) connectionService.list().then(setConnections).catch(() => showToast('Connections could not be loaded.', 'error')); }, [isDemo, showToast]);
  async function add(event) {
    event.preventDefault(); if (!name.trim()) return showToast('Enter a database name.', 'error');
    const project = accessibleProjects[0]; if (!project) return showToast('Create or select a project first.', 'error');
    try {
      const payload = { name: name.trim(), host, projectId: project.id };
      const item = isDemo ? { ...payload, id: `demo-${Date.now()}`, engine: 'MySQL', status: 'Sample connection' } : await connectionService.create(payload);
      setConnections((current) => [item, ...current]); setName(''); setShowForm(false); showToast(isDemo ? 'Sample connection saved in this session.' : 'Connection saved.');
    } catch (e) { showToast(e.response?.data?.message || 'Connection could not be saved.', 'error'); }
  }
  return <><div className="page-heading-row"><div><h1>Database Connections</h1><p className="mute page-subtitle">Project sources use read-only access by default.</p></div>{hasPermission('connections.manage') && <button className="pri" onClick={() => setShowForm((v) => !v)}>+ Add connection</button>}</div>
    {showForm && <form className="gl card connection-form" onSubmit={add}><label className="f" htmlFor="conn-name">Database name</label><input id="conn-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="northwind_broken" /><label className="f" htmlFor="conn-host">Host and port</label><input id="conn-host" value={host} onChange={(e) => setHost(e.target.value)} /><p className="readonly-note">Credentials are provisioned through the backend; this form does not save passwords.</p><button className="pri">Save connection</button></form>}
    {rows.length ? <div className="g3">{rows.map((connection) => <article className="gl card" key={connection.id}><h2>{connection.name}</h2><p className="mute">{connection.engine} · {connection.host}</p><span className="chip ok">{connection.status}</span><p className="mute connection-project">Project: {accessibleProjects.find((p) => p.id === connection.projectId)?.name}</p></article>)}</div> : <div className="gl empty-state">No database connections are available to this account.</div>}
    {isDemo && <p className="demo-label">Connections shown here are sample metadata; no database connection was opened.</p>}
  </>;
}
