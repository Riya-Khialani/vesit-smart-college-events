import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Wifi, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileGatewayModal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const { showToast } = useAuth();

  // Dynamic mobile entry point: uses deployed Render origin or local Wi-Fi IP
  const mobileUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'http://192.168.1.34:5000';

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        mobileUrl,
        {
          width: 200,
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mobileUrl);
    showToast('Mobile URL copied to clipboard!', 'info');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center' }}
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

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'var(--color-primary-subtle)',
          border: '1px solid var(--color-primary-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px'
        }}>
          <Smartphone size={24} color="var(--color-primary)" />
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Open on Your Mobile Phone
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Scan this QR code with your phone camera while connected to the same campus Wi-Fi
        </p>

        {/* QR Canvas */}
        <div style={{
          background: '#ffffff',
          padding: '12px',
          borderRadius: '18px',
          display: 'inline-block',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '16px'
        }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        {/* IP Address Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '10px 14px',
          maxWidth: '320px',
          margin: '0 auto 16px'
        }}>
          <Wifi size={16} color="var(--color-success)" />
          <code style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{mobileUrl}</code>
          <button
            onClick={handleCopyUrl}
            title="Copy URL"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Copy size={15} />
          </button>
        </div>

        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ width: '100%', padding: '10px' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
