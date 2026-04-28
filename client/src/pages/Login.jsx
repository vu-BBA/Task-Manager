import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📅 DayFlow</div>
        <p className="auth-subtitle">Welcome back! Sign in to your planner.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email" required autoFocus
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={show ? 'text' : 'password'} required
                className="form-input"
                placeholder="••••••••"
                style={{ paddingRight: 44 }}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}>
            {loading ? <span className="spin" style={{ width:18, height:18, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', display:'inline-block' }} />
              : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one free</Link>
        </div>
        <div className="auth-link" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
