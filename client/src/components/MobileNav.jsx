import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3,
  Plus,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { to: '/calendar',  icon: Calendar,    label: 'Cal' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard />
        Home
      </NavLink>
      
      <NavLink 
        to="/tasks" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <CheckSquare />
        Tasks
      </NavLink>
      
      <NavLink 
        to="/calendar" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <Calendar />
        Cal
      </NavLink>
      
      <NavLink 
        to="/analytics" 
        className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
      >
        <BarChart3 />
        Stats
      </NavLink>
    </nav>
  );
}