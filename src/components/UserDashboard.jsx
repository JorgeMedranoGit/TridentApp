import React, { useState, useEffect } from 'react';
import { LogOut, HelpCircle, Plus, Calendar, MapPin, MessageCircle, AlertCircle, X, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/supabase';
import AgendarCitaModal from './AgendarCitaModal';

export default function UserDashboard({ user, onLogout }) {
  const [sesiones, setSesiones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [reglas, setReglas] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  
  // Interactive Tour Guide state
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(1);

  // Check interactive guide seen status
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('has_seen_interactive_guide');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sucList, catList, regList, sesList] = await Promise.all([
        api.getSucursales(),
        api.getCategorias(),
        api.getReglas(),
        user?.userId ? api.getSesionesPorCliente(user.userId) : Promise.resolve([])
      ]);

      setSucursales(sucList);
      setCategorias(catList);
      setReglas(regList);
      setSesiones(sesList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCancelarCita = async (idSesion) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
    try {
      await api.actualizarEstadoSesion(idSesion, 'Cancelada');
      loadData();
    } catch (err) {
      alert('Error al cancelar la cita');
    }
  };

  const getSucursalNombre = (idSucursal) => {
    const found = sucursales.find(s => s.id_sucursal === idSucursal);
    return found ? found.direccion : `Sucursal #${idSucursal}`;
  };

  const getCategoriaNombre = (idCat) => {
    const found = categorias.find(c => c.id_categoria === idCat);
    return found ? found.nombre : `Tratamiento #${idCat}`;
  };

  const whatsappTemplate = encodeURIComponent(
`Para agendar una cita:
Lugar: 
Día: 
Hora: 
Nombre: 
Tratamiento: `
  );

  // Tabs for patient view (Active vs Finished appointments)
  const [patientTab, setPatientTab] = useState('activas');

  const citasActivas = sesiones.filter(s => {
    const est = (s.estado || '').toLowerCase();
    return est !== 'completada' && est !== 'cancelada';
  });

  const citasTerminadas = sesiones.filter(s => {
    const est = (s.estado || '').toLowerCase();
    return est === 'completada' || est === 'cancelada';
  });

  const currentPatientList = patientTab === 'activas' ? citasActivas : citasTerminadas;

  return (
    <div className="bg-decorated" style={{ minHeight: '100vh', padding: '1.5rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingTop: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--frosted-mint)' }}>
              Mis Citas
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--celadon)' }}>
              Consulta y agenda tus próximas visitas
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setShowGuide(true); setGuideStep(1); }}
              className="btn-icon"
              title="Guía interactiva"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={onLogout}
              className="btn-icon"
              title="Cerrar sesión"
              style={{ color: 'var(--frosted-mint)' }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content Section */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--mint-leaf)' }}>
            Cargando tus citas...
          </div>
        ) : (
          <>
            {/* Tabs for Active vs Finished Appointments */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setPatientTab('activas')}
                className={`btn-outlined ${patientTab === 'activas' ? 'selected' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.88rem',
                  background: patientTab === 'activas' ? 'var(--dark-emerald)' : 'transparent',
                  color: patientTab === 'activas' ? 'var(--frosted-mint)' : 'var(--celadon)',
                  borderColor: patientTab === 'activas' ? 'var(--mint-leaf)' : 'transparent'
                }}
              >
                Próximas Citas ({citasActivas.length})
              </button>

              <button
                onClick={() => setPatientTab('historial')}
                className={`btn-outlined ${patientTab === 'historial' ? 'selected' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.88rem',
                  background: patientTab === 'historial' ? 'var(--dark-emerald)' : 'transparent',
                  color: patientTab === 'historial' ? 'var(--frosted-mint)' : 'var(--celadon)',
                  borderColor: patientTab === 'historial' ? 'var(--mint-leaf)' : 'transparent'
                }}
              >
                Historial / Terminadas ({citasTerminadas.length})
              </button>
            </div>

            {/* Appointments List */}
            {currentPatientList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                <Calendar size={64} color="var(--sea-green)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--frosted-mint)', marginBottom: '0.4rem' }}>
                  {patientTab === 'activas' ? 'Sin citas pendientes' : 'Sin citas en el historial'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--celadon)', marginBottom: '1.5rem' }}>
                  {patientTab === 'activas' ? 'Agenda tu próxima cita en unos pocos pasos' : 'Las citas completadas o canceladas se guardarán en este historial'}
                </p>
                {patientTab === 'activas' && (
                  <button
                    onClick={() => setShowAgendarModal(true)}
                    className="btn-primary"
                    style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                  >
                    <Plus size={18} />
                    <span>Agendar cita</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentPatientList.map((sesion) => {
                    const estado = (sesion.estado || 'Pendiente').toLowerCase();
                    const badgeClass = `badge-${estado}`;

                    return (
                      <div key={sesion.id_sesion} className="glass-card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span className={`badge ${badgeClass}`}>
                              {sesion.estado || 'Pendiente'}
                            </span>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--frosted-mint)', marginTop: '0.4rem' }}>
                              {getCategoriaNombre(sesion.id_categoria)}
                            </h3>
                          </div>

                          {/* Cancel Button */}
                          {(estado === 'pendiente' || estado === 'confirmada') && (
                            <button
                              onClick={() => handleCancelarCita(sesion.id_sesion)}
                              style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.2rem' }}
                              title="Cancelar cita"
                            >
                              <Trash2 size={15} />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--celadon)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} color="var(--mint-leaf)" />
                            <span><strong>Fecha:</strong> {sesion.fecha}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} color="var(--mint-leaf)" />
                            <span><strong>Horario:</strong> {sesion.hora_inicio?.substring(0,5)} - {sesion.hora_fin?.substring(0,5)}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={16} color="var(--mint-leaf)" />
                            <span><strong>Sucursal:</strong> {getSucursalNombre(sesion.id_sucursal)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Schedule New Appointment Button */}
                {patientTab === 'activas' && (
                  <button
                    onClick={() => setShowAgendarModal(true)}
                    className="btn-primary"
                    style={{ width: '100%', height: '52px', marginTop: '1.25rem', fontSize: '1rem' }}
                  >
                    <Plus size={20} />
                    <span>Agendar nueva cita</span>
                  </button>
                )}
              </div>
            )}

            {/* Clinic Info & Locations Section */}
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '1rem' }}>
                Nuestras Sucursales
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                
                {/* La Paz */}
                <div className="glass-card" style={{ padding: '1.2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.3rem' }}>
                    Sucursal La Paz
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', lineHeight: '1.4', marginBottom: '0.8rem' }}>
                    A pocos pasos de la San Francisco, lado cotel Edf. Esperanza piso 10 of. 2.
                  </p>
                  <a
                    href="https://maps.google.com/?q=Edificio+Esperanza+La+Paz+Bolivia"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--mint-leaf)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <MapPin size={16} />
                    <span>Ver en Google Maps</span>
                  </a>
                </div>

                {/* El Alto */}
                <div className="glass-card" style={{ padding: '1.2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.3rem' }}>
                    Sucursal El Alto
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', lineHeight: '1.4', marginBottom: '0.8rem' }}>
                    Plena Ceja, Plaza de lustra botas galería Rosario, mezzanine Of. 1.
                  </p>
                  <a
                    href="https://maps.google.com/?q=Plaza+del+Lustrabotas+El+Alto+Bolivia"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--mint-leaf)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <MapPin size={16} />
                    <span>Ver en Google Maps</span>
                  </a>
                </div>
              </div>

              {/* Direct Doctor Contact via WhatsApp */}
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '1rem' }}>
                Contactar al Doctor
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <a
                  href={`https://wa.me/59177252558?text=${whatsappTemplate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outlined"
                  style={{ padding: '0.8rem', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  <MessageCircle size={18} color="var(--mint-leaf)" />
                  <span>77252558</span>
                </a>

                <a
                  href={`https://wa.me/59173520449?text=${whatsappTemplate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outlined"
                  style={{ padding: '0.8rem', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  <MessageCircle size={18} color="var(--mint-leaf)" />
                  <span>73520449</span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Agendar Cita Modal */}
      {showAgendarModal && (
        <AgendarCitaModal
          user={user}
          sucursales={sucursales}
          categorias={categorias}
          reglas={reglas}
          userSesiones={sesiones}
          onDismiss={() => setShowAgendarModal(false)}
          onSuccess={() => {
            setShowAgendarModal(false);
            loadData();
          }}
        />
      )}

      {/* Interactive Guided Tour Overlay */}
      {showGuide && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '440px' }}>
            
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--dark-emerald)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {guideStep === 1 && <LogOut size={26} color="var(--mint-leaf)" />}
              {guideStep === 2 && <Plus size={26} color="var(--mint-leaf)" />}
              {guideStep === 3 && <MessageCircle size={26} color="var(--mint-leaf)" />}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.4rem' }}>
              {guideStep === 1 ? 'Cerrar Sesión' : guideStep === 2 ? 'Agendar tu Cita' : 'Contacto Directo'}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--celadon)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {guideStep === 1 && 'Usa este botón en la esquina superior derecha para salir de tu cuenta de forma segura en cualquier momento.'}
              {guideStep === 2 && 'Presiona el botón de agregar (+ / Agendar) para elegir tu sucursal, tratamiento y fecha preferida.'}
              {guideStep === 3 && 'Si tienes preguntas o emergencias, puedes escribir directamente al doctor por WhatsApp usando los botones de contacto.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  localStorage.setItem('has_seen_interactive_guide', 'true');
                  setShowGuide(false);
                }}
                className="btn-outlined"
                style={{ flex: 1 }}
              >
                Omitir
              </button>
              <button
                onClick={() => {
                  if (guideStep < 3) {
                    setGuideStep(guideStep + 1);
                  } else {
                    localStorage.setItem('has_seen_interactive_guide', 'true');
                    setShowGuide(false);
                  }
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {guideStep === 3 ? 'Terminar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
