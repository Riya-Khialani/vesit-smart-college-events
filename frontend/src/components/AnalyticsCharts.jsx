import React from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, Award, Building2 } from 'lucide-react';

export default function AnalyticsCharts({ analyticsData }) {
  if (!analyticsData || !analyticsData.metrics) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>📊 Fetching Real-Time Analytics...</div>
        <p style={{ fontSize: '0.85rem' }}>Synchronizing event registrations and gate attendance records.</p>
      </div>
    );
  }

  const metrics = analyticsData.metrics || {};
  const eventBreakdown = analyticsData.event_breakdown || analyticsData.eventBreakdown || [];
  const departmentBreakdown = analyticsData.department_breakdown || analyticsData.departmentBreakdown || [];

  const maxEventRegistrations = eventBreakdown.length > 0
    ? Math.max(...eventBreakdown.map(e => (Number(e.confirmed) || 0) + (Number(e.waitlisted) || 0)), 1)
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Registrations
            </span>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {metrics?.total_registrations || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {metrics?.total_confirmed || 0} Confirmed • {metrics?.total_waitlisted || 0} Waitlisted
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Attendance Rate
            </span>
            <CheckCircle2 size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {metrics?.overall_attendance_rate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {metrics?.total_present || 0} Students Checked In
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Most Popular Event
            </span>
            <Award size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={metrics?.most_popular_event}>
            {metrics?.most_popular_event || 'AI Workshop'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7c3aed', marginTop: '4px', fontWeight: 600 }}>
            Highest Student Demand
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #0891b2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Top Department
            </span>
            <Building2 size={18} color="#0891b2" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0891b2' }}>
            {metrics?.highest_participating_dept || 'CMPN'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Highest Engagement
          </div>
        </div>
      </div>

      {/* Visual Bar Graph: Registrations per Event */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BarChart3 size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.15rem' }}>Event Registration & Attendance Analytics</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {eventBreakdown.map(ev => {
            const confirmedWidth = Math.min(100, Math.round((ev.confirmed / maxEventRegistrations) * 100));

            return (
              <div key={ev.event_id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.event_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Confirmed: <strong style={{ color: 'var(--color-primary)' }}>{ev.confirmed}</strong>/{ev.capacity} | Present: <strong style={{ color: 'var(--color-success)' }}>{ev.present}</strong> ({ev.attendance_rate}%)
                    {ev.waitlisted > 0 && <span style={{ color: 'var(--color-warning)', marginLeft: '6px', fontWeight: 600 }}>(Waitlist: {ev.waitlisted})</span>}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '10px',
                  background: 'var(--border-subtle)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  <div
                    style={{
                      width: `${confirmedWidth}%`,
                      background: ev.fill_rate >= 100 ? 'linear-gradient(90deg, var(--color-primary), #8b5cf6)' : 'var(--color-primary)',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease-out'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <TrendingUp size={20} color="var(--color-success)" />
          <h3 style={{ fontSize: '1.15rem' }}>Department Participation Distribution</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {departmentBreakdown.map((dept, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {dept.department}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '4px' }}>
                {dept.count} Registrations ({dept.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
