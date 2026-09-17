import React, { useState } from 'react';
import { X, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'register' }) {
  const { login, registerUser } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'register' | 'login'

  // Form states - Strictly student registrations
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CMPN',
    interests: 'Technology, Hackathons, Cultural'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanData = {
        ...formData,
        name: (formData.name || '').trim(),
        email: (formData.email || '').trim().toLowerCase()
      };

      if (mode === 'register') {
        const success = await registerUser(cleanData);
        if (success) {
          onClose();
        }
      } else {
        const success = await login(cleanData.email, formData.password);
        if (success) {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = ['CMPN', 'IT', 'EXTC', 'AIDS', 'ETRX'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Mobile Bottom Sheet Handle */}
        <div className="sheet-drag-handle" />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {/* Header Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: mode === 'register' ? '1px solid var(--border-card)' : 'none',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={15} />
            Student Sign Up
          </button>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: mode === 'login' ? '1px solid var(--border-card)' : 'none',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogIn size={15} />
            Sign In
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {mode === 'register' ? 'Create Your Student Pass Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'register'
              ? 'Reserve tickets for campus workshops, hackathons, and cultural fests.'
              : 'Sign in to access your confirmed event passes and gate QR codes.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aryan Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              College Email ID
            </label>
            <input
              type="email"
              required
              placeholder="e.g. student@vesit.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
            />
          </div>

          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Account Type
                </label>
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}>
                  Student Pass
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '0.92rem' }}
          >
            {isSubmitting
              ? 'Please wait...'
              : (mode === 'register' ? 'Create Account & Browse Events' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
