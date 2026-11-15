import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { DEMO_SECURITY } from '../services/demoData.js';
import { securityService } from '../services/securityService.js';

export default function SecurityAnalysis() {
  const { projectId } = useParams(); const { isDemo } = useAuth();
  const [findings, setFindings] = useState(isDemo ? DEMO_SECURITY : []); const [error, setError] = useState('');
  useEffect(() => { if (isDemo) { setFindings(DEMO_SECURITY); return; } securityService.getFindings(projectId).then((data) => { setFindings(data); setError(''); }).catch(() => { setFindings([]); setError('Security analysis data could not be loaded.'); }); }, [projectId, isDemo]);
  return <><div className="section-head"><div><h1>Security Analysis</h1><p className="mute">Review query safety and schema constraints.</p></div></div>
    {error && <div className="box error-box">{error}</div>}
    {findings.map((finding) => <article className="gl card security-card" key={finding.id || finding.title}><div className="security-head"><span className={`chip ${(finding.severity || 'LOW').toUpperCase()}`}>{(finding.severity || 'LOW').toLowerCase()}</span><b>{finding.title || finding.type}</b><span className="mute m">{finding.location || finding.tableName}</span></div><div className="code"><b>{finding.code || finding.description}</b></div><p><span className="ok">Recommendation ·</span> {finding.recommendation || finding.fix || 'Review this finding.'}</p></article>)}
    {!error && !findings.length && <div className="gl empty-state">No security findings are available for this project.</div>}
    {isDemo && <p className="demo-label">Security findings are static sample data.</p>}
  </>;
}
