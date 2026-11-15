import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
  const { hasPermission } = useAuth(); const { showToast } = useToast();
  if (!hasPermission('settings.manage')) return <div className="gl empty-state">Global settings are restricted to Admins.</div>;
  return <><h1>Settings</h1><p className="mute page-subtitle">Application-wide configuration for Northwind Labs.</p><div className="g2">
    <section className="gl card"><h2>Organization</h2><p className="mute">Northwind Labs</p><button onClick={() => showToast('Organization settings are not connected to the backend.')}>Edit organization</button></section>
    <section className="gl card"><h2>Security</h2><p className="mute">Session policy, allowed target hosts and audit controls.</p><button onClick={() => showToast('Security settings are not connected to the backend.')}>Review settings</button></section>
  </div></>;
}
