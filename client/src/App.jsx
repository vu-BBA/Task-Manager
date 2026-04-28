import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout   from './components/AppLayout';
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Tasks       from './pages/Tasks';
import Calendar    from './pages/Calendar';
import Analytics   from './pages/Analytics';
import Templates   from './pages/Templates';
import Profile     from './pages/Profile';
import Admin       from './pages/Admin';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #8b5cf6', borderTopColor:'transparent' }} className="spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<Landing />} />
      <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"element={<PublicRoute><Register /></PublicRoute>} />

      {/* Private — with sidebar layout */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks"     element={<Tasks />} />
        <Route path="/calendar"  element={<Calendar />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
