import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle2, MapPin, ShieldCheck, Printer } from 'lucide-react';

export default function QRModal({ registration, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (registration && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        registration.qr_code_token || `TICKET-${registration.registration_id}`,
        {
          width: 190,
          margin: 1,
          color: {
            dark: '#18181b',
            light: '#ffffff'
          }
        },
        (err) => {
          if (err) console.error('QR Render error', err);
        }
      );
    }
  }, [registration]);

  if (!registration) return null;

  const isPresent = registration.attendance_status === 'present';
  const isWaitlist = registration.status === 'waitlisted';

  const formatCheckInTime = (timeVal) => {
    if (!timeVal) return '';
    try {
      const str = String(timeVal).trim().replace(' ', 'T');
      const dt = new Date(str);
      return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog-content" 
        style={{ padding: '0', overflow: 'hidden', maxWidth: '400px', background: 'transparent', border: 'none', boxShadow: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Bottom Sheet Handle */}
        <div className="sheet-drag-handle" style={{ marginBottom: '12px' }} />

        {/* Physical Paper Admission Pass Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid var(--border-card)',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Top Ticket Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #be123c, #e11d48)',
            padding: '22px 20px 18px',
            color: '#fff',
            position: 'relative'
          }}>
            {/* Close Button Inside Header */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: 'none',
                color: '#fff',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(4px)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                CAMPUS PASS
              </span>

              <span style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
                #{registration.registration_id}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '6px', paddingRight: '36px' }}>
              {registration.event_name}
            </h2>

            <div style={{ fontSize: '0.82rem', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} />
              <span>{registration.venue || 'Auditorium Hall A'}</span>
            </div>
          </div>

          {/* Middle Details Grid */}
          <div style={{ padding: '18px 22px', background: '#ffffff' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '0.84rem'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  DATE &amp; DAY
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{registration.date || '2026-09-25'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  TIME SLOT
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {registration.start_time?.slice(0, 5) || '10:00'} - {registration.end_time?.slice(0, 5) || '12:00'}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  ATTENDEE
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{registration.student_name || 'Riya Khialani'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  DEPARTMENT
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>{registration.department || 'CMPN'}</strong>
              </div>
            </div>
          </div>

          {/* Perforated Notch Divider */}
          <div style={{ position: 'relative', height: '24px', background: '#ffffff', display: 'flex', alignItems: 'center' }}>
            {/* Left Notch Circle */}
            <div style={{
              position: 'absolute',
              left: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--bg-app)',
              borderRight: '1px solid var(--border-card)'
            }} />

            {/* Dashed Line */}
            <div style={{
              width: '100%',
              margin: '0 20px',
              borderTop: '2px dashed var(--border-card)'
            }} />

            {/* Right Notch Circle */}
            <div style={{
              position: 'absolute',
              right: '-12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--bg-app)',
              borderLeft: '1px solid var(--border-card)'
            }} />
          </div>

          {/* Bottom QR & Barcode Section */}
          <div style={{
            padding: '14px 22px 22px',
            background: '#ffffff',
            textAlign: 'center'
          }}>
            {/* Status Badge */}
            <div style={{ marginBottom: '12px' }}>
              {isPresent ? (
                <span className="badge badge-success" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={14} /> Admitted at Gate {registration.check_in_time ? `(${formatCheckInTime(registration.check_in_time)})` : ''}
                </span>
              ) : isWaitlist ? (
                <span className="badge badge-warning" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                  Waitlist Position #{registration.waitlist_position || 1}
                </span>
              ) : (
                <span className="badge badge-success" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                  <ShieldCheck size={14} /> CONFIRMED PASS • ADMIT ONE
                </span>
              )}
            </div>

            {/* QR Code Canvas */}
            <div style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              display: 'inline-block',
              border: '1px solid var(--border-card)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}>
              <canvas ref={canvasRef} style={{ display: 'block' }} />
            </div>

            {/* Barcode Token String */}
            <div style={{
              marginTop: '10px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em'
            }}>
              {registration.qr_code_token || `QR-EVT${registration.event_id}-TKT${registration.registration_id}`}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Present this pass on your phone screen at the venue gate for admission
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handlePrint}
                className="btn-secondary"
                style={{ flex: 1, padding: '9px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer size={15} /> Print Pass
              </button>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ flex: 1, padding: '9px', fontSize: '0.82rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
