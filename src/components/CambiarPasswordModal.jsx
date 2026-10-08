import React, { useState } from 'react';
import { X, CreditCard, Calendar, Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { api } from '../services/supabase';

export default function CambiarPasswordModal({ onDismiss, onSuccess, initialCi = '' }) {
  const [ci, setCi] = useState(initialCi);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Password strength meter
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', percent: 0 };
    if (pwd.length < 6) return { label: 'Débil (mínimo 6 recomendado)', color: 'var(--danger)', percent: 33 };
    if (pwd.length < 10 || !/\d/.test(pwd)) return { label: 'Media', color: 'var(--warning)', percent: 66 };
    return { label: 'Fuerte', color: 'var(--success)', percent: 100 };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCi = ci.trim();
    if (!cleanCi) {
      setErrorMessage('Por favor, ingresa tu Cédula de Identidad (CI).');
      return;
    }

    if (!fechaNacimiento) {
      setErrorMessage('Por favor, ingresa tu Fecha de Nacimiento.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Por favor, ingresa una nueva contraseña.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifícalas e intenta de nuevo.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.cambiarPassword({
        ci: cleanCi,
        fechaNacimiento,
        newPassword
      });

      setSuccessInfo(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('No se encontró')) {
        setErrorMessage('No se encontró ninguna cuenta con el CI y fecha de nacimiento proporcionados. Revisa tus datos.');
      } else {
        setErrorMessage(msg.replace(/^"?Error:\s*/i, '').replace(/"$/, '').trim() || 'Error al cambiar la contraseña. Inténtalo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <button
          onClick={onDismiss}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}
          title="Cerrar"
        >
          <X size={22} />
        </button>

        {successInfo ? (
          <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--mint-light)'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.5rem' }}>
              ¡Contraseña Actualizada!
            </h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--celadon)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {successInfo.nombre ? `Hola ${successInfo.nombre}, tu` : 'Tu'} contraseña se ha cambiado exitosamente. Ya puedes iniciar sesión con tu nueva clave.
            </p>

            <button
              onClick={onDismiss}
              className="btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '0.95rem' }}
            >
              Entendido / Iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(62, 176, 155, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-light)'
              }}>
                <KeyRound size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--frosted-mint)' }}>
                Cambiar Contraseña
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Ingresa tu Cédula de Identidad (CI) y tu Fecha de Nacimiento para verificar tu identidad y asignar una nueva clave.
            </p>

            {errorMessage && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                color: '#ff9999',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: '1.2rem',
                lineHeight: '1.4'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* CI */}
              <div className="input-group">
                <label className="input-label">Cédula de Identidad (CI) *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="ej. 8392019"
                    value={ci}
                    onChange={(e) => setCi(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <CreditCard className="input-icon" size={18} />
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div className="input-group">
                <label className="input-label">Fecha de Nacimiento *</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    className="input-field"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    required
                  />
                  <Calendar className="input-icon" size={18} />
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div className="input-group">
                <label className="input-label">Nueva Contraseña *</label>
                <div className="input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Lock className="input-icon" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--sea-green)', cursor: 'pointer' }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {newPassword && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                      <span>Seguridad:</span>
                      <span>{strength.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(7,21,19,0.7)', borderRadius: '2px', marginTop: '0.2rem' }}>
                      <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'all 0.3s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="input-group">
                <label className="input-label">Confirmar Nueva Contraseña *</label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Lock className="input-icon" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--sea-green)', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="btn-outlined"
                  style={{ flex: 1 }}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.3 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
