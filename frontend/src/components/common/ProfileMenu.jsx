import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return <div className="profile-wrap">
    <button className="profile-button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
      <span>{user.username}</span><span className={`chip role ${user.role}`}>{user.role}</span>
      <span className="profile-org">{user.organization || 'Northwind Labs'}</span><span aria-hidden="true">⌄</span>
    </button>
    {open && <div className="set gl" role="menu">
      <div className="set-head"><b>{user.username}</b><span className={`chip role ${user.role}`}>{user.role}</span></div>
      <p className="mute" style={{ margin: '5px 0 10px' }}>{user.organization || 'Northwind Labs'}</p>
      <button className="menu-action" onClick={() => { setOpen(false); logout(); }}>Sign out</button>
    </div>}
  </div>;
}
