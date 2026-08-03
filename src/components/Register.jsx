import React, { useState } from 'react';
import { User, CreditCard, Calendar, Phone, Mail, Lock, Eye, EyeOff, HelpCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/supabase';

export default function Register({ onSuccess, onIniciarSesion }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    ci: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showRememberModal, setShowRememberModal] = useState(false);

  // Field help toggles
  const [ayuda, setAyuda] = useState({});

  const toggleAyuda = (field) => {
    setAyuda(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const [isLoading, setIsLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Calculate progress bar based on filled required fields
  const camposLlenosCount = [
    form.nombre.trim(),
    form.apellido.trim(),
    form.ci.trim(),
    form.fechaNacimiento,
    form.telefono.trim(),
    form.password
  ].filter(Boolean).length;

  const progresoPercent = Math.round((camposLlenosCount / 6) * 100);

  // Password strength meter
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', percent: 0 };
    if (pwd.length < 6) return { label: 'Débil (mínimo 8 recomendado)', color: 'var(--danger)', percent: 33 };
    if (pwd.length < 10 || !/\d/.test(pwd)) return { label: 'Media', color: 'var(--warning)', percent: 66 };
    return { label: 'Fuerte', color: 'var(--success)', percent: 100 };
  };

  const strength = getPasswordStrength(form.password);

  const validar = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) errs.apellido = 'El apellido es obligatorio';
    if (!form.ci.trim()) errs.ci = 'El CI es obligatorio';
    if (!form.fechaNacimiento) errs.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    if (!form.telefono.trim()) errs.telefono = 'El teléfono es obligatorio';
    if (!form.password) errs.password = 'La contraseña es obligatoria';
    else if (form.password.length < 4) errs.password = 'La contraseña debe tener al menos 4 caracteres';

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Correo electrónico no válido';
    }

    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');
    if (!terminosAceptados) {
      setGeneralError('Debe aceptar los Términos y Condiciones del Servicio');
      return;
    }

    if (validar()) {
      setShowRememberModal(true);
    }
  };

  const handleFinalRegister = async (rememberMe) => {
    setShowRememberModal(false);
    setIsLoading(true);
    setGeneralError('');

    try {
      await api.guardarCliente(form);

      // Automatic login
      const loginIdentifier = form.email.trim() ? form.email.trim() : form.ci.trim();
      try {
        const loginRes = await api.login(loginIdentifier, form.password);
        const rol = loginRes?.rol || 'paciente';
        
        const sessionData = {
          isLoggedIn: true,
          rol: rol,
          userId: loginRes?.id || loginRes?.id_usuario,
          identifier: loginIdentifier,
          rememberMe: rememberMe
        };

        if (rememberMe) {
          localStorage.setItem('dental_clinic_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('dental_clinic_session', JSON.stringify(sessionData));
        }

        onSuccess(sessionData);
      } catch (lErr) {
        onIniciarSesion();
      }
    } catch (err) {
      if (err.message?.includes('23505') || err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        setGeneralError('Este usuario ya fue registrado previamente.');
      } else {
        setGeneralError('Error al registrar la cuenta. Revisa tus datos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const tutorialSteps = [
    { title: "Nombre y Apellido", desc: "Sirve para identificarte formalmente en la clínica, agendar tus citas y generar tus recetas de forma correcta.", isOptional: false },
    { title: "Cédula de Identidad (CI)", desc: "Tu documento nacional único. Lo usamos para registrar tu expediente clínico de forma segura y evitar duplicados.", isOptional: false },
    { title: "Fecha de Nacimiento", desc: "Indispensable para calcular tu edad exacta y recetarte tratamientos dosificados de forma segura.", isOptional: false },
    { title: "Teléfono Celular", desc: "Se utilizará para enviarte recordatorios automáticos de tus citas programadas por WhatsApp.", isOptional: false },
    { title: "Correo Electrónico", desc: "Sirve para recibir recibos, confirmaciones y recuperar tu cuenta si lo requieres.", isOptional: true },
    { title: "Contraseña de la cuenta", desc: "Clave personal para resguardar tu cuenta e historial clínico.", isOptional: false }
  ];

  return (
    <div className="bg-decorated" style={{ minHeight: '100vh', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Help Button */}
      <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem' }}>
        <button onClick={() => setShowTutorial(true)} className="btn-icon" title="Ver guía de registro">
          <HelpCircle size={22} />
        </button>
      </div>

      <div style={{ maxWidth: '520px', width: '100%', marginTop: '1rem' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--frosted-mint)' }}>
            Crear Ficha de Paciente
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--celadon)' }}>
            Ingresa tus datos para registrarte en la clínica
          </p>
        </div>

        {/* Progress Bar */}
        <div className="glass-panel" style={{ padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--celadon-light)', marginBottom: '0.4rem', fontWeight: 600 }}>
            <span>Progreso del formulario</span>
            <span>{progresoPercent}% ({camposLlenosCount}/6)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(7,21,19,0.7)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${progresoPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--sea-green), var(--mint-leaf))',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Main Form */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <form onSubmit={handlePreSubmit}>
            
            {/* Nombre */}
            <div className="input-group">
              <div className="input-label">
                <span>Nombre *</span>
                <button type="button" onClick={() => toggleAyuda('nombre')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`input-field ${errores.nombre ? 'has-error' : ''}`}
                  placeholder="ej. Juan"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <User className="input-icon" size={18} />
              </div>
              {errores.nombre && <div className="input-error-msg">{errores.nombre}</div>}
              {ayuda.nombre && <div className="input-help-box">💡 Tu nombre oficial para la ficha médica.</div>}
            </div>

            {/* Apellido */}
            <div className="input-group">
              <div className="input-label">
                <span>Apellido *</span>
                <button type="button" onClick={() => toggleAyuda('apellido')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`input-field ${errores.apellido ? 'has-error' : ''}`}
                  placeholder="ej. Pérez"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
                <User className="input-icon" size={18} />
              </div>
              {errores.apellido && <div className="input-error-msg">{errores.apellido}</div>}
              {ayuda.apellido && <div className="input-help-box">💡 Tu apellido para el expediente clínico.</div>}
            </div>

            {/* CI */}
            <div className="input-group">
              <div className="input-label">
                <span>Cédula de Identidad (CI) *</span>
                <button type="button" onClick={() => toggleAyuda('ci')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`input-field ${errores.ci ? 'has-error' : ''}`}
                  placeholder="ej. 8392019"
                  value={form.ci}
                  onChange={(e) => setForm({ ...form, ci: e.target.value.replace(/\D/g, '') })}
                />
                <CreditCard className="input-icon" size={18} />
              </div>
              {errores.ci && <div className="input-error-msg">{errores.ci}</div>}
              {ayuda.ci && <div className="input-help-box">💡 Documento único para evitar duplicados en el registro médico.</div>}
            </div>

            {/* Fecha Nacimiento */}
            <div className="input-group">
              <div className="input-label">
                <span>Fecha de Nacimiento *</span>
                <button type="button" onClick={() => toggleAyuda('fechaNacimiento')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="date"
                  className={`input-field ${errores.fechaNacimiento ? 'has-error' : ''}`}
                  value={form.fechaNacimiento}
                  onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                />
                <Calendar className="input-icon" size={18} />
              </div>
              {errores.fechaNacimiento && <div className="input-error-msg">{errores.fechaNacimiento}</div>}
              {ayuda.fechaNacimiento && <div className="input-help-box">💡 Esencial para calcular tu edad y darte tratamientos seguros.</div>}
            </div>

            {/* Teléfono */}
            <div className="input-group">
              <div className="input-label">
                <span>Teléfono Celular *</span>
                <button type="button" onClick={() => toggleAyuda('telefono')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="tel"
                  className={`input-field ${errores.telefono ? 'has-error' : ''}`}
                  placeholder="ej. 77252558"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/[^\d+]/g, '') })}
                />
                <Phone className="input-icon" size={18} />
              </div>
              {errores.telefono && <div className="input-error-msg">{errores.telefono}</div>}
              {ayuda.telefono && <div className="input-help-box">💡 Se usa para recordarte citas por WhatsApp y emergencias.</div>}
            </div>

            {/* Email (Opcional) */}
            <div className="input-group">
              <div className="input-label">
                <span>Correo Electrónico (Opcional)</span>
                <button type="button" onClick={() => toggleAyuda('email')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type="email"
                  className={`input-field ${errores.email ? 'has-error' : ''}`}
                  placeholder="paciente@correo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
                />
                <Mail className="input-icon" size={18} />
              </div>
              {errores.email && <div className="input-error-msg">{errores.email}</div>}
              {ayuda.email && <div className="input-help-box">💡 OPCIONAL. Sirve para recibir tus recibos/recetas y recuperar tu contraseña.</div>}
            </div>

            {/* Contraseña */}
            <div className="input-group">
              <div className="input-label">
                <span>Contraseña *</span>
                <button type="button" onClick={() => toggleAyuda('password')} className="input-help-toggle"><HelpCircle size={15} /></button>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${errores.password ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Lock className="input-icon" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--sea-green)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errores.password && <div className="input-error-msg">{errores.password}</div>}
              
              {/* Strength Meter */}
              {form.password && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                    <span>Fuerza:</span>
                    <span>{strength.label}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(7,21,19,0.7)', borderRadius: '2px', marginTop: '0.2rem' }}>
                    <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}
              {ayuda.password && <div className="input-help-box">💡 Clave para iniciar sesión y mantener seguros tus tratamientos.</div>}
            </div>

            {/* Terms and conditions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.2rem 0', cursor: 'pointer' }} onClick={() => setTerminosAceptados(!terminosAceptados)}>
              <input
                type="checkbox"
                checked={terminosAceptados}
                onChange={(e) => setTerminosAceptados(e.target.checked)}
                style={{ accentColor: 'var(--mint-leaf)', width: '17px', height: '17px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--mint-light)' }}>
                Aceptar{' '}
                <a
                  href="https://oliv-dev-univ.github.io/trident-pages/terminos.html"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--mint-light)', textDecoration: 'underline' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Términos y Condiciones del Servicio
                </a>
              </span>
            </div>

            {/* General Error */}
            {generalError && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ff9999', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
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
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--celadon)' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={onIniciarSesion} style={{ background: 'none', border: 'none', color: 'var(--mint-light)', fontWeight: 700, cursor: 'pointer' }}>
            Inicia sesión aquí
          </button>
        </div>
      </div>

      {/* Tutorial Dialog Overlay */}
      {showTutorial && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--mint-light)', fontWeight: 700 }}>
                Guía de Registro ({tutorialStep + 1} de {tutorialSteps.length})
              </span>
              <button onClick={() => setShowTutorial(false)} style={{ background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                Omitir
              </button>
            </div>

            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sea-green), var(--mint-leaf))', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={32} color="var(--evergreen)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.5rem' }}>
              {tutorialSteps[tutorialStep].title}
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--celadon)', lineHeight: '1.5', minHeight: '70px' }}>
              {tutorialSteps[tutorialStep].desc}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="btn-outlined"
                  style={{ flex: 1 }}
                >
                  Anterior
                </button>
              )}
              <button
                onClick={() => {
                  if (tutorialStep < tutorialSteps.length - 1) {
                    setTutorialStep(tutorialStep + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {tutorialStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remember Me Prompt Modal */}
      {showRememberModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <CheckCircle size={44} color="var(--mint-leaf)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.5rem' }}>
              Recordar cuenta
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--celadon)', marginBottom: '1.5rem' }}>
              ¿Deseas recordar tu cuenta en este navegador para no tener que iniciar sesión la próxima vez?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleFinalRegister(false)} className="btn-outlined" style={{ flex: 1 }}>
                No
              </button>
              <button onClick={() => handleFinalRegister(true)} className="btn-primary" style={{ flex: 1 }}>
                Sí, recordar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
