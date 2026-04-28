import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6)      return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Let\'s plan your day 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📅 DayFlow</div>
        <p className="auth-subtitle">Create your free account and start planning smarter.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" required autoFocus className="form-input"
              placeholder="Jane Doe" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" required className="form-input"
              placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="reg-password" type={show ? 'text' : 'password'} required className="form-input"
                placeholder="Min. 6 characters" style={{ paddingRight: 44 }}
                value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                {show ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="reg-confirm" type="password" required className="form-input"
              placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary" disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:15 }}>
            {loading
              ? <span className="spin" style={{ width:18, height:18, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', display:'inline-block' }} />
              : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
        <div className="auth-link" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
