import React, { useState } from 'react';
import { Calendar, MapPin, MessageSquare, UserCheck, ChevronRight } from 'lucide-react';

export default function Onboarding({ onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Bienvenido a Trindent App",
      description: "Agenda y gestiona tus citas odontológicas fácilmente. Selecciona el tratamiento, la sucursal y el horario que mejor se adapte a ti.",
      icon: Calendar,
      color: "var(--mint-leaf)"
    },
    {
      title: "Nuestras Sucursales",
      description: "Contamos con sucursales cómodas y equipadas en pleno centro de La Paz (Edf. Esperanza) y en El Alto (Ceja, Plaza del Lustrabotas).",
      icon: MapPin,
      color: "var(--mint-light)"
    },
    {
      title: "Tu Salud Dental Primero",
      description: "Consulta tus citas programadas y contacta directamente con nuestros especialistas a través de WhatsApp para cualquier duda.",
      icon: MessageSquare,
      color: "var(--celadon)"
    },
    {
      title: "Regístrate en la App",
      description: "Crea tu cuenta en unos sencillos pasos para asegurar tu historial dental y comenzar a agendar tus citas de inmediato.",
      icon: UserCheck,
      color: "var(--celadon-light)"
    }
  ];

  const current = steps[currentStep];
  const IconComponent = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="bg-decorated" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem' }}>
      {/* Top bar with Skip button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {currentStep < steps.length - 1 && (
          <button
            onClick={onFinish}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--celadon-light)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.5rem 1rem'
            }}
          >
            Omitir
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        
        {/* Glow Icon Circle */}
        <div style={{
          position: 'relative',
          width: '150px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(62, 176, 155, 0.3) 0%, transparent 70%)'
          }} />
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'rgba(23, 60, 53, 0.8)',
            border: '2px solid var(--mint-leaf)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <IconComponent size={52} color={current.color} />
          </div>
        </div>

        {/* Text Card */}
        <div className="glass-panel" style={{ padding: '2rem 1.5rem', width: '100%', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.9rem' }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--celadon)', lineHeight: '1.6' }}>
            {current.description}
          </p>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '2rem' }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentStep ? '28px' : '9px',
                height: '9px',
                borderRadius: '5px',
                background: idx === currentStep ? 'var(--mint-leaf)' : 'rgba(38, 92, 81, 0.6)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="btn-primary"
          style={{ width: '100%', height: '54px', fontSize: '1.05rem' }}
        >
          <span>{currentStep === steps.length - 1 ? "Comenzar" : "Siguiente"}</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
