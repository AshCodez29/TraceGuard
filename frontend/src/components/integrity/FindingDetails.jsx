import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { DEMO_FINDINGS } from '../../services/demoData.js';
import SeverityBadge from './SeverityBadge.jsx';

export default function FindingDetails() {
  const { user, hasPermission, isDemo } = useAuth();
  const { selectedFindingId, findingStates, updateFindingState, currentFindings } = useWorkspace();
  const { showToast } = useToast();
  const raw = currentFindings.find((item) => item.id === selectedFindingId) || currentFindings[0];
  const explanation = raw
    ? Array.isArray(raw.explanation) ? raw.explanation
      : raw.explanation ? [raw.explanation]
        : raw.explanationText ? [raw.explanationText] : ['No explanation is available.']
    : [];
  const evidence = raw
    ? Array.isArray(raw.evidence) ? raw.evidence
      : Array.isArray(raw.samples) ? raw.samples
        : raw.evidence && typeof raw.evidence === 'object' ? [raw.evidence] : []
    : [];
  const evidenceRows = evidence.map((row) => Array.isArray(row) ? row : Object.values(row || {}));
  const evidenceColumns = raw?.columns || (evidenceRows[0] || []).map((_, index) => `Column ${index + 1}`);
  const finding = raw && ({
    ...raw,
    severity: raw.severity || raw.sev || 'MEDIUM', type: raw.type || raw.issueType || 'Integrity issue',
    location: raw.location || [raw.tableName, raw.columnName].filter(Boolean).join('.') || raw.loc || 'Unknown location',
    affected: raw.affected || raw.affectedRows || '—', fix: raw.fix || 'Review and correct the affected records.',
    confidence: raw.confidence || '—', explanation,
    evidence: evidenceRows, columns: evidenceColumns, isLink: raw.isLink || false,
  });
  if (!finding) return <div className="empty-state">Select a finding to view its details.</div>;
  const state = findingStates[finding.id] || { status: 'Proposed', step: 0 };
  const act = (nextStatus, nextStep) => {
    updateFindingState(finding.id, { status: nextStatus, step: nextStep });
    showToast(isDemo ? 'Sample workflow updated. No customer database was changed.' : 'Action submitted to the backend.');
  };

  return <>
    <div className="finding-detail-head"><SeverityBadge severity={finding.severity} /><span className="chip" style={{ color: 'var(--p)' }}>{state.status}</span></div>
    <h2>{finding.type}</h2><code>{finding.location}</code>
    <p className="mute detail-affected">{finding.affected} affected</p>
    <h3>Why it occurred</h3><ul className="tl">{finding.explanation.map((line) => <li key={line}>{line}</li>)}</ul>
    <h3>Evidence</h3>{finding.evidence.length ? <div className="table-scroll"><table><thead><tr>{finding.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{finding.evidence.map((row, i) => <tr key={i}>{row.map((value, j) => <td className="m" key={`${i}-${j}`}>{String(value ?? '—')}</td>)}</tr>)}</tbody></table></div> : <p className="mute">No evidence records are attached.</p>}
    <h3>Proposed fix</h3><div className="box"><p style={{ margin: 0 }}>{finding.fix}</p><p className="mute" style={{ margin: '6px 0 0' }}>Confidence {finding.confidence}</p></div>
    {user.role === 'AUDITOR' ? <div className="readonly-note">Read-only review. Remediation controls are unavailable to Auditors.</div> : <div className="remediation">
      <h3>Remediation workflow</h3>
      <ol className="steps"><li className={state.step >= 1 ? 'done' : 'now'}>Propose</li>{user.role === 'ADMIN' && <li className={state.step >= 2 ? 'done' : state.step === 1 ? 'now' : ''}>Approve</li>}<li className={state.step >= 2 ? 'done' : state.step === 1 ? 'now' : ''}>Dry run</li><li>Apply</li><li>Verify</li></ol>
      {user.role === 'DEVELOPER' && hasPermission('fix.propose') && state.step === 0 && <button className="pri" onClick={() => act('Proposed', 1)}>Propose fix</button>}
      {user.role === 'ADMIN' && hasPermission('fix.approve') && state.step === 1 && <button className="pri" onClick={() => act('Approved', 2)}>Approve proposal</button>}
      {hasPermission('fix.dryRun') && state.step >= (user.role === 'ADMIN' ? 2 : 1) && state.status !== 'Dry run previewed' && <button className="pri" onClick={() => act('Dry run previewed', state.step + 1)}>Preview dry run</button>}
      <button disabled title="A real audited backend workflow is required before applying changes">Apply (backend required)</button>
      {state.status === 'Dry run previewed' && <div className="box">Sample dry run preview only. No customer data was read or changed.</div>}
    </div>}
  </>;
}
