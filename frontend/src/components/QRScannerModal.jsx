import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export default function QRScannerModal({ onClose, onScanSuccess }) {
  const { token } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (scannedToken) => {
    const code = scannedToken || tokenInput;
    if (!code || !code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const activeToken = token || localStorage.getItem('vesit_token') || localStorage.getItem('college_token');
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ qr_code_token: code.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Scan verification failed.');
      } else {
        setResult(data);
        if (!data.already_checked_in) {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        }
        if (onScanSuccess) onScanSuccess();
      }
    } catch (err) {
      setError('Failed to reach attendance service.');
    } finally {
      setLoading(false);
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Scan size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Venue Gate QR Scanner</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Scan attendee QR passes or enter ticket ID for gate check-in
            </p>
          </div>
        </div>

        {/* Viewfinder Target */}
        <div style={{
          border: '2px dashed var(--border-card)',
          borderRadius: '16px',
          padding: '28px 20px',
          textAlign: 'center',
          marginBottom: '20px',
          background: 'var(--bg-surface-elevated)'
        }}>
          <QrCode size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.8 }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Point handheld barcode reader or enter QR ticket code below
          </p>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <input
              type="text"
              placeholder="e.g. QR-EVT1-USR2-XXXXX"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="form-input"
              style={{ textAlign: 'center', fontFamily: 'monospace' }}
              autoFocus
            />
            <button
              onClick={() => handleScan()}
              disabled={loading || !tokenInput.trim()}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Scan size={16} /> {loading ? 'Scanning...' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Scan Result */}
        {result && (
          <div style={{
            background: 'var(--color-success-subtle)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <CheckCircle2 size={24} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>
                {result.message}
              </div>
              {result.attendee && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Attendee:</strong> {result.attendee.name} ({result.attendee.department})<br />
                  <strong style={{ color: 'var(--text-primary)' }}>Event:</strong> {result.attendee.event_name}<br />
                  <strong style={{ color: 'var(--text-primary)' }}>Checked in at:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error / Alert */}
        {error && (
          <div style={{
            background: 'var(--color-danger-subtle)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={24} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: 'var(--color-danger)', fontSize: '0.88rem', fontWeight: 600 }}>
              {error}
            </div>
          </div>
        )}

        {/* Footer */}
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ width: '100%', padding: '10px' }}
        >
          Close Scanner
        </button>
      </div>
    </div>
  );
}
