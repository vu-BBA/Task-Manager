import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, analyticsAPI, mlAPI } from '../services/api';
import { format, isToday } from 'date-fns';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  study:'#6366f1', work:'#2c0092', health:'#10b981', personal:'#e70576', other:'#64748b'
};
const PRIORITY_COLOR = { urgent:'#f43f5e', high:'#f59e0b', medium:'#8b5cf6', low:'#64748b' };

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview]     = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [recurring, setRecurring]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, taskId: null, taskTitle: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, today, sugg, rec] = await Promise.all([
        analyticsAPI.overview(),
        taskAPI.getToday(),
        mlAPI.suggestions(),
        mlAPI.recurring(),
      ]);
      setOverview(ov.data);
      setTodayTasks(today.data.tasks);
      setSuggestions(sugg.data.suggestions.slice(0, 5));
      setRecurring(rec.data.recurring.slice(0, 3));
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleComplete = async (id) => {
    const task = todayTasks.find(t => t._id === id);
    setConfirmModal({ open: true, taskId: id, taskTitle: task?.title });
  };

  const confirmComplete = async () => {
    try {
      await taskAPI.complete(confirmModal.taskId);
      setTodayTasks(p => p.map(t => t._id === confirmModal.taskId ? { ...t, status: 'completed', completedAt: new Date() } : t));
      toast.success('✅ Task completed!');
    } catch { toast.error('Failed'); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const STATS = overview ? [
    { icon: '✅', label: 'Completed Today',   value: overview.todayDone,       color: '#10b981' },
    { icon: '📋', label: 'Today\'s Tasks',     value: overview.todayTotal,      color: '#8b5cf6' },
    { icon: '📉', label: 'Overdue',            value: overview.overdue,         color: '#f43f5e' },
    { icon: '🔥', label: 'Completion Rate',    value: `${overview.completionRate}%`, color: '#f59e0b' },
  ] : [];

  return (
    <div className="page animate-fade">
      {/* Welcome */}
      <div className="welcome-banner">
        <div>
          <div className="welcome-time">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
          <div className="welcome-name">{greeting}, {user?.name?.split(' ')[0]} 👋</div>
          <div className="welcome-sub">
            {overview?.todayTotal > 0
              ? `You have ${overview.todayTotal} tasks today — ${overview.todayDone} done!`
              : 'No tasks scheduled today. Add one to get started!'}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:100 }} />)}
        </div>
      ) : (
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Today's Tasks */}
        <div className="glass" style={{ padding:20 }}>
          <div className="chart-header">
            <div className="chart-title">📌 Today's Tasks</div>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{format(new Date(),'MMM d')}</span>
          </div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:56 }} />)}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="empty-state" style={{ padding:'30px 20px' }}>
              <div className="empty-icon">🎉</div>
              <div className="empty-title">All clear!</div>
              <div className="empty-desc">No tasks scheduled for today.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {todayTasks.map(task => (
                <div key={task._id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                  <div className={`priority-bar ${task.priority}`} />
                  <button
                    className={`task-check ${task.status === 'completed' ? 'checked' : ''}`}
                    onClick={() => task.status !== 'completed' && handleComplete(task._id)}
                  >
                    {task.status === 'completed' && <span style={{ fontSize:10, color:'#fff' }}>✓</span>}
                  </button>
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.category}`}>{task.category}</span>
                      {task.scheduledAt && (
                        <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                          <Clock size={11} /> {format(new Date(task.scheduledAt), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ML Suggestions */}
        <div className="glass" style={{ padding:20 }}>
          <div className="chart-header">
            <div className="chart-title"><Sparkles size={15} style={{ display:'inline', marginRight:6, color:'var(--accent-light)' }} />AI Suggestions</div>
            <span style={{ fontSize:11, color:'var(--accent-light)', background:'rgba(139,92,246,0.15)', padding:'2px 8px', borderRadius:'99px' }}>ML-Powered</span>
          </div>
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:64 }} />)}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="empty-state" style={{ padding:'30px 20px' }}>
              <div className="empty-icon">🤖</div>
              <div className="empty-title">No suggestions yet</div>
              <div className="empty-desc">Add more tasks to get AI recommendations.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {suggestions.map((task, i) => (
                <div key={task._id} className="suggestion-card">
                  <div className="suggestion-score">#{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</div>
                    <div style={{ display:'flex', gap:8, marginTop:4 }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-${task.category}`}>{task.category}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--accent-light)', fontWeight:700, minWidth:32, textAlign:'right' }}>
                    {Math.round(task.mlScore)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recurring Patterns */}
      {recurring.length > 0 && (
        <div className="glass" style={{ padding:20 }}>
          <div className="chart-header">
            <div className="chart-title">🔁 Detected Recurring Patterns</div>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Auto-detected from your history</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
            {recurring.map((r, i) => (
              <div key={i} style={{
                padding:'14px 16px', background:'var(--bg-glass)', borderRadius:'var(--radius-md)',
                border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6,
              }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.title}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span className={`badge badge-${r.category}`}>{r.category}</span>
                  {r.suggestedTime && (
                    <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                      <Clock size={11}/> {r.suggestedTime}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                  {r.occurrences}× in last 30 days · {r.confidence}% confidence
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.confidence}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Complete Modal */}
      {confirmModal.open && (
        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, taskId: null, taskTitle: '' })}
          onConfirm={confirmComplete}
          title="Complete Task"
          message={`Mark "${confirmModal.taskTitle}" as completed?`}
          confirmText="Yes, Complete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
