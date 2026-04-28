import { useState, useEffect } from 'react';
import { templateAPI } from '../services/api';
import { Plus, Trash2, Play, Edit2, BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ICONS = ['📋','💼','📚','🏃','🧘','🎯','⚡','🌅','🌙','💡','🔥','✨'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState({ open: false, tmpl: null });
  const [applying, setApplying] = useState(null);

  const load = async () => {
    try {
      const { data } = await templateAPI.getAll();
      setTemplates(data.templates);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await templateAPI.delete(id);
    setTemplates(p => p.filter(t => t._id !== id));
    toast.success('Template deleted');
  };

  const handleApply = async (id) => {
    setApplying(id);
    try {
      await templateAPI.apply(id, { startDate: new Date().toISOString() });
      toast.success('✅ Template applied! Tasks created for today.');
      load();
    } catch { toast.error('Failed to apply template'); }
    finally { setApplying(null); }
  };

  return (
    <div className="page animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Templates</h2>
          <p className="page-subtitle">Save and reuse your daily routines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, tmpl: null })}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:200 }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No templates yet</div>
          <div className="empty-desc">Create a template from your common daily routines to apply them quickly.</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, tmpl: null })}>
            <Plus size={14} /> Create Template
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16 }}>
          {templates.map(t => (
            <div key={t._id} className="glass" style={{ padding:20, display:'flex', flexDirection:'column', gap:14,
              borderTop:`3px solid ${t.color || '#8b5cf6'}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:28, marginBottom:6 }}>{t.icon || '📋'}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17 }}>{t.name}</div>
                  {t.description && <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>{t.description}</div>}
                </div>
                {t.isGlobal && (
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:'99px',
                    background:'rgba(16,185,129,0.15)', color:'#34d399', fontWeight:700 }}>GLOBAL</span>
                )}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <span className={`badge badge-${t.category}`}>{t.category}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                  📌 {t.tasks?.length || 0} tasks
                </span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                  🔁 Used {t.usageCount}×
                </span>
              </div>

              {/* Task preview */}
              {t.tasks?.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {t.tasks.slice(0,3).map((task, i) => (
                    <div key={i} style={{ fontSize:13, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background: t.color || '#8b5cf6', flexShrink:0 }} />
                      {task.title}
                      <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{task.duration}m</span>
                    </div>
                  ))}
                  {t.tasks.length > 3 && (
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>+{t.tasks.length - 3} more…</div>
                  )}
                </div>
              )}

              <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                <button className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }}
                  onClick={() => handleApply(t._id)} disabled={applying === t._id}>
                  {applying === t._id
                    ? <span className="spin" style={{ width:14, height:14, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', display:'inline-block' }} />
                    : <><Play size={13} /> Apply Today</>}
                </button>
                {!t.isGlobal && (
                  <>
                    <button className="btn-icon" onClick={() => setModal({ open: true, tmpl: t })} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(t._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && <TemplateModal tmpl={modal.tmpl} onClose={() => setModal({ open:false, tmpl:null })} onSaved={load} />}
    </div>
  );
}

/* ── Template Modal ── */
function TemplateModal({ tmpl, onClose, onSaved }) {
  const editing = !!tmpl;
  const [form, setForm] = useState({
    name: tmpl?.name || '',
    description: tmpl?.description || '',
    category: tmpl?.category || 'work',
    color: tmpl?.color || '#8b5cf6',
    icon: tmpl?.icon || '📋',
    tasks: tmpl?.tasks || [],
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const addTaskRow = () => setForm(p => ({
    ...p,
    tasks: [...p.tasks, { title:'', category: p.category, priority:'medium', duration:30, offsetMins:0 }]
  }));

  const removeTask = (i) => setForm(p => ({ ...p, tasks: p.tasks.filter((_, idx) => idx !== i) }));

  const updateTask = (i, key, val) => setForm(p => ({
    ...p,
    tasks: p.tasks.map((t, idx) => idx === i ? { ...t, [key]: val } : t)
  }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Template name required');
    setSaving(true);
    try {
      if (editing) await templateAPI.update(tmpl._id, form);
      else         await templateAPI.create(form);
      toast.success(editing ? 'Template updated!' : 'Template created!');
      onSaved();
      onClose();
    } catch { toast.error('Failed to save template'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:620 }}>
        <div className="modal-header">
          <div className="modal-title">{editing ? 'Edit Template' : 'New Template'}</div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Template Name *</label>
                <input className="form-input" value={form.name} onChange={set('name')} placeholder="Morning Routine" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={set('category')}>
                  {['study','work','health','personal','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input type="color" className="form-input" style={{ height:42, padding:4 }} value={form.color} onChange={set('color')} />
              </div>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button"
                      style={{ fontSize:20, padding:'4px 8px', borderRadius:8, border:`2px solid ${form.icon === ic ? 'var(--accent)' : 'transparent'}`,
                        background: form.icon === ic ? 'rgba(139,92,246,0.2)' : 'var(--bg-glass)', cursor:'pointer' }}
                      onClick={() => setForm(p => ({ ...p, icon: ic }))}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={set('description')} placeholder="Optional description…" />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <label className="form-label" style={{ margin:0 }}>Tasks ({form.tasks.length})</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTaskRow}><Plus size={13} /> Add Task</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {form.tasks.map((t, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 60px auto', gap:8, alignItems:'center' }}>
                    <input className="form-input" placeholder="Task title" value={t.title}
                      onChange={e => updateTask(i,'title',e.target.value)} style={{ fontSize:13 }} />
                    <select className="form-select" value={t.priority} onChange={e => updateTask(i,'priority',e.target.value)} style={{ fontSize:12 }}>
                      {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className="form-input" type="number" min={5} placeholder="Mins" value={t.duration}
                      onChange={e => updateTask(i,'duration',Number(e.target.value))} style={{ fontSize:13 }} />
                    <input className="form-input" type="number" min={0} placeholder="+min" value={t.offsetMins}
                      onChange={e => updateTask(i,'offsetMins',Number(e.target.value))} style={{ fontSize:13 }} title="Offset minutes from start" />
                    <button type="button" className="btn-icon btn-danger" onClick={() => removeTask(i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
