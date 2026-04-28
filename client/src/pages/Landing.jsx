import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🧠', title: 'Smart Scheduling', desc: 'ML engine scores and orders tasks by priority, urgency, and your energy level — so you always work on what matters most.' },
  { icon: '🔁', title: 'Recurring Detection', desc: 'Automatically detects your repeating tasks and suggests recurring patterns based on your history.' },
  { icon: '📊', title: 'Productivity Insights', desc: 'Beautiful charts show your completion rates, peak productive hours, and category time distribution.' },
  { icon: '📋', title: 'Task Templates', desc: 'Save your daily routines as templates and apply them with one click to any day.' },
  { icon: '⏰', title: 'Smart Reminders', desc: 'In-app and email reminders make sure deadlines never sneak up on you.' },
  { icon: '📅', title: 'Calendar View', desc: 'Visualize your full schedule by month or week with task density heatmaps built right in.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, background: 'rgba(13,13,26,0.85)',
        backdropFilter: 'blur(12px)', zIndex: 50,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent-light)' }}>
          📅 DayFlow
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">✨ AI-Powered Project Tracking</div>
        <h1 className="hero-title">
          Plan smarter.<br />
          <span className="gradient-text">Flow better.</span>
        </h1>
        <p className="hero-desc">
          DayFlow is your intelligent daily planner that learns your habits, predicts recurring tasks,
          and suggests the optimal order to tackle your day — all in one beautiful interface.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: 16 }}>
            🚀 Start Planning Free
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 16 }}>
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 40, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Smart ML', 'Task ordering'], ['Auto-detect', 'Recurring tasks'], ['Real-time', 'Insights']].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent-light)' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <h2 style={{
          textAlign: 'center', fontFamily: 'var(--font-display)',
          fontSize: 32, fontWeight: 800, marginBottom: 40, padding: '0 24px',
        }}>
          Everything you need to <span style={{ color: 'var(--accent-light)' }}>own your day</span>
        </h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        margin: '0 24px 80px', borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))',
        border: '1px solid rgba(139,92,246,0.3)', padding: '48px 32px',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>
          Ready to transform your productivity?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
          Join thousands of users who plan smarter with DayFlow.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
          🎯 Start for Free — No credit card required
        </Link>
      </section>

      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
        © 2025 BBA DayFlow — Personalized Daily Planner
      </footer>
    </div>
  );
}
