import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { isDemoPreview, useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/common/Logo.jsx';

export default function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('priya');
  const [password, setPassword] = useState('');
  const [previewRole, setPreviewRole] = useState('DEVELOPER');
  const [error, setError] = useState('');
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  async function submit(event) {
    event.preventDefault(); setError('');
    try { await login({ username, password }, previewRole); navigate('/dashboard', { replace: true }); }
    catch (e) { setError(isDemoPreview ? e.message : e.response?.data?.message || 'Sign-in service unavailable. Start the backend or open a development preview.'); }
  }

  return <section id="login"><div className="login-wrap">
    <form className="gl login-form" onSubmit={submit}>
      <Logo /><p className="mute login-tagline">Database integrity, traceability and security analysis.</p>
      <label className="f" htmlFor="username">Username</label>
      <input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <label className="f" htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <div className="err" role="alert">{error}</div>}
      {isDemoPreview && <p className="mute login-hint">Preview mode: enter any password to open the sample data.</p>}
      <button className="pri login-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    {isDemoPreview && <details className="dev-preview" open>
      <summary>Development preview · role switcher</summary>
      <label className="f" htmlFor="preview-role">Preview role</label>
      <select id="preview-role" value={previewRole} onChange={(e) => setPreviewRole(e.target.value)}>
        <option>DEVELOPER</option><option>ADMIN</option><option>AUDITOR</option>
      </select>
      <p className="mute">Development only. Production roles are read from the authenticated backend response.</p>
    </details>}
  </div></section>;
}
