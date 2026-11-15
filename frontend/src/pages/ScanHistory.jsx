import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { DEMO_HISTORY } from '../services/demoData.js';
import { scanService } from '../services/scanService.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ScanHistory() {
  const { accessibleProjects } = useProjects(); const { isDemo } = useAuth(); const { showToast } = useToast();
  const [liveHistory, setLiveHistory] = useState([]);
  useEffect(() => { if (!isDemo) scanService.history().then(setLiveHistory).catch(() => showToast('Scan history could not be loaded.', 'error')); }, [isDemo, showToast]);
  const ids = new Set(accessibleProjects.map((p) => p.id));
  const rows = (isDemo ? DEMO_HISTORY : liveHistory).filter((entry) => ids.has(entry.projectId));
  return <><h1>Scan History</h1><p className="mute page-subtitle">Completed and failed scans for projects you can access.</p>
    {rows.length ? <div className="gl card table-scroll"><table><thead><tr><th>Time</th><th>Project</th><th>Scan</th><th>Status</th><th>Findings</th></tr></thead><tbody>{rows.map((item, index) => <tr key={`${item.projectId}-${index}`}><td>{item.date}</td><td>{accessibleProjects.find((p) => p.id === item.projectId)?.name}</td><td>{item.scan}</td><td>{item.status}</td><td>{item.issues}</td></tr>)}</tbody></table></div> : <div className="gl empty-state">No scan history is available.</div>}
    {isDemo && <p className="demo-label">History rows are samples, not records of scans performed by this app.</p>}
  </>;
}
