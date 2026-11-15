import { useAuth } from '../../context/AuthContext.jsx';

export default function StatusBar() {
  const { user, isDemo } = useAuth();
  return <footer className="status"><span>{user?.role}</span><span>{user?.organization || 'Northwind Labs'}</span><span className="sp" />
    <span>{isDemo ? 'Sample data · no live database scan' : 'Backend authorization required'}</span>
  </footer>;
}
