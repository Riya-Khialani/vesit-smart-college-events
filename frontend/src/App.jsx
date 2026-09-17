import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ScannerPortalPage from './pages/ScannerPortalPage';
import AuthModal from './components/AuthModal';
import MobileGatewayModal from './components/MobileGatewayModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#0b0f19',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px' }}>
            <h2 style={{ color: '#fda4af', marginBottom: '12px' }}>System Notice</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainLayout() {
  const { user, isScanner, isAdmin, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileGatewayOpen, setIsMobileGatewayOpen] = useState(false);

  // Auto-route scanner accounts directly to the gate portal
  useEffect(() => {
    if (isScanner) {
      setActiveTab('scanner');
    }
  }, [isScanner]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenMobileGateway={() => setIsMobileGatewayOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'events' && (
          <HomePage
            onViewRegistrations={() => setActiveTab('registrations')}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
        {activeTab === 'registrations' && (
          <MyRegistrationsPage onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        {activeTab === 'scanner' && (
          <ScannerPortalPage onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
        {activeTab === 'admin' && (
          <AdminDashboardPage onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}
      </main>

      {/* Production Footer */}
      <footer style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-card)',
        padding: '24px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>VESIT EventHub</strong> — Advanced Cloud Computing Mini-Project
            <div style={{ color: 'var(--text-muted)' }}>Course: ACC Devops • Class: D17A • Batch 2, Group 11</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-primary)' }}><strong>Team:</strong> Prachi (39), Riya (34), Ankita (36), Shivam (41)</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>Docker • Kubernetes • Multi-Role Production RBAC</div>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <MobileGatewayModal
        isOpen={isMobileGatewayOpen}
        onClose={() => setIsMobileGatewayOpen(false)}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
