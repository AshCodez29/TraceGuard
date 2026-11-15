import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_TABLES } from '../services/demoData.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { traceabilityService } from '../services/traceabilityService.js';

const EDGES = [[260,42,150,42,2],[380,42,490,42,5],[270,64,140,140,3],[320,140,320,64,0],[320,184,320,260,4],[260,282,150,282,1],[380,282,490,282,0]];

export default function Traceability() {
  const { projectId } = useParams(); const { user, hasPermission, isDemo } = useAuth(); const { showToast } = useToast();
  const { setSelectedFindingId } = useWorkspace(); const [decision, setDecision] = useState('');
  const [graph, setGraph] = useState(null); const [error, setError] = useState('');
  useEffect(() => { traceabilityService.getGraph(projectId, { demo: isDemo }).then((data) => { setGraph(data); setError(''); }).catch(() => { setGraph(null); setError('Traceability data could not be loaded.'); }); }, [projectId, isDemo]);
  const colors = ['var(--edge)','var(--edge)','var(--o)','var(--o)','var(--p)','var(--k)','var(--edge)'];
  const tables = graph?.tables || {};
  const relationships = graph?.relationships || [];
  const isSample = isDemo;
  function decide(value) { setDecision(value); showToast(isDemo ? `Sample relationship ${value.toLowerCase()}.` : `Relationship ${value.toLowerCase()}.`); }
  return <><h1>Traceability Graph</h1><p className="mute page-subtitle">Explore relationship paths and inspect broken links.</p>
    {error && <div className="box error-box">{error}</div>}
    {!graph && !error && <div className="gl empty-state">Loading relationship metadata…</div>}
    {graph && !isSample && !relationships.length && <div className="gl empty-state">No relationship metadata is available for this project yet.</div>}
    {graph && (isSample || relationships.length > 0) && <>
    <div className="legend"><span style={{ color: 'var(--k)' }}>━ broken link</span><span style={{ color: 'var(--p)' }}>╌ proposed link</span><span className="ok">━ resolved</span><span>━ healthy</span></div>
    <div className="gl card graph-wrap"><svg viewBox="0 0 640 330" role="img" aria-label="Northwind tables and relationships">
      {(isSample ? EDGES : relationships.map((relationship, index) => [relationship.x1 ?? 260, relationship.y1 ?? 42 + index * 16, relationship.x2 ?? 490, relationship.y2 ?? 42 + index * 16, relationship.findingId || 0])).map((edge, index) => <g key={index} className="edge" onClick={() => edge[4] > 0 && setSelectedFindingId(edge[4])} tabIndex={edge[4] ? 0 : -1} role={edge[4] ? 'button' : undefined}>
        <line x1={edge[0]} y1={edge[1]} x2={edge[2]} y2={edge[3]} stroke={colors[index]} strokeWidth={edge[4] ? 3 : 1.5} strokeDasharray={edge[4] === 5 ? '6 4' : undefined} />
        {edge[4] > 0 && <text x={(edge[0]+edge[2])/2} y={(edge[1]+edge[3])/2-5} className="graph-edge-label">{edge[4]}</text>}
      </g>)}
      {Object.entries(tables).map(([name, node], index) => { const x = node.x ?? 40 + (index % 3) * 220; const y = node.y ?? 30 + Math.floor(index / 3) * 100; return <g key={name} className="graph-node"><rect className="nd" x={x} y={y} width="120" height="44" rx="10" /><text x={x+10} y={y+19}>{name}</text><text className="s" x={x+10} y={y+34}>{node.rows ?? `${node.rowCount ?? '—'} rows`}</text></g>; })}
    </svg></div>
    <div className="gl card graph-insight"><b>{isSample ? 'Proposed relationship' : 'Relationships'}</b><p><code>{isSample ? 'orders.ship_via → shippers.shipper_id' : relationships.map((row) => `${row.from || row.source} → ${row.to || row.target}`).join(' · ')}</code></p>{decision && <p className="ok">Decision recorded in this session: {decision}</p>}
      {user.role !== 'AUDITOR' && hasPermission('links.review') && <div className="toolbar"><button className="pri" onClick={() => decide('Accepted')}>Accept relationship</button><button onClick={() => decide('Rejected')}>Reject relationship</button></div>}
    </div>
    </>}
    {isDemo && <p className="demo-label">Graph is sample metadata, not a live database inspection.</p>}
  </>;
}
