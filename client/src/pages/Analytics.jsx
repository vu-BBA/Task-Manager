import { useState, useEffect } from 'react';
import { analyticsAPI, mlAPI } from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const CAT_COLORS = {
  study:'#6366f1', work:'#8b5cf6', health:'#10b981', personal:'#ec4899', other:'#64748b'
};

export default function Analytics() {
  const [overview, setOverview]     = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [weekly, setWeekly]         = useState([]);
  const [priority, setPriority]     = useState([]);
  const [prodHours, setProdHours]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, cat, wk, pri, ph] = await Promise.all([
          analyticsAPI.overview(),
          analyticsAPI.byCategory(),
          analyticsAPI.weekly(),
          analyticsAPI.priority(),
          mlAPI.productiveHours(),
        ]);
        setOverview(ov.data);
        setByCategory(cat.data.data);
        setWeekly(wk.data.data);
        setPriority(pri.data.data);
        setProdHours(ph.data.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="page">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:300 }} />)}
      </div>
    </div>
  );

  /* ── Chart configs ── */
  const categoryChart = {
    labels: byCategory.map(d => d._id),
    datasets: [
      { label: 'Total', data: byCategory.map(d => d.total),
        backgroundColor: byCategory.map(d => `${CAT_COLORS[d._id] || '#64748b'}66`),
        borderColor: byCategory.map(d => CAT_COLORS[d._id] || '#64748b'),
        borderWidth: 2, borderRadius: 6 },
      { label: 'Completed', data: byCategory.map(d => d.completed),
        backgroundColor: byCategory.map(d => CAT_COLORS[d._id] || '#64748b'),
        borderWidth: 0, borderRadius: 6 },
    ],
  };

  const weeklyChart = {
    labels: weekly.map(d => d.week),
    datasets: [
      { label: 'Completion Rate (%)', data: weekly.map(d => d.rate),
        borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)',
        fill: true, tension: 0.4, pointBackgroundColor: '#8b5cf6', pointRadius: 5 },
    ],
  };

  const priorityChart = {
    labels: priority.map(d => d._id),
    datasets: [{
      data: priority.map(d => d.count),
      backgroundColor: ['#f43f5e', '#f59e0b', '#8b5cf6', '#64748b'],
      borderColor: '#13131f', borderWidth: 3,
    }],
  };

  const hoursChart = {
    labels: prodHours.map(d => `${d.hour}:00`),
    datasets: [{
      label: 'Tasks Completed',
      data: prodHours.map(d => d.count),
      backgroundColor: prodHours.map(d =>
        d.count === Math.max(...prodHours.map(h => h.count)) ? '#8b5cf6' : 'rgba(139,92,246,0.3)'
      ),
      borderRadius: 4,
    }],
  };

  const STATS = overview ? [
    { label: 'Total Tasks',       value: overview.total,            color: '#8b5cf6', icon: '📋' },
    { label: 'Completed',         value: overview.completed,        color: '#10b981', icon: '✅' },
    { label: 'Completion Rate',   value: `${overview.completionRate}%`, color: '#f59e0b', icon: '📈' },
    { label: 'Overdue',           value: overview.overdue,          color: '#f43f5e', icon: '⚠️' },
  ] : [];

  return (
    <div className="page animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">Your productivity insights at a glance</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Weekly Trend */}
        <div className="glass chart-container">
          <div className="chart-header">
            <div className="chart-title">📈 Weekly Completion Rate</div>
          </div>
          <div style={{ height: 240 }}>
            <Line data={weeklyChart} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass chart-container">
          <div className="chart-header">
            <div className="chart-title">📊 Tasks by Category</div>
          </div>
          <div style={{ height: 240 }}>
            <Bar data={categoryChart} options={{ ...CHART_DEFAULTS, scales: { x: CHART_DEFAULTS.scales.x, y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true } } }} />
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass chart-container">
          <div className="chart-header">
            <div className="chart-title">🎯 Priority Distribution</div>
          </div>
          <div style={{ height: 240, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width: 220, height: 220 }}>
              <Doughnut data={priorityChart} options={{ ...CHART_DEFAULTS, scales: undefined,
                cutout: '65%', plugins: { legend: { position: 'right', labels: { color:'#94a3b8', padding:12 } } } }} />
            </div>
          </div>
        </div>

        {/* Productive Hours */}
        <div className="glass chart-container">
          <div className="chart-header">
            <div className="chart-title">⚡ Most Productive Hours</div>
            <span style={{ fontSize:11, color:'var(--accent-light)', background:'rgba(139,92,246,0.15)', padding:'2px 8px', borderRadius:'99px' }}>ML Insight</span>
          </div>
          <div style={{ height: 240 }}>
            <Bar data={hoursChart} options={{ ...CHART_DEFAULTS,
              plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
              scales: { x: CHART_DEFAULTS.scales.x, y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true } }
            }} />
          </div>
        </div>
      </div>

      {/* Category Detail Table */}
      {byCategory.length > 0 && (
        <div className="glass" style={{ overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <div className="chart-title">📋 Category Summary</div>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Category','Total','Completed','Completion Rate','Total Time'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:12, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCategory.map(row => (
                  <tr key={row._id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'12px 20px' }}><span className={`badge badge-${row._id}`}>{row._id}</span></td>
                    <td style={{ padding:'12px 20px', fontWeight:600 }}>{row.total}</td>
                    <td style={{ padding:'12px 20px', color:'var(--emerald)' }}>{row.completed}</td>
                    <td style={{ padding:'12px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="progress-bar" style={{ flex:1 }}>
                          <div className="progress-fill" style={{ width:`${row.total > 0 ? Math.round((row.completed/row.total)*100) : 0}%` }} />
                        </div>
                        <span style={{ fontSize:13, minWidth:36, color:'var(--text-secondary)' }}>
                          {row.total > 0 ? Math.round((row.completed/row.total)*100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 20px', color:'var(--text-secondary)' }}>{Math.round(row.totalMins / 60 * 10) / 10}h</td>
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
