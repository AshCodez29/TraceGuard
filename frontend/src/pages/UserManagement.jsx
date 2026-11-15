import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_USERS } from '../services/demoData.js';
import { userService } from '../services/userService.js';

export default function UserManagement() {
  const { hasPermission, isDemo } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState(() => structuredClone(isDemo ? DEMO_USERS : []));
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('DEVELOPER');
  useEffect(() => { if (!isDemo) userService.list().then(setUsers).catch(() => showToast('Users could not be loaded.', 'error')); }, [isDemo, showToast]);
  if (!hasPermission('users.manage')) return <div className="gl empty-state">User management is restricted to Admins.</div>;

  async function addUser(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return showToast('Enter a username and email.', 'error');
    try {
      const user = { username: name.trim(), email: email.trim(), role, active: true };
      const saved = isDemo ? { ...user, id: `demo-${Date.now()}` } : await userService.create(user);
      setUsers((rows) => [...rows, saved]); setName(''); setEmail(''); showToast(isDemo ? 'Sample user added in this session.' : 'User created.');
    } catch (e) { showToast(e.response?.data?.message || 'Could not create user.', 'error'); }
  }
  async function update(index, patch) {
    const target = users[index];
    try {
      if (!isDemo) await userService.update(target.id, patch);
      setUsers((rows) => rows.map((item, i) => i === index ? { ...item, ...patch } : item));
      showToast(isDemo ? 'Sample user updated.' : 'User updated.');
    } catch (e) { showToast(e.response?.data?.message || 'Could not update user.', 'error'); }
  }

  return <><div className="page-heading-row"><div><h1>User Management</h1><p className="mute page-subtitle">Manage organization users and assign application roles.</p></div></div>
    <div className="gl card"><form className="toolbar" onSubmit={addUser}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username" aria-label="New username" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="New email" /><select className="filter-select" value={role} onChange={(e) => setRole(e.target.value)}><option>DEVELOPER</option><option>AUDITOR</option><option>ADMIN</option></select><button className="pri">Add user</button></form>
      <div className="table-scroll"><table className="admin-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((user, index) => <tr key={user.id || user.username}><td className="cell-primary">{user.username}</td><td>{user.email}</td><td><select className="filter-select" value={user.role} aria-label={`Role for ${user.username}`} onChange={(e) => update(index, { role: e.target.value })}><option>ADMIN</option><option>DEVELOPER</option><option>AUDITOR</option></select></td><td>{user.active ? 'Active' : 'Inactive'}</td><td><button onClick={() => update(index, { active: !user.active })}>{user.active ? 'Deactivate' : 'Reactivate'}</button></td></tr>)}</tbody></table></div>
    </div>
  </>;
}
