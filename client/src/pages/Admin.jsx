import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Activity, BarChart3, ShieldCheck, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Admin() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('stats');

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.stats();
      setStats(data);
    } catch { toast.error('Failed to load stats'); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.users({ search });
      setUsers(data.users); setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); loadUsers(); }, []);
  useEffect(() => { if(tab === 'users') loadUsers(); }, [search, tab]);

  const handleToggle = async (id) => {
    try {
      const { data } = await adminAPI.toggleUser(id);
      setUsers(p => p.map(u => u._id === id ? data.user : u));
      toast.success(data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user and ALL their data? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const STAT_CARDS = stats ? [
    { icon:'👥', label:'Total Users',     value: stats.totalUsers,     color:'#8b5cf6' },
    { icon:'🟢', label:'Active (7 days)', value: stats.activeUsers,    color:'#10b981' },
    { icon:'📋', label:'Total Tasks',     value: stats.totalTasks,     color:'#6366f1' },
    { icon:'✅', label:'Tasks Completed', value: stats.completedTasks, color:'#f59e0b' },
  ] : [];

  return (
    <div className="page animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Panel</h2>
          <p className="page-subtitle">System management and monitoring</p>
        </div>
        <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--accent-light)',
          background:'rgba(139,92,246,0.15)', padding:'6px 14px', borderRadius:'99px' }}>
          <ShieldCheck size={14} /> Admin Access
        </span>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ width:'fit-content' }}>
        {[{ id:'stats', label:'📊 Overview' },{ id:'users', label:'👥 Users' }].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {tab === 'stats' && (
        <>
          <div className="stats-grid">
            {STAT_CARDS.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {stats?.categoryDist?.length > 0 && (
            <div className="glass" style={{ overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600 }}>📊 Task Distribution by Category (All Users)</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:16, padding:20 }}>
                {stats.categoryDist.map(c => (
                  <div key={c._id} style={{ textAlign:'center', padding:16, background:'var(--bg-glass)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:26, fontWeight:800, color:'var(--accent-light)' }}>{c.count}</div>
                    <span className={`badge badge-${c._id}`} style={{ marginTop:6 }}>{c._id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="glass" style={{ overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:600 }}>All Users ({total})</div>
            <div className="search-bar" style={{ width:260 }}>
              <Search size={14} style={{ color:'var(--text-muted)' }} />
              <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['User','Role','Status','Joined','Last Login','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:12, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'12px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar" style={{ width:32, height:32, fontSize:13 }}>{u.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight:500 }}>{u.name}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:'99px', fontWeight:700, textTransform:'uppercase',
                        background: u.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.2)',
                        color: u.role === 'admin' ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:'99px', fontWeight:700,
                        background: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                        color: u.isActive ? '#34d399' : '#fb7185' }}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 20px', color:'var(--text-secondary)', fontSize:13 }}>
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding:'12px 20px', color:'var(--text-secondary)', fontSize:13 }}>
                      {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td style={{ padding:'12px 20px' }}>
                      {u.role !== 'admin' && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn-icon" onClick={() => handleToggle(u._id)} title={u.isActive ? 'Disable' : 'Enable'}
                            style={{ color: u.isActive ? 'var(--emerald)' : 'var(--rose)' }}>
                            {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button className="btn-icon btn-danger" onClick={() => handleDelete(u._id)} title="Delete user">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
