import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Users, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  ShieldCheck, 
  RotateCcw,
  UserCheck,
  Building2,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ScannerPortalPage({ onOpenAuth }) {
  const { user, token, isAdmin, isScanner, showToast } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'manual'
  const inputRef = useRef(null);

  // Audio synthesizer using Web Audio API
  const playSound = (type) => {
    if (!audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'success') {
        // High dual-tone chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start(ctx.currentTime + 0.08);
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (type === 'warning') {
        // Amber warning tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.12); // C4
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Error buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.setValueAtTime(130, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const triggerVibration = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRoster(selectedEventId);
    }
  }, [selectedEventId, token]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success && data.events.length > 0) {
        setEvents(data.events);
        setSelectedEventId(String(data.events[0].event_id));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const getActiveToken = () => token || localStorage.getItem('vesit_token') || localStorage.getItem('college_token');

  const fetchEventRoster = async (eventId) => {
    const activeToken = getActiveToken();
    if (!activeToken) return;
    try {
      const res = await fetch(`/api/registrations/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttendees(data.registrations || []);
      }
    } catch (err) {
      console.error('Error fetching roster:', err);
    }
  };

  const handleScanSubmit = async (tokenToVerify) => {
    const code = tokenToVerify || qrInput;
    if (!code || !code.trim()) return;

    const activeToken = getActiveToken();
    if (!activeToken) {
      showToast('Scanner authorization required', 'error');
      return;
    }
    setIsProcessing(true);

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ qr_code_token: code.trim() })
      });
      const data = await res.json();

      if (res.status === 200 && data.success) {
        if (data.already_checked_in) {
          // Edge Case 1: Duplicate Scan
          playSound('warning');
          triggerVibration([100, 50, 100]);
          setScanResult({
            status: 'duplicate',
            title: 'Already Admitted!',
            message: data.message,
            student: data.student,
            event: data.event,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          // Successful Entry Pass
          playSound('success');
          triggerVibration([200]);
          setScanResult({
            status: 'success',
            title: 'Entry Approved! 🎉',
            message: data.message,
            student: data.attendee,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } else if (res.status === 400) {
        // Edge Case 2: Waitlisted Student trying to enter
        playSound('error');
        triggerVibration([300, 100, 300]);
        setScanResult({
          status: 'waitlisted',
          title: 'Entry Denied: Waitlist Pass',
          message: data.message || 'Student is on the waitlist and does not have a confirmed seat.',
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        // Edge Case 3: Invalid or Cancelled QR
        playSound('error');
        triggerVibration([400]);
        setScanResult({
          status: 'invalid',
          title: 'Invalid Ticket QR',
          message: data.message || 'Ticket code not found in college registry.',
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Refresh headcount
      if (selectedEventId) fetchEventRoster(selectedEventId);
      setQrInput('');
    } catch (err) {
      playSound('error');
      setScanResult({
        status: 'error',
        title: 'Network / Verification Error',
        message: 'Could not connect to authentication gateway.',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleManualCheckIn = async (regId, studentName) => {
    const activeToken = getActiveToken();
    if (!activeToken) return;
    try {
      const res = await fetch(`/api/attendance/${regId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ attendance_status: 'present' })
      });
      const data = await res.json();
      if (data.success) {
        playSound('success');
        triggerVibration([200]);
        showToast(`✅ Manual Check-in Confirmed for ${studentName}!`, 'success');
        if (selectedEventId) fetchEventRoster(selectedEventId);
      }
    } catch (err) {
      showToast('Failed to check in student manually', 'error');
    }
  };

  const activeEvent = events.find(e => Number(e.event_id) === Number(selectedEventId));
  const confirmedAttendees = attendees.filter(a => a.status === 'confirmed');
  const presentAttendees = confirmedAttendees.filter(a => a.attendance_status === 'present');
  const checkedInCount = presentAttendees.length;
  const totalCapacity = activeEvent ? activeEvent.capacity : 60;
  const attendanceRate = confirmedAttendees.length > 0 
    ? Math.round((checkedInCount / confirmedAttendees.length) * 100) 
    : 0;

  // Filtered roster for manual dead battery lookup
  const filteredRoster = attendees.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.student_name?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.qr_code_token?.toLowerCase().includes(q)
    );
  });

  if (!isScanner && !isAdmin) {
    return (
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px' }}>
          <ShieldCheck size={48} color="#34d399" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h2>Gate Scanner Portal</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
            {user ? (
              <>You are signed in as <strong>{user.name} ({user.role})</strong>. Scanner or Administrator credentials are required to operate entry check-in gates.</>
            ) : (
              <>Please sign in with a Gate Scanner or Administrator account to access the check-in scanner.</>
            )}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign In to Staff Account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 16px 80px', maxWidth: '800px' }}>
      {/* Top Gate Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
          }}>
            <QrCode size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Gate Scanner Portal</h1>
              <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                GATE 1 ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Operator: <strong>{user?.name || 'Gate Volunteer'}</strong> • VESIT Operations
            </div>
          </div>
        </div>

        {/* Audio feedback toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {audioEnabled ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} color="#f87171" />}
          {audioEnabled ? 'Sound On' : 'Muted'}
        </button>
      </div>

      {/* Select Event Being Scanned */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          SELECT EVENT AT THIS CHECK-IN GATE:
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input-field"
          style={{ fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
        >
          {events.map(ev => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.event_name} ({ev.venue} • {ev.date})
            </option>
          ))}
        </select>
      </div>

      {/* Live Gate Headcount Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Admitted</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>{checkedInCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Students Inside</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Confirmed</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{confirmedAttendees.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pass Holders</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            {Math.max(0, confirmedAttendees.length - checkedInCount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Queued / Outside</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Turnout</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5' }}>{attendanceRate}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gate Check-in</div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('scanner')}
          className={activeTab === 'scanner' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <QrCode size={18} />
          Digital Scanner
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={activeTab === 'manual' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Search size={18} />
          Emergency Name Search
        </button>
      </div>

      {/* TAB 1: Digital QR Scanner & Viewfinder */}
      {activeTab === 'scanner' && (
        <div>
          {/* Viewfinder simulation */}
          <div className="glass-panel" style={{
            padding: '28px 20px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '2px dashed var(--border-card)',
            borderRadius: '20px',
            position: 'relative',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            {/* Viewfinder Target Box */}
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 18px',
              border: '2px solid var(--color-primary)',
              borderRadius: '16px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface-elevated)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: -2, left: -2, width: '20px', height: '20px', borderTop: '4px solid var(--color-primary)', borderLeft: '4px solid var(--color-primary)', borderTopLeftRadius: '8px' }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: '20px', height: '20px', borderTop: '4px solid var(--color-primary)', borderRight: '4px solid var(--color-primary)', borderTopRightRadius: '8px' }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: '20px', height: '20px', borderBottom: '4px solid var(--color-primary)', borderLeft: '4px solid var(--color-primary)', borderBottomLeftRadius: '8px' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderBottom: '4px solid var(--color-primary)', borderRight: '4px solid var(--color-primary)', borderBottomRightRadius: '8px' }} />

              <QrCode size={72} color="var(--color-primary)" style={{ opacity: 0.85 }} />

              {/* Scanning red laser beam animation */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #e11d48, transparent)',
                boxShadow: '0 0 8px rgba(225, 29, 72, 0.6)',
                top: '50%',
                animation: 'pulse 1.8s ease-in-out infinite'
              }} />
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Aim student's mobile pass or handheld scanner here
            </p>

            {/* Direct Token Input Bar (autofocus for Bluetooth/USB barcode guns) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanSubmit();
              }}
              style={{ display: 'flex', gap: '8px', maxWidth: '460px', margin: '0 auto' }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan or enter QR token / Ticket ID..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="input-field"
                style={{ flex: 1, textAlign: 'center', letterSpacing: '0.05em' }}
                autoFocus
              />
              <button
                type="submit"
                disabled={isProcessing || !qrInput.trim()}
                className="btn-primary"
                style={{ padding: '0 20px', whiteSpace: 'nowrap' }}
              >
                {isProcessing ? 'Verifying...' : 'Verify Pass'}
              </button>
            </form>
          </div>

          {/* Live Scan Result Card */}
          {scanResult && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '18px',
                animation: 'fadeIn 0.25s ease-out',
                borderLeft: `6px solid ${
                  scanResult.status === 'success' ? '#10b981' :
                  scanResult.status === 'duplicate' ? '#f59e0b' : '#ef4444'
                }`,
                background: scanResult.status === 'success' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : scanResult.status === 'duplicate' 
                  ? 'rgba(245, 158, 11, 0.08)' 
                  : 'rgba(239, 68, 68, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: scanResult.status === 'success' ? '#10b981' : scanResult.status === 'duplicate' ? '#f59e0b' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {scanResult.status === 'success' && <CheckCircle2 size={28} color="#fff" />}
                  {scanResult.status === 'duplicate' && <AlertTriangle size={28} color="#fff" />}
                  {(scanResult.status === 'waitlisted' || scanResult.status === 'invalid' || scanResult.status === 'error') && (
                    <XCircle size={28} color="#fff" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: scanResult.status === 'success' ? '#34d399' : scanResult.status === 'duplicate' ? '#fbbf24' : '#f87171'
                    }}>
                      {scanResult.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {scanResult.timestamp}
                    </span>
                  </div>

                  <p style={{ marginTop: '6px', fontSize: '0.92rem', color: '#e2e8f0' }}>
                    {scanResult.message}
                  </p>

                  {scanResult.student && (
                    <div style={{
                      marginTop: '14px',
                      padding: '12px 16px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>ATTENDEE NAME</span>
                        <strong>{scanResult.student.name}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>COLLEGE EMAIL</span>
                        <span>{scanResult.student.email}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>DEPARTMENT</span>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {scanResult.student.department || 'CMPN'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Emergency Name Search (Broken Screen / Dead Battery) */}
      {activeTab === 'manual' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Emergency Student Lookup
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Use this if the student's phone battery died, screen is cracked, or network failed at the gate.
            </p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by student name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Roster list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRoster.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No students found matching "{searchQuery}" for this event.
              </div>
            ) : (
              filteredRoster.map(att => {
                const isPresent = att.attendance_status === 'present';
                const isWaitlisted = att.status === 'waitlisted';

                return (
                  <div
                    key={att.registration_id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{att.student_name}</span>
                        <span className="glass-pill" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          {att.department}
                        </span>
                        {isWaitlisted && (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            Waitlist #{att.waitlist_position || 1}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {att.student_email} • Token: <code>{att.qr_code_token?.slice(0, 16)}...</code>
                      </div>
                    </div>

                    <div>
                      {isPresent ? (
                        <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} /> Checked In
                        </span>
                      ) : isWaitlisted ? (
                        <button
                          disabled
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          Waitlisted (Cannot Admit)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(att.registration_id, att.student_name)}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#10b981' }}
                        >
                          <UserCheck size={14} />
                          Manual Admit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
