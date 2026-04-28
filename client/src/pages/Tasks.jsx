import { useState, useEffect, useCallback } from 'react';
import { useTask } from '../context/TaskContext';
import { Plus, Search, Trash2, Edit2, CheckCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'study', 'work', 'health', 'personal', 'other'];
const PRIORITIES  = ['all', 'urgent', 'high', 'medium', 'low'];
const STATUSES    = ['all', 'pending', 'in-progress', 'completed', 'cancelled'];

export default function Tasks() {
  const { tasks, loading, total, fetchTasks, deleteTask, completeTask } = useTask();
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [status, setStatus]     = useState('all');
  const [modal, setModal]       = useState({ open: false, task: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, taskId: null, type: '' });

  const load = useCallback(() => {
    const params = {};
    if (search)              params.search   = search;
    if (category !== 'all')  params.category = category;
    if (priority !== 'all')  params.priority = priority;
    if (status   !== 'all')  params.status   = status;
    fetchTasks(params);
  }, [search, category, priority, status, fetchTasks]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    const task = tasks.find(t => t._id === id);
    setConfirmModal({ open: true, taskId: id, taskTitle: task?.title, type: 'delete' });
  };

  const confirmDelete = async () => {
    await deleteTask(confirmModal.taskId);
  };

  const handleComplete = async (id) => {
    const task = tasks.find(t => t._id === id);
    setConfirmModal({ open: true, taskId: id, taskTitle: task?.title, type: 'complete' });
  };

  const confirmComplete = async () => {
    await completeTask(confirmModal.taskId);
  };

  return (
    <div className="page animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">My Tasks</h2>
          <p className="page-subtitle">{total} tasks total</p>
        </div>
        <button id="add-task-btn" className="btn btn-primary" onClick={() => setModal({ open: true, task: null })}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div className="search-bar">
          <Search size={16} style={{ color:'var(--text-muted)', flexShrink:0 }} />
          <input
            id="task-search"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <Filter size={14} style={{ color:'var(--text-muted)' }} />
          {CATEGORIES.map(c => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {PRIORITIES.map(p => (
            <button key={p} className={`chip ${priority === p ? 'active' : ''}`} onClick={() => setPriority(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <div className="divider" style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }} />
          {STATUSES.map(s => (
            <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:72 }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">Try changing your filters or create a new task.</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, task: null })}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {tasks.map(task => (
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
                {task.description && (
                  <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:6 }}>{task.description}</div>
                )}
                <div className="task-meta">
                  <span className={`badge badge-${task.category}`}>{task.category}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  {task.deadline && (
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                      📅 {format(new Date(task.deadline), 'MMM d, h:mm a')}
                    </span>
                  )}
                  {task.duration && (
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>⏱ {task.duration}m</span>
                  )}
                  {task.isRecurring && <span style={{ fontSize:12, color:'var(--cyan)' }}>🔁 Recurring</span>}
                </div>
              </div>
              <div className="task-actions">
                <button className="btn-icon" onClick={() => setModal({ open: true, task })} title="Edit">
                  <Edit2 size={14} />
                </button>
                {task.status !== 'completed' && (
                  <button className="btn-icon" style={{ color:'var(--emerald)' }} onClick={() => handleComplete(task._id)} title="Complete">
                    <CheckCircle size={14} />
                  </button>
                )}
                <button className="btn-icon btn-danger" onClick={() => handleDelete(task._id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {modal.open && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal({ open: false, task: null })}
          onSaved={load}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, taskId: null, type: '' })}
          onConfirm={confirmModal.type === 'delete' ? confirmDelete : confirmComplete}
          title={confirmModal.type === 'delete' ? 'Delete Task' : 'Complete Task'}
          message={confirmModal.type === 'delete' 
            ? `Are you sure you want to delete "${confirmModal.taskTitle}"? This action cannot be undone.` 
            : `Mark "${confirmModal.taskTitle}" as completed?`}
          confirmText={confirmModal.type === 'delete' ? 'Yes, Delete' : 'Yes, Complete'}
          cancelText="Cancel"
          type={confirmModal.type === 'delete' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
}
