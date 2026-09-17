import React from 'react';
import { CalendarClock, Clock, MapPin, X, ArrowRight, AlertCircle } from 'lucide-react';

export default function ConflictModal({ conflictData, onClose }) {
  if (!conflictData) return null;

  const { targetEvent, conflicting_event, message } = conflictData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
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

        {/* Friendly Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'var(--color-warning-subtle)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CalendarClock size={24} color="var(--color-warning)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Schedule Overlap
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              You have another event scheduled at this time
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
          {message || 'You already hold a confirmed pass during this exact time. To avoid double booking, college policy allows one active reservation per time slot.'}
        </p>

        {/* Conflict Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {/* Confirmed Existing Event */}
          <div style={{
            background: 'var(--color-danger-subtle)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '14px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Your Existing Pass
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {conflicting_event?.event_name || 'Existing Event'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="var(--color-danger)" />
              <span>{conflicting_event?.time || '10:00 - 12:00'}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <MapPin size={13} color="var(--color-danger)" />
              <span>{conflicting_event?.venue || 'Campus Venue'}</span>
            </div>
          </div>

          {/* Requested Event */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-card)',
            borderRadius: '14px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              New Event Requested
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {targetEvent?.event_name || 'Requested Event'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="var(--text-muted)" />
              <span>{targetEvent?.start_time?.slice(0,5)} - {targetEvent?.end_time?.slice(0,5)}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <MapPin size={13} color="var(--text-muted)" />
              <span>{targetEvent?.venue || 'Campus Venue'}</span>
            </div>
          </div>
        </div>

        {/* Helpful Human Tip */}
        <div style={{
          background: 'var(--color-warning-subtle)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: '12px',
          padding: '12px 14px',
          fontSize: '0.82rem',
          color: '#92400e',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <span>
            If you prefer attending <strong>{targetEvent?.event_name}</strong>, please cancel your existing pass from <strong>My Passes</strong> first.
          </span>
        </div>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
