import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import ProfileMenu from './ProfileMenu.jsx';

export default function Header() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  return <header className="top">
    <Logo />
    <span className="mute top-crumb">{user?.organization || 'Northwind Labs'}</span>
    <span className="sp" />
    {hasPermission('projects.create') && <button onClick={() => navigate('/projects/new')}>+ New project</button>}
    <ProfileMenu />
  </header>;
}
