/**
 * Global Toast Notification System
 * Usage:
 *   import { ToastContainer, toast } from '../components/Toast';
 *   toast.success('Done!');
 *   toast.error('Something failed');
 *   toast.info('FYI...');
 *   toast.warn('Careful!');
 * Then place <ToastContainer /> once at the root of your app.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

// ── Singleton event emitter ──────────────────────────────────
let _toastId = 0;
const _listeners = new Set();

function emit(toast) {
  _listeners.forEach(fn => fn(toast));
}

export const toast = {
  success: (msg, duration = 3500) => emit({ id: ++_toastId, type: 'success', msg, duration }),
  error:   (msg, duration = 4500) => emit({ id: ++_toastId, type: 'error',   msg, duration }),
  info:    (msg, duration = 3500) => emit({ id: ++_toastId, type: 'info',    msg, duration }),
  warn:    (msg, duration = 4000) => emit({ id: ++_toastId, type: 'warn',    msg, duration }),
};

// ── Individual Toast card ────────────────────────────────────
function ToastItem({ id, type, msg, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 320);
  }, [id, onDismiss]);

  const icons  = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  const colors = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', icon: '#34d399', bar: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  icon: '#f87171', bar: '#ef4444' },
    info:    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', icon: '#818cf8', bar: '#6366f1' },
    warn:    { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', icon: '#fbbf24', bar: '#f59e0b' },
  };
  const c = colors[type] || colors.info;

  return (
    <div
      className={`toast-item toast-${type} ${visible && !leaving ? 'toast-enter' : ''} ${leaving ? 'toast-leave' : ''}`}
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      onClick={dismiss}
      role="alert"
    >
      <span className="toast-icon" style={{ color: c.icon }}>{icons[type]}</span>
      <span className="toast-msg">{msg}</span>
      <button className="toast-close" onClick={dismiss} aria-label="Close">✕</button>
      <div className="toast-bar" style={{ background: c.bar }} />
    </div>
  );
}

// ── Container – place once in App root ──────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => dismiss(t.id), t.duration);
    };
    _listeners.add(handler);
    return () => _listeners.delete(handler);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

// ── Full-screen Loading Spinner overlay ──────────────────────
export function LoadingOverlay({ label = 'Loading…' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <div className="spinner-ring delay" />
      </div>
      <div className="loading-label">{label}</div>
    </div>
  );
}

// ── Inline page-level Spinner (replaces simple text loaders) ─
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="page-spinner">
        <div className="spinner-ring" />
      </div>
      <span className="page-loader-label">{label}</span>
    </div>
  );
}
