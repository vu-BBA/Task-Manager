import { CheckCircle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm', 
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{
        maxWidth: 400,
        width: '90%',
        margin: 'auto',
        animation: 'modalIn 0.2s ease-out'
      }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ 
            width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%', 
            background: type === 'danger' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle size={28} style={{ color: type === 'danger' ? '#f43f5e' : '#10b981' }} />
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: 15, 
            margin: 0,
            wordBreak: 'break-word',
            lineHeight: 1.5
          }}>{message}</p>
        </div>

        <div className="modal-footer" style={{ 
          justifyContent: 'center', 
          gap: 12,
          flexWrap: 'wrap',
          padding: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ flex: '1 1 auto', minWidth: 100 }}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => { onConfirm(); onClose(); }}
            style={{ 
              flex: '1 1 auto', 
              minWidth: 100,
              background: type === 'danger' ? '#f43f5e' : undefined,
              borderColor: type === 'danger' ? '#f43f5e' : undefined
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}