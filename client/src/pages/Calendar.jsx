import { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { taskAPI } from '../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Calendar() {
  const [current, setCurrent]   = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [allTasks, setAllTasks] = useState([]);
  const [dayTasks, setDayTasks] = useState([]);
  const [modal, setModal]       = useState({ open: false, task: null });

  useEffect(() => {
    taskAPI.getAll({ limit: 200 }).then(({ data }) => setAllTasks(data.tasks));
  }, []);

  useEffect(() => {
    const tasks = allTasks.filter(t => {
      const d = t.scheduledAt || t.deadline;
      return d && isSameDay(new Date(d), selected);
    });
    setDayTasks(tasks);
  }, [selected, allTasks]);

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = startOfMonth(current).getDay();

  const taskCountForDay = (day) =>
    allTasks.filter(t => {
      const d = t.scheduledAt || t.deadline;
      return d && isSameDay(new Date(d), day);
    }).length;

  const handleSaved = () => {
    taskAPI.getAll({ limit: 200 }).then(({ data }) => setAllTasks(data.tasks));
    setModal({ open: false, task: null });
  };

  return (
    <div className="page animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Calendar</h2>
          <p className="page-subtitle">View and manage tasks by date</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, task: null })}>
          <Plus size={16} /> New Task
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
        {/* Calendar Grid */}
        <div className="glass" style={{ overflow:'hidden' }}>
          {/* Month nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <button className="btn-icon" onClick={() => setCurrent(p => subMonths(p, 1))}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18 }}>
              {format(current, 'MMMM yyyy')}
            </span>
            <button className="btn-icon" onClick={() => setCurrent(p => addMonths(p, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 16px' }}>
            {DAYS.map(d => <div key={d} className="cal-header-day">{d}</div>)}
          </div>

          {/* Day cells */}
          <div className="calendar-grid">
            {/* Empty pads */}
            {Array(startPad).fill(null).map((_, i) => <div key={`p${i}`} />)}

            {days.map(day => {
              const count = taskCountForDay(day);
              return (
                <div
                  key={day}
                  className={`cal-day
                    ${isToday(day) ? 'today' : ''}
                    ${isSameDay(day, selected) ? 'selected' : ''}
                    ${!isSameMonth(day, current) ? 'other-month' : ''}
                    ${count > 0 ? 'has-tasks' : ''}
                  `}
                  onClick={() => setSelected(day)}
                  style={{ flexDirection:'column', gap:2 }}
                >
                  <span>{format(day, 'd')}</span>
                  {count > 0 && (
                    <span style={{ fontSize:9, color:'var(--pink)', fontWeight:700 }}>{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:16 }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--pink)', display:'inline-block' }} />
              Has tasks
            </span>
            <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }} />
              Today
            </span>
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="glass" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18 }}>
              {format(selected, 'EEEE')}
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:14 }}>{format(selected, 'MMMM d, yyyy')}</div>
          </div>
          <div className="divider" />

          {dayTasks.length === 0 ? (
            <div className="empty-state" style={{ padding:'20px 0' }}>
              <div className="empty-icon" style={{ fontSize:32 }}>📭</div>
              <div className="empty-title" style={{ fontSize:15 }}>No tasks</div>
              <div className="empty-desc">Nothing scheduled for this day.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {dayTasks.map(task => (
                <div key={task._id} style={{
                  padding:'12px 14px', borderRadius:'var(--radius-md)',
                  background:'var(--bg-glass)', border:'1px solid var(--border)',
                  borderLeft:`3px solid ${task.priority === 'urgent' ? '#f43f5e' : task.priority === 'high' ? '#f59e0b' : '#8b5cf6'}`,
                }}>
                  <div style={{ fontSize:14, fontWeight:500, marginBottom:6 }}>{task.title}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span className={`badge badge-${task.category}`}>{task.category}</span>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                    {task.scheduledAt && (
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                        🕐 {format(new Date(task.scheduledAt), 'h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }}
            onClick={() => setModal({ open: true, task: null })}>
            <Plus size={14} /> Add Task for {format(selected,'MMM d')}
          </button>
        </div>
      </div>

      {modal.open && (
        <TaskModal
          task={modal.task}
          defaultDate={selected}
          onClose={() => setModal({ open: false, task: null })}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
