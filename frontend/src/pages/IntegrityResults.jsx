import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import FindingCard from '../components/integrity/FindingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_FINDINGS } from '../services/demoData.js';
import { scanService } from '../services/scanService.js';

export default function IntegrityResults() {
  const { projectId } = useParams(); const { hasPermission, isDemo } = useAuth();
  const { selectedFindingId, setSelectedFindingId, setCurrentFindings } = useWorkspace(); const { showToast } = useToast();
  const [query, setQuery] = useState(''); const [severity, setSeverity] = useState('ALL'); const [liveFindings, setLiveFindings] = useState([]);
  useEffect(() => { if (!isDemo) scanService.latestResults(projectId).then(setLiveFindings).catch(() => setLiveFindings([])); }, [projectId, isDemo]);
  const source = isDemo ? DEMO_FINDINGS : liveFindings;
  const findings = useMemo(() => source.filter((item) => (severity === 'ALL' || (item.severity || item.sev) === severity) && `${item.type || item.issueType} ${item.location || item.loc} ${item.severity || item.sev} ${item.affected || item.affectedRows}`.toLowerCase().includes(query.toLowerCase())), [source, query, severity]);
  useEffect(() => { setCurrentFindings(source); }, [source, setCurrentFindings]);
  async function runScan() {
    try {
      const scan = await scanService.start(projectId, { demo: isDemo });
      showToast(isDemo ? 'Sample scan preview queued. No database was scanned.' : `Scan accepted by backend (${scan.id || 'pending'}).`);
    } catch (e) { showToast(e.response?.data?.message || 'Scan could not be started.', 'error'); }
  }
  return <>
    <div className="section-head"><div><h1>Integrity Analysis</h1><p className="mute">Review orphan records, broken references and duplicate findings.</p></div>{hasPermission('scan.start') && <button className="pri" onClick={runScan}>Run scan</button>}</div>
    <div className="toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search findings" aria-label="Search findings" /><select className="filter-select" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Filter by severity"><option value="ALL">All severities</option>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => <option key={value}>{value}</option>)}</select></div>
    {findings.length ? <div className="g3 finding-grid">{findings.map((item) => <FindingCard key={item.id} finding={{ ...item, severity: item.severity || item.sev, location: item.location || item.loc, affected: item.affected || item.affectedRows, type: item.type || item.issueType }} selected={selectedFindingId === item.id} onClick={() => setSelectedFindingId(item.id)} />)}</div> : <div className="gl empty-state">{isDemo ? 'No findings match these filters.' : 'No scan results are available for this project yet.'}</div>}
    {isDemo && <p className="demo-label">These are sample findings. No database scan has been performed.</p>}
  </>;
}
