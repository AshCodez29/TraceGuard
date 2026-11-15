import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_TABLES } from '../services/demoData.js';
import { schemaService } from '../services/schemaService.js';

export default function SchemaExplorer() {
  const { projectId } = useParams(); const { isDemo } = useAuth(); const { showToast } = useToast();
  const { selectedTable, setSelectedTable } = useWorkspace(); const [tables, setTables] = useState(DEMO_TABLES);
  useEffect(() => { schemaService.getSchema(projectId, { demo: isDemo }).then(setTables).catch(() => showToast('Schema could not be loaded.', 'error')); }, [projectId, isDemo, showToast]);
  return <><div className="section-head"><div><h1>Schema Explorer</h1><p className="mute">Select a table to inspect columns and relationships.</p></div></div>
    {Object.keys(tables).length ? <div className="g3">{Object.entries(tables).map(([name, info]) => <button key={name} className={`gl ic table-card ${selectedTable === name ? 'on' : ''}`} onClick={() => setSelectedTable(name)}><b className="m">{name}</b><br /><span className="mute">{info.rows} · {info.columns.length} columns</span></button>)}</div> : <div className="gl empty-state">No schema has been scanned for this project.</div>}
    {isDemo && <p className="demo-label">Schema shown is sample Northwind metadata.</p>}
  </>;
}
