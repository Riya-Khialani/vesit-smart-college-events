import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function BookTicketModal({ event, isOpen, onClose, onSuccess, onOpenAuth }) {
  const { user, isLoggedIn, token, showToast } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  if (!isOpen || !event) return null;

  const isFull = (event.registered_count || 0) >= event.capacity;
  const isFrozen = !!event.is_frozen;

  const handleConfirmBooking = async () => {
    if (!isLoggedIn) {
      onClose();
      onOpenAuth();
      showToast('Please sign in or register to book your pass', 'info');
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    try {
      const activeToken = token || localStorage.getItem('vesit_token') || localStorage.getItem('college_token');
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ event_id: event.event_id })
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        setConflictError(data);
        showToast('⚠️ Registration blocked: Time overlap conflict detected!', 'error');
        return;
      }

      if (!res.ok) {
        if (data.message && (data.message.includes('already registered') || data.message.includes('already on the waitlist'))) {
          showToast(data.message, 'info');
          if (onSuccess) onSuccess(null);
          onClose();
          return;
        }

        if (res.status === 401) {
          showToast('Session expired. Please sign in again.', 'error');
          onClose();
          if (onOpenAuth) onOpenAuth();
          return;
        }

        showToast(data.message || 'Registration failed.', 'error');
        return;
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast(data.message || 'Pass reserved successfully!', 'success');
      onSuccess(data.registration);
      onClose();
    } catch (err) {
      showToast('Network error while processing registration', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
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

        {/* Modal Header */}
        <div style={{ marginBottom: '16px' }}>
          <span className="badge badge-workshop" style={{ fontSize: '0.72rem', marginBottom: '8px' }}>
            {event.category}
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', lineHeight: 1.3, color: 'var(--text-primary)' }}>
            {event.event_name}
          </h2>
        </div>

        {/* Event Timing & Venue */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{event.date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} color="var(--color-primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>{event.start_time?.slice(0, 5)} - {event.end_time?.slice(0, 5)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}>
            <MapPin size={15} color="var(--color-primary)" />
            <span style={{ color: 'var(--text-secondary)' }}>{event.venue}</span>
          </div>
        </div>

        {/* Live Seat Availability Gauge */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Seat Availability</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {event.registered_count || 0} / {event.capacity} Confirmed
            </span>
          </div>
          <div style={{ height: '6px', background: '#e5e3dd', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.round(((event.registered_count || 0) / event.capacity) * 100))}%`,
              background: isFull ? 'var(--color-warning)' : 'var(--color-primary)',
              borderRadius: '999px'
            }} />
          </div>

          {isFrozen ? (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--color-danger-subtle)',
              border: '1px solid #fecaca',
              color: 'var(--color-danger)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={15} />
              <span>Registrations have been closed by college administration.</span>
            </div>
          ) : isFull ? (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--color-warning-subtle)',
              border: '1px solid #fde68a',
              color: 'var(--color-warning)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={15} />
              <span>
                Event is full. You will be placed on the <strong>Waitlist</strong> and auto-promoted if a confirmed attendee cancels.
              </span>
            </div>
          ) : (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'var(--color-success-subtle)',
              border: '1px solid #a7f3d0',
              color: 'var(--color-success)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={15} />
              <span>Seats Available! Guaranteed confirmed entry pass will be issued.</span>
            </div>
          )}
        </div>

        {/* Schedule Conflict Warning */}
        {conflictError && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--color-danger-subtle)',
            border: '1px solid #fecaca',
            color: 'var(--color-danger)',
            fontSize: '0.82rem'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Overlapping Event Conflict
            </div>
            <div>
              You already hold a pass for <strong>{conflictError.conflicting_event?.event_name}</strong> during this time slot.
            </div>
          </div>
        )}

        {/* Attendee Details Summary */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px',
          marginBottom: '18px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
            PASS HOLDER
          </div>
          {isLoggedIn ? (
            <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <strong>{user?.name}</strong> • {user?.email} • <span className="badge badge-workshop" style={{ fontSize: '0.7rem' }}>{user?.department}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--color-warning)' }}>
              Not signed in. You will be prompted to sign in to confirm this reservation.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={isSubmitting || isFrozen}
            className="btn-primary"
            style={{
              flex: 2,
              padding: '10px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} />
            {isSubmitting ? 'Reserving...' : isFull ? 'Join Waitlist Queue' : 'Confirm & Generate Pass'}
          </button>
        </div>
      </div>
    </div>
  );
}
