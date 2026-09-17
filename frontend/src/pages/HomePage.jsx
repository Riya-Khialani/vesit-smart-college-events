import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import EventCard from '../components/EventCard';
import ConflictModal from '../components/ConflictModal';
import QRModal from '../components/QRModal';
import BookTicketModal from '../components/BookTicketModal';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function HomePage({ onViewRegistrations, onNavigateToAdmin, onOpenAuth }) {
  const { user, token, isAdmin, isLoggedIn, showToast } = useAuth();
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [conflictModalData, setConflictModalData] = useState(null);
  const [activeQRPass, setActiveQRPass] = useState(null);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);

  const categories = ['All', 'Workshop', 'Bootcamp', 'Hackathon', 'Cultural'];

  useEffect(() => {
    fetchEvents();
    fetchUserRegistrations();
  }, [user, token]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }

      // Fetch recommendations if token present
      if (token) {
        const recRes = await fetch('/api/events/recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const recData = await recRes.json();
        if (recData.success) {
          setRecommendations(recData.recommendations || []);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/registrations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserRegistrations(data.registrations);
      }
    } catch (err) {
      console.error('Failed to fetch user registrations', err);
    }
  };

  const handleRegister = async (event) => {
    if (!token) {
      onOpenAuth();
      showToast('Please sign in or register to book your pass', 'info');
      return;
    }
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: event.event_id })
      });

      const data = await res.json();

      if (res.status === 409 && data.conflict) {
        // 🚨 SCHEDULE CONFLICT DETECTED!
        setConflictModalData({
          targetEvent: event,
          conflicting_event: data.conflicting_event,
          message: data.message
        });
        showToast('⚠️ Registration blocked: Schedule Conflict Detected!', 'error');
        return;
      }

      if (!res.ok) {
        showToast(data.message || 'Registration failed', 'error');
        return;
      }

      if (data.status === 'confirmed') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        showToast(data.message || 'Registration confirmed! Digital pass generated.', 'success');
      } else if (data.status === 'waitlisted') {
        showToast(data.message || 'Added to waitlist queue!', 'warning');
      }

      // Refresh data
      fetchEvents();
      fetchUserRegistrations();
    } catch (err) {
      showToast('Network error while processing registration', 'error');
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Human Campus Hero */}
      <div className="hero-panel glass-panel" style={{
        marginTop: '16px',
        marginBottom: '24px',
        padding: '28px 24px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary-border)'
            }}>
              VESIT CAMPUS PASSES
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-card)'
            }}>
              Academic Year 2026
            </span>
          </div>

          <h1 className="hero-title" style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Discover and Attend Events Across Campus
          </h1>

          <p className="hero-desc" style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.55 }}>
            Reserve entry passes for workshops, hackathons, and fests. Your pass stays on your phone with instant QR check-in at the gate.
          </p>

          {/* Action Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {isAdmin ? (
              <button
                onClick={() => onNavigateToAdmin && onNavigateToAdmin()}
                className="btn-primary"
                style={{ fontSize: '0.86rem' }}
              >
                Open Admin Portal
              </button>
            ) : isLoggedIn ? (
              <button
                onClick={() => onViewRegistrations && onViewRegistrations()}
                className="btn-primary"
                style={{ fontSize: '0.86rem' }}
              >
                View My Booked Passes
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn-primary"
                style={{ fontSize: '0.86rem' }}
              >
                Sign In to Reserve Passes
              </button>
            )}

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="glass-pill" style={{ fontSize: '0.72rem', padding: '4px 10px', color: 'var(--text-secondary)' }}>
                ✓ Instant Mobile Pass
              </span>
              <span className="glass-pill" style={{ fontSize: '0.72rem', padding: '4px 10px', color: 'var(--text-secondary)' }}>
                ✓ Express Gate Entry
              </span>
              <span className="glass-pill" style={{ fontSize: '0.72rem', padding: '4px 10px', color: 'var(--text-secondary)' }}>
                ✓ Zero Double-Bookings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended for You Section */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recommended for You</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({user?.department || 'Engineering'} events)
            </span>
          </div>

          <div className="events-responsive-grid">
            {recommendations.slice(0, 2).map(event => {
              const reg = userRegistrations.find(r => r.event_id === event.event_id);
              return (
                <EventCard
                  key={`rec-${event.event_id}`}
                  event={event}
                  isAdmin={isAdmin}
                  isRegistered={reg?.status === 'confirmed'}
                  isWaitlisted={reg?.status === 'waitlisted'}
                  waitlistPos={reg?.waitlist_position}
                  onRegister={handleRegister}
                  onViewDetails={() => onViewRegistrations()}
                  onManage={() => onNavigateToAdmin && onNavigateToAdmin(event)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '40px', fontSize: '0.88rem' }}
            placeholder="Search events by title, venue, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="category-bar-wrapper" style={{ display: 'flex', gap: '6px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                minHeight: '34px'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Upcoming Events ({filteredEvents.length})
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {selectedCategory} events
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            No events found matching your filter criteria.
          </div>
        ) : (
          <div className="events-responsive-grid">
            {filteredEvents.map(event => {
              const reg = userRegistrations.find(r => r.event_id === event.event_id);
              return (
                <EventCard
                  key={event.event_id}
                  event={event}
                  isAdmin={isAdmin}
                  isRegistered={reg?.status === 'confirmed'}
                  isWaitlisted={reg?.status === 'waitlisted'}
                  waitlistPos={reg?.waitlist_position}
                  onRegister={() => {
                    if (!isLoggedIn) {
                      onOpenAuth();
                      showToast('Please sign in or register to book your ticket', 'info');
                    } else {
                      setSelectedEventForBooking(event);
                    }
                  }}
                  onViewDetails={() => onViewRegistrations()}
                  onManage={() => onNavigateToAdmin && onNavigateToAdmin(event)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Book Ticket Modal */}
      {selectedEventForBooking && (
        <BookTicketModal
          event={selectedEventForBooking}
          isOpen={!!selectedEventForBooking}
          onClose={() => setSelectedEventForBooking(null)}
          onOpenAuth={onOpenAuth}
          onSuccess={(registration) => {
            fetchEvents();
            fetchUserRegistrations();
            if (registration) {
              setActiveQRPass({
                ...registration,
                event_name: selectedEventForBooking.event_name,
                venue: selectedEventForBooking.venue,
                date: selectedEventForBooking.date,
                start_time: selectedEventForBooking.start_time,
                end_time: selectedEventForBooking.end_time,
                student_name: user?.name,
                department: user?.department
              });
            }
          }}
        />
      )}

      {/* Conflict Modal */}
      {conflictModalData && (
        <ConflictModal
          conflictData={conflictModalData}
          onClose={() => setConflictModalData(null)}
        />
      )}

      {/* BookMyShow QR Code Pass Modal */}
      {activeQRPass && (
        <QRModal
          registration={activeQRPass}
          onClose={() => setActiveQRPass(null)}
        />
      )}
    </div>
  );
}
