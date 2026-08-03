import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    // 1. Check if walkthrough has been seen
    const hasSeenWalkthrough = localStorage.getItem('has_seen_walkthrough');

    // 2. Check saved session
    const savedLocalSession = localStorage.getItem('dental_clinic_session');
    const savedSessionSession = sessionStorage.getItem('dental_clinic_session');
    const rawSession = savedLocalSession || savedSessionSession;

    let parsedSession = null;
    if (rawSession) {
      try {
        parsedSession = JSON.parse(rawSession);
      } catch (e) {
        console.error(e);
      }
    }

    if (!hasSeenWalkthrough) {
      setCurrentView('onboarding');
    } else if (parsedSession && parsedSession.isLoggedIn) {
      setUserSession(parsedSession);
      const rol = (parsedSession.rol || '').toLowerCase();
      if (rol.includes('admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('user');
      }
    } else {
      setCurrentView('login');
    }
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('has_seen_walkthrough', 'true');
    setCurrentView('login');
  };

  const handleLoginSuccess = (sessionData) => {
    setUserSession(sessionData);
    const rol = (sessionData.rol || '').toLowerCase();
    if (rol.includes('admin')) {
      setCurrentView('admin');
    } else {
      setCurrentView('user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dental_clinic_session');
    sessionStorage.removeItem('dental_clinic_session');
    setUserSession(null);
    setCurrentView('login');
  };

  if (currentView === 'loading') {
    return (
      <div className="bg-decorated" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint-leaf)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Trident Dental Clinic</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--celadon)' }}>Cargando aplicación...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'onboarding' && (
        <Onboarding onFinish={handleFinishOnboarding} />
      )}

      {currentView === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onRegisterClick={() => setCurrentView('register')}
        />
      )}

      {currentView === 'register' && (
        <Register
          onSuccess={handleLoginSuccess}
          onIniciarSesion={() => setCurrentView('login')}
        />
      )}

      {currentView === 'user' && (
        <UserDashboard
          user={userSession}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'admin' && (
        <AdminDashboard
          user={userSession}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
