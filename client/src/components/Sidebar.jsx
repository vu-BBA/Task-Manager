import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart3,
  BookMarked, Settings, LogOut, ShieldCheck, Sparkles,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: CheckSquare,     label: 'My Tasks' },
  { to: '/calendar',  icon: Calendar,        label: 'Calendar' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/templates', icon: BookMarked,      label: 'Templates' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>📅</span> DayFlow
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <span className="nav-section-label" style={{ marginTop: 8 }}>Admin</span>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              Admin Panel
            </NavLink>
          </>
        )}

        <span className="nav-section-label" style={{ marginTop: 8 }}>Account</span>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          Profile & Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width:'100%' }} onClick={handleLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
