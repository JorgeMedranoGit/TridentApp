import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, HelpCircle, LogIn, UserPlus, Lightbulb } from 'lucide-react';
import { api } from '../services/supabase';

export default function Login({ onLoginSuccess, onRegisterClick }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validate = () => {
    let isValid = true;
    if (!identifier.trim()) {
      setIdentifierError('El correo, teléfono o CI es requerido');
      isValid = false;
    } else {
      setIdentifierError('');
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Mínimo 4 caracteres');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const response = await api.login(identifier, password);
      const rol = response?.rol;

      if (rol && !rol.toLowerCase().includes('incorrectas') && !rol.toLowerCase().includes('false')) {
        // Save session
        const sessionData = {
          isLoggedIn: true,
          rol: rol,
          userId: response.id || response.id_usuario,
          identifier: identifier,
          rememberMe: rememberMe
        };

        if (rememberMe) {
          localStorage.setItem('dental_clinic_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('dental_clinic_session', JSON.stringify(sessionData));
        }

        onLoginSuccess(sessionData);
      } else {
        setGeneralError('Credenciales incorrectas. Revisa tu Correo/CI y contraseña.');
      }
    } catch (err) {
      setGeneralError('Error de conexión o credenciales inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-decorated" style={{ minHeight: '100vh', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Help Icon Top Right */}
      <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem' }}>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="btn-icon"
          title="Ayuda de inicio de sesión"
        >
          <HelpCircle size={22} />
        </button>
      </div>

      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Logo and Welcome Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="VM Trident Logo"
            style={{ width: '180px', height: 'auto', marginBottom: '1rem', filter: 'drop-shadow(0 4px 12px rgba(62,176,155,0.3))' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--frosted-mint)' }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--celadon)', marginTop: '0.2rem' }}>
            Trident Dental Clinic
          </p>
        </div>

        {/* Interactive Login Guide Overlay Card */}
        {showHelp && (
          <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--sea-green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--dark-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={18} color="var(--mint-light)" />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--frosted-mint)' }}>
                Guía de Inicio de Sesión
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(7,21,19,0.5)', padding: '0.7rem', borderRadius: '8px', display: 'flex', gap: '0.6rem' }}>
                <LogIn size={16} color="var(--mint-leaf)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--frosted-mint)' }}>¿Cómo ingresar?</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--celadon)' }}>Usa tu Correo, Teléfono o CI con el que te registraste y tu contraseña personal.</div>
                </div>
              </div>

              <div style={{ background: 'rgba(7,21,19,0.5)', padding: '0.7rem', borderRadius: '8px', display: 'flex', gap: '0.6rem' }}>
                <UserPlus size={16} color="var(--mint-leaf)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--frosted-mint)' }}>¿No tienes una cuenta?</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--celadon)' }}>Presiona "Regístrate" abajo para abrir el formulario y crear tu ficha médica.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.8rem', padding: '0.4rem', fontSize: '0.8rem' }}
            >
              Entendido, ocultar
            </button>
          </div>
        )}

        {/* Login Form Panel */}
        <div className="glass-panel" style={{ padding: '2rem 1.75rem' }}>
          <form onSubmit={handleSubmit}>
            {/* Identifier Input */}
            <div className="input-group">
              <label className="input-label">Correo, Teléfono o CI</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`input-field ${identifierError ? 'has-error' : ''}`}
                  placeholder="ej. paciente@email.com o 1234567"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <Mail className="input-icon" size={18} />
              </div>
              {identifierError && <div className="input-error-msg">{identifierError}</div>}
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${passwordError ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="input-icon" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--sea-green)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <div className="input-error-msg">{passwordError}</div>}
            </div>

            {/* Remember me checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', cursor: 'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--mint-leaf)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--frosted-mint)' }}>Recuérdame en este dispositivo</span>
            </div>

            {/* General Error Message */}
            {generalError && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                color: '#ff9999',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1.2rem'
              }}>
                {generalError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: '100%', height: '52px', fontSize: '1rem' }}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--celadon)' }}>
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onRegisterClick}
            style={{ background: 'none', border: 'none', color: 'var(--mint-light)', fontWeight: 700, cursor: 'pointer' }}
          >
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
}
