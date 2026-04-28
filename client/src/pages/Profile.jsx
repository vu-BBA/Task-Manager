import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { User, Settings, Bell, Clock, Save } from 'lucide-react';

const TABS = [
  { id: 'profile',  label: 'Profile',      icon: User },
  { id: 'prefs',    label: 'Preferences',  icon: Settings },
  { id: 'password', label: 'Password',     icon: Bell },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [prefs, setPrefs]    = useState({ ...user?.preferences });
  const [pwForm, setPwForm]  = useState({ currentPassword:'', newPassword:'', confirm:'' });

  const setP  = k => e => setProfile(p => ({ ...p, [k]: e.target.value }));
  const setPr = k => e => setPrefs(p => ({ ...p, [k]: e.target.value }));
  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateUser({ name: profile.name, avatar: profile.avatar });
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const savePrefs = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateUser({ preferences: prefs });
      toast.success('Preferences saved!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page animate-fade">
      <div className="page-header">
        <div>
          <h2 className="page-title">Profile & Settings</h2>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>
        {/* Sidebar tabs */}
        <div className="glass" style={{ padding:12, height:'fit-content' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px',
                borderRadius:'var(--radius-md)', border:'none', cursor:'pointer', fontSize:14, fontWeight:500,
                background: activeTab === id ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: activeTab === id ? 'var(--accent-light)' : 'var(--text-secondary)',
                marginBottom:4, transition:'all 0.2s',
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass" style={{ padding:28 }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:8 }}>
                <div className="avatar" style={{ width:64, height:64, fontSize:26 }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20 }}>{user?.name}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>{user?.email}</div>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:'99px',
                    background: user?.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.15)',
                    color: user?.role === 'admin' ? 'var(--accent-light)' : '#34d399',
                    fontWeight:700, textTransform:'uppercase' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="profile-name" className="form-input" value={profile.name} onChange={setP('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity:0.6 }} />
              </div>
              <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start' }}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'prefs' && (
            <form onSubmit={savePrefs} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Work Start Time</label>
                  <input type="time" className="form-input" value={prefs.workStartTime || '09:00'} onChange={setPr('workStartTime')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Work End Time</label>
                  <input type="time" className="form-input" value={prefs.workEndTime || '17:00'} onChange={setPr('workEndTime')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Focus Block (minutes)</label>
                  <input type="number" min={15} max={240} className="form-input" value={prefs.focusBlockMins || 90} onChange={setPr('focusBlockMins')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reminder Lead Time (minutes)</label>
                  <input type="number" min={5} max={60} className="form-input" value={prefs.reminderMins || 15} onChange={setPr('reminderMins')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Category</label>
                  <select className="form-select" value={prefs.defaultCategory || 'work'} onChange={setPr('defaultCategory')}>
                    {['study','work','health','personal','other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <input className="form-input" value={prefs.timezone || 'UTC'} onChange={setPr('timezone')} placeholder="UTC" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start' }}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={savePassword} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={pwForm.currentPassword} onChange={setPw('currentPassword')} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={pwForm.newPassword} onChange={setPw('newPassword')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={pwForm.confirm} onChange={setPw('confirm')} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start' }}>
                <Save size={15} /> {saving ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
