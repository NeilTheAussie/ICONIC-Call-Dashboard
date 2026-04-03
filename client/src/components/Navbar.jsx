import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [];
  if (user.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin' });
    links.push({ to: '/manager', label: 'War Room' });
    links.push({ to: '/payments', label: 'Payments' });
  } else if (user.role === 'manager') {
    links.push({ to: '/manager', label: 'War Room' });
    links.push({ to: '/payments', label: 'Payments' });
  }

  return (
    <div className="bg-bg2/90 border-b border-bdr px-4 py-2.5 flex items-center justify-between backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-txtb">⚡ ICONIC</span>
        <div className="flex gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded transition-colors ${
                location.pathname === l.to ? 'bg-pur/15 text-pur' : 'text-txtd hover:text-txtb'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-txtd">{user.name} · {user.role}</span>
        <button onClick={logout} className="text-xs text-gry hover:text-red transition-colors">Logout</button>
      </div>
    </div>
  );
}
