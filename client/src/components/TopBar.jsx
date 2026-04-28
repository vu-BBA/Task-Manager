import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks':     'My Tasks',
  '/calendar':  'Calendar',
  '/analytics': 'Analytics',
  '/templates': 'Templates',
  '/profile':   'Profile & Settings',
  '/admin':     'Admin Panel',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const title = PAGE_TITLES[pathname] || 'DayFlow';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{title}</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </span>
      </div>
      <div className="topbar-right">
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="avatar" style={{ cursor: 'default' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
