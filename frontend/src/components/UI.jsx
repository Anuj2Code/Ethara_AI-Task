import React from 'react';
import { colorFor, initials } from '../utils/helpers';

/* ── Avatar ── */
export function Avatar({ user, size = 28 }) {
  if (!user) return null;
  const bg = colorFor(user.name || '');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      userSelect: 'none',
    }}>
      {initials(user.name)}
    </div>
  );
}

/* ── Badge ── */
const BADGE_MAP = {
  todo:     { cls: 'badge-todo',     label: 'To Do' },
  progress: { cls: 'badge-progress', label: 'In Progress' },
  done:     { cls: 'badge-done',     label: 'Done' },
  overdue:  { cls: 'badge-overdue',  label: 'Overdue' },
  admin:    { cls: 'badge-admin',    label: 'Admin' },
  member:   { cls: 'badge-member',   label: 'Member' },
  high:     { cls: 'badge-high',     label: 'High' },
  medium:   { cls: 'badge-medium',   label: 'Medium' },
  low:      { cls: 'badge-low',      label: 'Low' },
};

export function Badge({ type }) {
  const { cls, label } = BADGE_MAP[type] || { cls: '', label: type };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ── Modal ── */
export function Modal({ title, onClose, children, width = 440 }) {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal fade-in" style={{ width }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── FormGroup ── */
export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

/* ── Toast notification ── */
let _setToast;
export function ToastProvider({ children }) {
  const [toast, setToast] = React.useState(null);
  _setToast = setToast;

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {children}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14,
          zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,.4)',
          animation: 'fadeIn .2s ease',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}

export function toast(message, type = 'success') {
  _setToast?.({ message, type });
}

/* ── Confirm dialog ── */
export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal fade-in" style={{ width: 360 }}>
        <p style={{ marginBottom: 20, fontSize: 15 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
export function Empty({ message = 'Nothing here yet' }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: 14 }}>
      {message}
    </div>
  );
}

/* ── Page header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
