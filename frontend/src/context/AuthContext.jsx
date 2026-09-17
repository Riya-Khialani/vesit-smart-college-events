import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('vesit_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('vesit_token') || null);
  const [toast, setToast] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('vesit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vesit_user');
    }
  }, [user]);

  // Sync token state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('vesit_token', token);
    } else {
      localStorage.removeItem('vesit_token');
    }
  }, [token]);

  // Verify JWT session with backend on application load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Network error checking session:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    verifySession();
  }, [token]);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // User Login
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Login failed', 'error');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return true;
    } catch (err) {
      showToast('Network error while connecting to authentication service', 'error');
      return false;
    }
  };

  // User Registration
  const registerUser = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Registration failed', 'error');
        return false;
      }

      setUser(data.user);
      setToken(data.token);
      showToast(`Account successfully created! Welcome, ${data.user.name}.`, 'success');
      return true;
    } catch (err) {
      showToast('Network error while registering user', 'error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vesit_user');
    localStorage.removeItem('vesit_token');
    localStorage.removeItem('college_token');
    localStorage.removeItem('college_user');
    showToast('You have been logged out successfully', 'info');
  };

  const isAdmin = user?.role === 'admin';
  const isScanner = user?.role === 'scanner';
  const isStudent = user?.role === 'student' || (!isAdmin && !isScanner && !!user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isAdmin,
        isScanner,
        isStudent,
        isLoadingAuth,
        toast,
        showToast,
        login,
        registerUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
