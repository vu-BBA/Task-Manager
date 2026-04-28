import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULTS = {
  title: '', description: '', category: 'work', priority: 'medium',
  status: 'pending', energyLevel: 'medium', duration: 30,
  deadline: '', scheduledAt: '', reminderAt: '',
  tags: [], isRecurring: false,
  recurrencePattern: { frequency: 'daily', days: [], time: '' },
};

const fmt = (d) => d ? format(new Date(d), "yyyy-MM-dd'T'HH:mm") : '';

export default function TaskModal({ task, onClose, onSaved, defaultDate }) {
  const { createTask, updateTask } = useTask();
  const { user } = useAuth();
  const editing = !!task;

  const defaultScheduled = defaultDate
    ? format(defaultDate, "yyyy-MM-dd'T'09:00")
    : fmt(task?.scheduledAt);

  const [form, setForm] = useState({
    ...DEFAULTS,
    ...(task || {}),
    deadline:    fmt(task?.deadline),
    scheduledAt: defaultScheduled,
    reminderAt:  fmt(task?.reminderAt),
    tags:        task?.tags || [],
    recurrencePattern: task?.recurrencePattern || DEFAULTS.recurrencePattern,
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving]     = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const removeTag = (t) => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        deadline:    form.deadline    || undefined,
        scheduledAt: form.scheduledAt || undefined,
        reminderAt:  form.reminderAt  || undefined,
      };
      if (editing) await updateTask(task._id, payload);
      else         await createTask(payload);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editing ? '✏️ Edit Task' : '➕ New Task'}</div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input id="task-title-input" autoFocus className="form-input" value={form.title}
                onChange={set('title')} placeholder="What needs to be done?" required />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set('description')}
                placeholder="Optional details…" rows={2} />
            </div>

            {/* Category + Priority */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>
                  {['study','work','health','personal','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Energy Level</label>
                <select className="form-select" value={form.energyLevel} onChange={set('energyLevel')}>
                  {['low','medium','high'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            {/* Scheduled + Deadline */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">📅 Scheduled At</label>
                <input type="datetime-local" className="form-input" value={form.scheduledAt} onChange={set('scheduledAt')} />
              </div>
              <div className="form-group">
                <label className="form-label">⏰ Deadline</label>
                <input type="datetime-local" className="form-input" value={form.deadline} onChange={set('deadline')} />
              </div>
            </div>

            {/* Duration + Reminder */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" min={5} max={480} className="form-input" value={form.duration} onChange={set('duration')} />
              </div>
              <div className="form-group">
                <label className="form-label">🔔 Reminder At</label>
                <input type="datetime-local" className="form-input" value={form.reminderAt} onChange={set('reminderAt')} />
              </div>
            </div>

            {/* Status (only when editing) */}
            {editing && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {['pending','in-progress','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="form-input" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  placeholder="Add tag…" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                  <Plus size={13} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{
                      padding:'3px 10px', borderRadius:'99px', fontSize:12, fontWeight:500,
                      background:'rgba(139,92,246,0.15)', color:'var(--accent-light)',
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', lineHeight:1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recurring Toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
              background:'var(--bg-glass)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
              <input type="checkbox" id="isRecurring" checked={form.isRecurring} onChange={set('isRecurring')}
                style={{ width:16, height:16, accentColor:'var(--accent)', cursor:'pointer' }} />
              <label htmlFor="isRecurring" style={{ cursor:'pointer', fontSize:14, fontWeight:500 }}>
                🔁 Recurring Task
              </label>
              {form.isRecurring && (
                <select className="form-select" value={form.recurrencePattern?.frequency}
                  style={{ marginLeft:'auto', width:'auto' }}
                  onChange={e => setForm(p => ({ ...p, recurrencePattern: { ...p.recurrencePattern, frequency: e.target.value } }))}>
                  {['daily','weekly','monthly'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-task-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <span className="spin" style={{ width:15, height:15, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', display:'inline-block' }} />
                : editing ? '💾 Save Changes' : '✅ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
