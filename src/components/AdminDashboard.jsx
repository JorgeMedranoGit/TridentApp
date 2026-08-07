import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, LogOut, Plus, ShieldAlert, Stethoscope, CheckCircle, Trash2, ChevronLeft, ChevronRight, X, Clock, User, MapPin } from 'lucide-react';
import { api } from '../services/supabase';

export default function AdminDashboard({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendarToggle, setShowCalendarToggle] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [sesiones, setSesiones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab for active vs finished appointments
  const [adminTab, setAdminTab] = useState('activas'); // 'activas' | 'terminadas'

  // Modals state
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCirugiaModal, setShowCirugiaModal] = useState(false);
  const [showBloquearModal, setShowBloquearModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sucList, cliList, catList, sesList] = await Promise.all([
        api.getSucursales(),
        api.getClientes(),
        api.getCategorias(),
        api.getSesiones()
      ]);

      setSucursales(sucList);
      setClientes(cliList);
      setCategorias(catList);
      setSesiones(sesList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter appointments for selected date
  const citasDelDia = useMemo(() => {
    return sesiones
      .filter(s => s.fecha === selectedDate)
      .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [sesiones, selectedDate]);

  // Separate active vs completed/canceled appointments
  const citasActivasDelDia = useMemo(() => {
    return citasDelDia.filter(s => {
      const est = (s.estado || '').toLowerCase();
      return est !== 'completada' && est !== 'cancelada';
    });
  }, [citasDelDia]);

  const citasTerminadasDelDia = useMemo(() => {
    return citasDelDia.filter(s => {
      const est = (s.estado || '').toLowerCase();
      return est === 'completada' || est === 'cancelada';
    });
  }, [citasDelDia]);

  // Resumen del día statistics
  const stats = useMemo(() => {
    const total = citasDelDia.length;
    const completadas = citasDelDia.filter(s => (s.estado || '').toLowerCase() === 'completada').length;
    const pendientes = citasDelDia.filter(s => (s.estado || '').toLowerCase() === 'pendiente' || (s.estado || '').toLowerCase() === 'confirmada').length;
    const cirugias = citasDelDia.filter(s => s.id_categoria === 5 || (s.notas || '').toLowerCase().includes('cirug')).length;
    return { total, completadas, pendientes, cirugias };
  }, [citasDelDia]);

  const handleCompletar = async (idSesion) => {
    try {
      await api.actualizarEstadoSesion(idSesion, 'Completada');
      loadData();
    } catch (err) {
      alert('Error al marcar como completada');
    }
  };

  const handleCancelar = async (idSesion) => {
    if (!window.confirm('¿Deseas cancelar/eliminar esta cita?')) return;
    try {
      await api.eliminarSesion(idSesion);
      loadData();
    } catch (err) {
      alert('Error al cancelar la cita');
    }
  };

  const getSucursalNombre = (idSuc) => {
    const found = sucursales.find(s => s.id_sucursal === idSuc);
    return found ? found.direccion : `Sucursal #${idSuc}`;
  };

  const getCategoriaNombre = (idCat) => {
    const found = categorias.find(c => c.id_categoria === idCat);
    return found ? found.nombre : `Categoría #${idCat}`;
  };

  const getPacienteNombre = (sesion) => {
    if (sesion.nombre_paciente) return sesion.nombre_paciente;
    if (sesion.id_cliente) {
      const cli = clientes.find(c => c.id_cliente === sesion.id_cliente);
      if (cli) return `${cli.nombre || ''} ${cli.apellido || ''}`.trim();
    }
    return 'Paciente Externo / General';
  };

  // Calendar Helpers for top date selector
  const daysInMonthObj = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysCount = new Date(y, m + 1, 0).getDate();
    return { firstDay, daysCount };
  }, [calendarMonth]);

  const todayStr = new Date().toISOString().split('T')[0];

  const currentList = adminTab === 'activas' ? citasActivasDelDia : citasTerminadasDelDia;

  return (
    <div className="bg-decorated" style={{ minHeight: '100vh', padding: '1.5rem', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Header Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingTop: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--mint-leaf)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Panel de Administración
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--frosted-mint)', textTransform: 'capitalize' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="btn-outlined"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
            >
              Hoy
            </button>

            <button
              onClick={() => setShowCalendarToggle(!showCalendarToggle)}
              className="btn-icon"
              title="Seleccionar Fecha"
            >
              <CalendarIcon size={20} />
            </button>

            <button
              onClick={onLogout}
              className="btn-icon"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Toggleable Date Calendar */}
        {showCalendarToggle && (
          <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 800, color: 'var(--frosted-mint)', textTransform: 'capitalize' }}>
                {calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="calendar-grid">
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d, i) => (
                <div key={i} className="calendar-day-header">{d}</div>
              ))}
              {Array.from({ length: daysInMonthObj.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonthObj.daysCount }).map((_, i) => {
                const dayNum = i + 1;
                const y = calendarMonth.getFullYear();
                const m = String(calendarMonth.getMonth() + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const fullStr = `${y}-${m}-${dStr}`;
                const isSelected = selectedDate === fullStr;

                return (
                  <div
                    key={dayNum}
                    className={`calendar-day-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDate(fullStr);
                      setShowCalendarToggle(false);
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen del Día Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--celadon-light)', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--frosted-mint)' }}>{stats.total}</div>
          </div>
          <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#64b5f6', fontWeight: 600 }}>Completadas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#64b5f6' }}>{stats.completadas}</div>
          </div>
          <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#ffb74d', fontWeight: 600 }}>Pendientes</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffb74d' }}>{stats.pendientes}</div>
          </div>
          <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--mint-light)', fontWeight: 600 }}>Cirugías</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--mint-light)' }}>{stats.cirugias}</div>
          </div>
        </div>

        {/* Tabs for Active vs Finished Appointments */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setAdminTab('activas')}
            className={`btn-outlined ${adminTab === 'activas' ? 'selected' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.88rem',
              background: adminTab === 'activas' ? 'var(--dark-emerald)' : 'transparent',
              color: adminTab === 'activas' ? 'var(--frosted-mint)' : 'var(--celadon)',
              borderColor: adminTab === 'activas' ? 'var(--mint-leaf)' : 'transparent'
            }}
          >
            Citas Activas ({citasActivasDelDia.length})
          </button>

          <button
            onClick={() => setAdminTab('terminadas')}
            className={`btn-outlined ${adminTab === 'terminadas' ? 'selected' : ''}`}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.88rem',
              background: adminTab === 'terminadas' ? 'var(--dark-emerald)' : 'transparent',
              color: adminTab === 'terminadas' ? 'var(--frosted-mint)' : 'var(--celadon)',
              borderColor: adminTab === 'terminadas' ? 'var(--mint-leaf)' : 'transparent'
            }}
          >
            Citas Terminadas / Historial ({citasTerminadasDelDia.length})
          </button>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mint-leaf)' }}>Cargando agenda...</div>
        ) : currentList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <CalendarIcon size={56} color="var(--sea-green)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--frosted-mint)' }}>
              {adminTab === 'activas' ? 'No hay citas activas para este día' : 'No hay citas terminadas en el historial para este día'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginTop: '0.25rem' }}>
              {adminTab === 'activas' ? 'Usa los botones flotantes de abajo para agregar una cita o cirugía.' : 'Las citas completadas o canceladas aparecerán en esta sección.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {currentList.map(sesion => {
              const estado = (sesion.estado || 'Pendiente').toLowerCase();
              const badgeClass = `badge-${estado}`;

              return (
                <div key={sesion.id_sesion} className="glass-card" style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div>
                      <span className={`badge ${badgeClass}`}>{sesion.estado || 'Pendiente'}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--frosted-mint)', marginTop: '0.4rem' }}>
                        {getPacienteNombre(sesion)}
                      </h3>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {estado !== 'completada' && (
                        <button
                          onClick={() => handleCompletar(sesion.id_sesion)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                          title="Marcar como completada"
                        >
                          <CheckCircle size={14} color="var(--mint-light)" />
                          <span>Completar</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelar(sesion.id_sesion)}
                        style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', padding: '0.35rem' }}
                        title="Cancelar / Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--celadon)' }}>
                    <div><strong>Tratamiento:</strong> {getCategoriaNombre(sesion.id_categoria)}</div>
                    <div><strong>Horario:</strong> {sesion.hora_inicio?.substring(0,5)} - {sesion.hora_fin?.substring(0,5)}</div>
                    <div><strong>Sucursal:</strong> {getSucursalNombre(sesion.id_sucursal)}</div>
                    <div><strong>Notas:</strong> {sesion.notas || 'Sin notas'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons Bar (Admin Controls) */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.75rem',
        zIndex: 99
      }}>
        <button
          onClick={() => setShowBloquearModal(true)}
          className="btn-secondary"
          style={{ borderRadius: '14px', boxShadow: 'var(--shadow-card)', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
        >
          <ShieldAlert size={16} color="var(--danger)" />
          <span>Bloquear día</span>
        </button>

        <button
          onClick={() => setShowCirugiaModal(true)}
          className="btn-secondary"
          style={{ borderRadius: '14px', boxShadow: 'var(--shadow-card)', padding: '0.6rem 1rem', fontSize: '0.85rem' }}
        >
          <Stethoscope size={16} color="var(--mint-light)" />
          <span>Programar cirugía</span>
        </button>

        <button
          onClick={() => setShowAgregarModal(true)}
          className="btn-primary"
          style={{ borderRadius: '16px', padding: '0.85rem 1.2rem', fontSize: '0.95rem' }}
        >
          <Plus size={20} />
          <span>Agregar Cita</span>
        </button>
      </div>

      {/* MODAL 1: Agregar Cita Admin */}
      {showAgregarModal && (
        <AdminCitaModal
          selectedDate={selectedDate}
          sucursales={sucursales}
          clientes={clientes}
          sesiones={sesiones}
          onDismiss={() => setShowAgregarModal(false)}
          onSuccess={() => { setShowAgregarModal(false); loadData(); }}
        />
      )}

      {/* MODAL 2: Programar Cirugía Admin */}
      {showCirugiaModal && (
        <AdminCirugiaModal
          selectedDate={selectedDate}
          sucursales={sucursales}
          clientes={clientes}
          sesiones={sesiones}
          onDismiss={() => setShowCirugiaModal(false)}
          onSuccess={() => { setShowCirugiaModal(false); loadData(); }}
        />
      )}

      {/* MODAL 3: Bloquear Día */}
      {showBloquearModal && (
        <AdminBloquearModal
          selectedDate={selectedDate}
          onDismiss={() => setShowBloquearModal(false)}
          onSuccess={(motivo) => {
            alert(`Día ${selectedDate} bloqueado correctamente. Motivo: ${motivo}`);
            setShowBloquearModal(false);
          }}
        />
      )}
    </div>
  );
}

// Sub-component: Admin Cita Modal
function AdminCitaModal({ selectedDate, sucursales, clientes, sesiones, onDismiss, onSuccess }) {
  const [fechaCita, setFechaCita] = useState(selectedDate);
  const [paciente, setPaciente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id_sucursal || 2);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('09:30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto calculate default end time when start time changes if end time is earlier
  const handleHoraInicioChange = (e) => {
    const newStart = e.target.value;
    setHoraInicio(newStart);

    if (newStart) {
      const [h, m] = newStart.split(':').map(Number);
      const endMins = h * 60 + m + 30;
      const endH = Math.floor(endMins / 60);
      const remM = endMins % 60;
      const calcEnd = `${String(endH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
      setHoraFin(calcEnd);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paciente.trim() && !clienteId) return;

    setErrorMessage('');

    const toMins = (tStr) => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };

    const sMins = toMins(horaInicio);
    const eMins = toMins(horaFin);
    const targetSucursal = Number(sucursalId || sucursales[0]?.id_sucursal || 2);

    if (eMins <= sMins) {
      setErrorMessage('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const dateParts = fechaCita.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek < 1 || dayOfWeek > 4) {
      setErrorMessage('⚠️ La atención es únicamente de Lunes a Jueves.');
      return;
    }

    // Clinic Schedule Validation (09:00 - 12:00 & 15:00 - 19:00)
    const mStart = 9 * 60; // 09:00
    const mEnd = 12 * 60; // 12:00
    const aStart = 15 * 60; // 15:00
    const aEnd = 19 * 60; // 19:00 (7 PM)

    const inMorning = sMins >= mStart && eMins <= mEnd;
    const inAfternoon = sMins >= aStart && eMins <= aEnd;

    if (!inMorning && !inAfternoon) {
      setErrorMessage('⚠️ El horario de atención es de 09:00 a 12:00 y de 15:00 a 19:00.');
      return;
    }

    // Double booking validation
    const hasOverlap = (sesiones || []).some(s => {
      if (s.fecha !== fechaCita) return false;
      if (Number(s.id_sucursal) !== targetSucursal) return false;
      if ((s.estado || '').toLowerCase() === 'cancelada') return false;

      const occStart = toMins(s.hora_inicio);
      const occEnd = toMins(s.hora_fin);

      return sMins < occEnd && eMins > occStart;
    });

    if (hasOverlap) {
      setErrorMessage('⚠️ No se puede agendar: Ya existe otra cita registrada a esta misma hora y sucursal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedStart = horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio;
      const formattedEnd = horaFin.length === 5 ? `${horaFin}:00` : horaFin;

      await api.agendarCita({
        id_sucursal: targetSucursal,
        id_cliente: clienteId ? Number(clienteId) : null,
        id_categoria: 2, // Consulta general
        fecha: fechaCita,
        hora_inicio: formattedStart,
        hora_fin: formattedEnd,
        notas: tratamiento || 'Cita agendada por Administrador',
        nombre_paciente: paciente || null,
        estado: 'Confirmada'
      });
      onSuccess();
    } catch (err) {
      setErrorMessage('Error al agendar cita admin: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onDismiss} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}>
          <X size={22} />
        </button>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.3rem' }}>
          Nueva Cita Admin
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginBottom: '1.2rem' }}>
          Ingresa la fecha, hora de inicio y fin para la cita
        </p>

        {errorMessage && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ff9999', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          
          {/* Select Registered Client */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Vincular Paciente Registrado (Opcional)</label>
            <select
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={clienteId}
              onChange={(e) => {
                const cId = e.target.value;
                setClienteId(cId);
                if (cId) {
                  const cli = clientes.find(c => c.id_cliente === Number(cId));
                  if (cli) setPaciente(`${cli.nombre || ''} ${cli.apellido || ''}`.trim());
                }
              }}
            >
              <option value="">-- Ninguno / Paciente Externo --</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido} (CI: {c.ci})
                </option>
              ))}
            </select>
          </div>

          {/* Nombre Paciente */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Nombre del Paciente *</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="input-field"
                placeholder="Nombre completo"
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                required
              />
              <User className="input-icon" size={18} />
            </div>
          </div>

          {/* Tratamiento */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Tratamiento / Descripción</label>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              placeholder="ej. Limpieza dental"
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
            />
          </div>

          {/* Sucursal */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Sucursal</label>
            <select
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
            >
              {sucursales.map(s => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.direccion}</option>
              ))}
            </select>
          </div>

          {/* Día / Fecha */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Día / Fecha</label>
            <input
              type="date"
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={fechaCita}
              onChange={(e) => setFechaCita(e.target.value)}
              required
            />
          </div>

          {/* Hora Inicio y Hora Fin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Hora de Inicio</label>
              <input
                type="time"
                className="input-field"
                style={{ paddingLeft: '1rem' }}
                value={horaInicio}
                onChange={handleHoraInicioChange}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Hora de Fin</label>
              <input
                type="time"
                className="input-field"
                style={{ paddingLeft: '1rem' }}
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onDismiss} className="btn-outlined" style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
              {isSubmitting ? 'Guardando...' : 'Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Admin Cirugia Modal
function AdminCirugiaModal({ selectedDate, sucursales, clientes, sesiones, onDismiss, onSuccess }) {
  const [fechaCirugia, setFechaCirugia] = useState(selectedDate);
  const [paciente, setPaciente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id_sucursal || 2);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('11:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleHoraInicioChange = (e) => {
    const newStart = e.target.value;
    setHoraInicio(newStart);

    if (newStart) {
      const [h, m] = newStart.split(':').map(Number);
      const endMins = (h + 2) * 60 + m; // 2 hour duration default for surgery
      const endH = Math.floor(endMins / 60);
      const remM = endMins % 60;
      const calcEnd = `${String(endH).padStart(2, '0')}:${String(remM).padStart(2, '0')}`;
      setHoraFin(calcEnd);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paciente.trim()) return;

    setErrorMessage('');

    const toMins = (tStr) => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };

    const sMins = toMins(horaInicio);
    const eMins = toMins(horaFin);
    const targetSucursal = Number(sucursalId || sucursales[0]?.id_sucursal || 2);

    if (eMins <= sMins) {
      setErrorMessage('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const dateParts = fechaCirugia.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek < 1 || dayOfWeek > 4) {
      setErrorMessage('⚠️ La atención es únicamente de Lunes a Jueves.');
      return;
    }

    // Clinic Schedule Validation (09:00 - 12:00 & 15:00 - 19:00)
    const mStart = 9 * 60; // 09:00
    const mEnd = 12 * 60; // 12:00
    const aStart = 15 * 60; // 15:00
    const aEnd = 19 * 60; // 19:00 (7 PM)

    const inMorning = sMins >= mStart && eMins <= mEnd;
    const inAfternoon = sMins >= aStart && eMins <= aEnd;

    if (!inMorning && !inAfternoon) {
      setErrorMessage('⚠️ El horario de atención es de 09:00 a 12:00 y de 15:00 a 19:00.');
      return;
    }

    // Double booking validation
    const hasOverlap = (sesiones || []).some(s => {
      if (s.fecha !== fechaCirugia) return false;
      if (Number(s.id_sucursal) !== targetSucursal) return false;
      if ((s.estado || '').toLowerCase() === 'cancelada') return false;

      const occStart = toMins(s.hora_inicio);
      const occEnd = toMins(s.hora_fin);

      return sMins < occEnd && eMins > occStart;
    });

    if (hasOverlap) {
      setErrorMessage('⚠️ No se puede agendar la cirugía: Ya existe una cita activa en ese rango de horario.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedStart = horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio;
      const formattedEnd = horaFin.length === 5 ? `${horaFin}:00` : horaFin;

      await api.programarCirugia({
        id_sucursal: targetSucursal,
        id_cliente: clienteId ? Number(clienteId) : null,
        fecha: fechaCirugia,
        hora_inicio: formattedStart,
        hora_fin: formattedEnd,
        notas: descripcion || 'Cirugía quirúrgica programada por Admin',
        nombre_paciente: paciente
      });
      onSuccess();
    } catch (err) {
      setErrorMessage('Error al programar cirugía: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onDismiss} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}>
          <X size={22} />
        </button>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.3rem' }}>
          Programar Cirugía Quirúrgica
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginBottom: '1.2rem' }}>
          Bloqueará el rango de horario deseado para la cirugía
        </p>

        {errorMessage && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ff9999', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Vincular Paciente Registrado (Opcional)</label>
            <select
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={clienteId}
              onChange={(e) => {
                const cId = e.target.value;
                setClienteId(cId);
                if (cId) {
                  const cli = clientes.find(c => c.id_cliente === Number(cId));
                  if (cli) setPaciente(`${cli.nombre || ''} ${cli.apellido || ''}`.trim());
                }
              }}
            >
              <option value="">-- Ninguno / Paciente Externo --</option>
              {clientes.map(c => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido} (CI: {c.ci})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Nombre del Paciente *</label>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              placeholder="Nombre del paciente"
              value={paciente}
              onChange={(e) => setPaciente(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Tipo de Cirugía / Descripción</label>
            <textarea
              className="input-field"
              style={{ paddingLeft: '1rem', minHeight: '60px' }}
              placeholder="Detalles de la operación"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Sucursal</label>
            <select
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
            >
              {sucursales.map(s => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.direccion}</option>
              ))}
            </select>
          </div>

          {/* Día / Fecha */}
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Día / Fecha</label>
            <input
              type="date"
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={fechaCirugia}
              onChange={(e) => setFechaCirugia(e.target.value)}
              required
            />
          </div>

          {/* Hora Inicio y Hora Fin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Hora de Inicio</label>
              <input
                type="time"
                className="input-field"
                style={{ paddingLeft: '1rem' }}
                value={horaInicio}
                onChange={handleHoraInicioChange}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Hora de Fin</label>
              <input
                type="time"
                className="input-field"
                style={{ paddingLeft: '1rem' }}
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onDismiss} className="btn-outlined" style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
              {isSubmitting ? 'Programando...' : 'Programar Cirugía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Admin Bloquear Día Modal
function AdminBloquearModal({ selectedDate, onDismiss, onSuccess }) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (!motivo.trim()) return;
    onSuccess(motivo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onDismiss} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}>
          <X size={22} />
        </button>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.3rem' }}>
          Bloquear Día Completo
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginBottom: '1.2rem' }}>
          Fecha a bloquear: {selectedDate}
        </p>

        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#ffb74d', marginBottom: '1rem' }}>
          ⚠️ Esto inhabilitará todos los horarios disponibles para los pacientes en la fecha seleccionada.
        </div>

        <div className="input-group">
          <label className="input-label">Motivo del bloqueo *</label>
          <textarea
            className="input-field"
            style={{ paddingLeft: '1rem', minHeight: '80px' }}
            placeholder="ej. Mantenimiento de equipos / Feriado médico"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={onDismiss} className="btn-outlined" style={{ flex: 1 }}>Cancelar</button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-danger"
            disabled={!motivo.trim()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Bloquear Día
          </button>
        </div>
      </div>
    </div>
  );
}
