import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import QRModal from '../components/QRModal';
import { useAuth } from '../context/AuthContext';

export default function MyRegistrationsPage({ onOpenAuth }) {
  const { user, token, isLoggedIn, showToast } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQR, setActiveQR] = useState(null);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [user, token, isLoggedIn]);

  const fetchRegistrations = async () => {
    const activeToken = token || localStorage.getItem('vesit_token') || localStorage.getItem('college_token');
    if (!activeToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/registrations/my', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Error fetching registrations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reg) => {
    if (!window.confirm(`Are you sure you want to cancel your pass for "${reg.event_name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/registrations/${reg.registration_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        if (data.auto_promoted) {
          showToast(`Pass cancelled. ${data.auto_promoted}`, 'info');
        } else {
          showToast('Pass cancelled successfully.', 'info');
        }
        fetchRegistrations();
      } else {
        showToast(data.message || 'Failed to cancel registration', 'error');
      }
    } catch (err) {
      showToast('Network error while cancelling registration', 'error');
    }
  };

  const confirmedList = registrations.filter(r => r.status === 'confirmed');
  const waitlistedList = registrations.filter(r => r.status === 'waitlisted');

  return (
    <div className="container" style={{ padding: '20px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-primary)',
          flexShrink: 0
        }}>
          <Ticket size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            My Event Passes
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Digital admission passes for {user?.name || 'Student'} ({user?.department || 'VESIT'})
          </p>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
          <Ticket size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Sign In to View Your Passes</h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '18px' }}>
            Sign in with your student email to access your active admission QR codes and waitlist queues.
          </p>
          <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '9px 22px' }}>
            Sign In
          </button>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading your passes...
        </div>
      ) : registrations.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
          <Ticket size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px', display: 'block' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Active Passes</h3>
          <p style={{ fontSize: '0.88rem' }}>
            You haven't reserved tickets for any upcoming events. Browse events to claim your pass.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Confirmed Passes */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--color-success)" />
              Confirmed Passes ({confirmedList.length})
            </h2>

            {confirmedList.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No confirmed events yet.</div>
            ) : (
              <div className="events-responsive-grid">
                {confirmedList.map(reg => {
                  const isPresent = reg.attendance_status === 'present';
                  return (
                    <div key={reg.registration_id} className="glass-panel" style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderLeft: isPresent ? '4px solid var(--color-success)' : '4px solid var(--color-primary)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span className="badge badge-workshop">{reg.category}</span>
                          {isPresent ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> Admitted at Gate
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}>
                              Confirmed Entry
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                          {reg.event_name}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="var(--color-primary)" />
                            <span>{new Date(reg.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} color="var(--text-muted)" />
                            <span>{reg.start_time?.slice(0, 5)} - {reg.end_time?.slice(0, 5)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} color="var(--text-muted)" />
                            <span>{reg.venue}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          onClick={() => setActiveQR(reg)}
                          className="btn-primary"
                          style={{ flex: 1, fontSize: '0.82rem', padding: '9px 12px' }}
                        >
                          <QrCode size={15} /> Show QR Pass
                        </button>
                        <button
                          onClick={() => handleCancel(reg)}
                          className="btn-danger"
                          style={{ fontSize: '0.82rem', padding: '9px 12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waitlisted Section */}
          {waitlistedList.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="var(--color-warning)" />
                Waitlisted Queue ({waitlistedList.length})
              </h2>

              <div className="events-responsive-grid">
                {waitlistedList.map(reg => (
                  <div key={reg.registration_id} className="glass-panel" style={{
                    padding: '20px',
                    borderLeft: '4px solid var(--color-warning)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span className="badge badge-waitlist">Waitlist #{reg.waitlist_position}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-warning)' }}>Auto-promotes</span>
                      </div>

                      <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        {reg.event_name}
                      </h3>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        You are queue position #{reg.waitlist_position}. If a confirmed student cancels their ticket, your pass is promoted automatically.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => handleCancel(reg)}
                        className="btn-danger"
                        style={{ width: '100%', fontSize: '0.82rem', padding: '9px 12px' }}
                      >
                        Leave Waitlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {activeQR && (
        <QRModal
          registration={activeQR}
          onClose={() => setActiveQR(null)}
        />
      )}
    </div>
  );
}
