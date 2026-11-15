import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjects } from '../context/ProjectContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_REPORTS } from '../services/demoData.js';
import { reportService } from '../services/reportService.js';

export default function Reports() {
  const { hasPermission, isDemo } = useAuth(); const { accessibleProjects } = useProjects(); const { showToast } = useToast();
  const [reports, setReports] = useState(() => isDemo ? structuredClone(DEMO_REPORTS) : []);
  useEffect(() => { if (!isDemo) reportService.list().then(setReports).catch(() => showToast('Reports could not be loaded.', 'error')); }, [isDemo, showToast]);
  const projectIds = new Set(accessibleProjects.map((p) => p.id)); const visible = reports.filter((item) => !item.projectId || projectIds.has(item.projectId));
  async function generate() {
    if (isDemo) return showToast('Sample report preview only; no PDF was generated.');
    try { await reportService.generate(accessibleProjects[0]?.id); showToast('Report generation requested.'); } catch (e) { showToast(e.response?.data?.message || 'Report could not be generated.', 'error'); }
  }
  async function download(report) {
    if (isDemo) return showToast('Sample report shown; no PDF file is available to download.');
    try { const blob = await reportService.download(report.id); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${report.title || 'traceguard-report'}.pdf`; link.click(); URL.revokeObjectURL(url); } catch { showToast('Report download failed.', 'error'); }
  }
  return <><div className="page-heading-row"><div><h1>Reports</h1><p className="mute page-subtitle">Review existing reports and export authorized analysis.</p></div>{hasPermission('reports.generate') && <button className="pri" onClick={generate}>Generate report</button>}</div>
    {visible.length ? <div className="g3">{visible.map((report) => <article className="gl card report-card" key={report.id}><h2>{report.title}</h2><p className="mute">{report.date} · {report.findings} findings</p><button className="pri" onClick={() => download(report)}>Download PDF</button></article>)}</div> : <div className="gl empty-state">No existing reports are available.</div>}
    {isDemo && <p className="demo-label">Report actions use sample data and do not generate or download a real PDF.</p>}
  </>;
}
