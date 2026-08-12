import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Stethoscope } from 'lucide-react';
import { api } from '../services/supabase';

export default function AgendarCitaModal({ user, sucursales, categorias, reglas, userSesiones, onDismiss, onSuccess }) {
  const [tipoPaciente, setTipoPaciente] = useState(null); // 'Nuevo' | 'Ortodoncia'
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  
  // Date & Time selection
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [selectedTime, setSelectedTime] = useState(null); // 'HH:mm:ss'
  const [horasOcupadas, setHorasOcupadas] = useState([]);

  const [isLoadingHoras, setIsLoadingHoras] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Duration check
  const isOrtodoncia = tipoPaciente === 'Ortodoncia' || selectedCategoria?.nombre?.toLowerCase().includes('ortodoncia');
  const duracionMinutos = useMemo(() => {
    if (isOrtodoncia) return 15;
    return selectedCategoria?.duracion || 30;
  }, [isOrtodoncia, selectedCategoria]);

  // Load occupied slots whenever selected date or sucursal changes
  useEffect(() => {
    if (selectedDate && selectedSucursal) {
      setIsLoadingHoras(true);
      api.getSesionesPorFechaYSucursal(selectedDate, selectedSucursal.id_sucursal)
        .then(sesiones => {
          setHorasOcupadas(sesiones.map(s => ({
            inicio: s.hora_inicio,
            fin: s.hora_fin
          })));
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingHoras(false));
    } else {
      setHorasOcupadas([]);
    }
  }, [selectedDate, selectedSucursal]);

  // Rule Validation for Day cell
  const isDayEnabled = (dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(dateObj);
    checkDate.setHours(0, 0, 0, 0);

    // Cannot book past dates
    if (checkDate < today) return false;

    const dayOfWeek = checkDate.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat

    // Pacientes Nuevos: Lunes (1) a Viernes (5)
    // Otros Pacientes (ej. Ortodoncia): Lunes (1) a Jueves (4)
    if (tipoPaciente === 'Nuevo') {
      if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    } else {
      if (dayOfWeek < 1 || dayOfWeek > 4) return false;
    }

    // Rule: Anticipation Max Days Rule
    const sucursalId = selectedSucursal?.id_sucursal;
    const regla = reglas.find(r => r.id_sucursal === sucursalId);

    if (regla && regla.dias_max) {
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + (regla.dias_max || 30));
      if (checkDate > maxDate) return false;
    }

    // Rule: Ortodoncia Specific Branch Days
    if (isOrtodoncia && selectedSucursal) {
      const dir = (selectedSucursal.direccion || '').toLowerCase();
      const isElAlto = sucursalId === 4 || dir.includes('alto');
      const isLaPaz = dir.includes('paz');

      if (isElAlto) {
        // Tuesday (2) or Thursday (4) ONLY
        if (dayOfWeek !== 2 && dayOfWeek !== 4) return false;
      } else if (isLaPaz) {
        // Monday (1) or Wednesday (3) ONLY
        if (dayOfWeek !== 1 && dayOfWeek !== 3) return false;
      }
    }

    return true;
  };

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleQuickDateSelect = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isDayEnabled(dateObj)) {
      setSelectedDate(dateStr);
      setSelectedTime(null);
      setErrorMessage('');
    } else {
      setErrorMessage('La fecha seleccionada no está disponible para atención.');
    }
  };

  // GenerateAvailableTimeSlots:
  // Pacientes Nuevos: 09:00 - 19:30 (Lunes a Viernes)
  // Pacientes Ortodoncia / Regular: 09:00 - 12:00 & 15:00 - 20:00 (Lunes a Jueves)
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots = [];
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateOfSlots = new Date(year, month - 1, day);

    if (tipoPaciente === 'Nuevo') {
      // Continuous shift for new patients: 09:00 (540 min) to 19:30 (1170 min)
      const startMins = 9 * 60; // 540
      const endMins = 19 * 60 + 30; // 1170

      for (let slotStartMinutes = startMins; slotStartMinutes < endMins; slotStartMinutes += 15) {
        const slotEndMinutes = slotStartMinutes + duracionMinutos;

        // Slot must end by shift limit (19:30 = 1170)
        if (slotEndMinutes > endMins) continue;

        const h = Math.floor(slotStartMinutes / 60);
        const m = slotStartMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

        const endH = Math.floor(slotEndMinutes / 60);
        const endM = slotEndMinutes % 60;
        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

        // Check if slot overlaps with any occupied range
        const isOccupied = horasOcupadas.some(occ => {
          const occStartParts = (occ.inicio || '').split(':').map(Number);
          const occEndParts = (occ.fin || '').split(':').map(Number);
          
          const occStartMins = occStartParts[0] * 60 + occStartParts[1];
          const occEndMins = occEndParts[0] * 60 + occEndParts[1];

          return slotStartMinutes < occEndMins && slotEndMinutes > occStartMins;
        });

        // Filter out past times if date is today
        const now = new Date();
        const isToday = dateOfSlots.toDateString() === now.toDateString();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const isPast = isToday && slotStartMinutes <= currentMins;

        if (!isOccupied && !isPast) {
          slots.push({
            time: timeStr,
            display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            endTime: endTimeStr
          });
        }
      }
    } else {
      // Morning shift: 09:00 - 12:00 | Afternoon shift: 15:00 - 20:00 (Mon-Thu)
      const shifts = [{ start: 9, end: 12 }, { start: 15, end: 20 }];

      shifts.forEach(shift => {
        for (let h = shift.start; h < shift.end; h++) {
          [0, 15, 30, 45].forEach(m => {
            const slotStartMinutes = h * 60 + m;
            const slotEndMinutes = slotStartMinutes + duracionMinutos;

            // Slot must end by shift end limit (12:00 or 20:00)
            const shiftEndMinutes = shift.end * 60;
            if (slotEndMinutes > shiftEndMinutes) return;

            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            const endH = Math.floor(slotEndMinutes / 60);
            const endM = slotEndMinutes % 60;
            const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

            // Check if slot overlaps with any occupied range
            const isOccupied = horasOcupadas.some(occ => {
              const occStartParts = (occ.inicio || '').split(':').map(Number);
              const occEndParts = (occ.fin || '').split(':').map(Number);
              
              const occStartMins = occStartParts[0] * 60 + occStartParts[1];
              const occEndMins = occEndParts[0] * 60 + occEndParts[1];

              return slotStartMinutes < occEndMins && slotEndMinutes > occStartMins;
            });

            // Filter out past times if date is today
            const now = new Date();
            const isToday = dateOfSlots.toDateString() === now.toDateString();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const isPast = isToday && slotStartMinutes <= currentMins;

            if (!isOccupied && !isPast) {
              slots.push({
                time: timeStr,
                display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                endTime: endTimeStr
              });
            }
          });
        }
      });
    }

    return slots;
  }, [selectedDate, duracionMinutos, horasOcupadas, tipoPaciente]);

  // Calendar Helper Functions
  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysCount = new Date(y, m + 1, 0).getDate();
    return { firstDay, daysCount, y, m };
  };

  const handleDateClick = (d) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const formatted = `${y}-${m}-${dayStr}`;

    const dateObj = new Date(y, currentMonth.getMonth(), d);
    if (isDayEnabled(dateObj)) {
      setSelectedDate(formatted);
      setSelectedTime(null);
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedSucursal) return;

    // Check active appointment restriction
    const todayStr = getTodayStr();
    const hasActiveAppointment = userSesiones.some(s => {
      const isFuture = s.fecha >= todayStr;
      const isPendingOrConfirmed = s.estado === 'Pendiente' || s.estado === 'Confirmada';
      return isFuture && isPendingOrConfirmed;
    });

    if (hasActiveAppointment) {
      setErrorMessage('No puedes agendar una nueva cita si ya tienes una cita pendiente o confirmada.');
      return;
    }

    // Overlap validation check
    const toMins = (tStr) => {
      if (!tStr) return 0;
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStartMins = toMins(selectedTime.time);
    const newEndMins = toMins(selectedTime.endTime);

    const isOverlap = horasOcupadas.some(occ => {
      const occStart = toMins(occ.inicio);
      const occEnd = toMins(occ.fin);
      return newStartMins < occEnd && newEndMins > occStart;
    });

    if (isOverlap) {
      setErrorMessage('No se puede agendar: Ya existe una cita ocupada a la misma hora.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const categoryId = tipoPaciente === 'Ortodoncia' ? 3 : (selectedCategoria?.id_categoria || 2);

      await api.agendarCita({
        id_cliente: user.userId,
        id_sucursal: selectedSucursal.id_sucursal,
        id_categoria: categoryId,
        fecha: selectedDate,
        hora_inicio: selectedTime.time,
        hora_fin: selectedTime.endTime,
        notas: `Cita ${tipoPaciente} agendada desde la Web`,
        estado: 'Confirmada'
      });

      onSuccess();
    } catch (err) {
      setErrorMessage('Error al agendar la cita: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 1: Patient Type Selector
  if (!tipoPaciente) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center' }}>
          <button onClick={onDismiss} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}>
            <X size={22} />
          </button>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.4rem' }}>
            Tipo de Paciente
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--celadon)', marginBottom: '1.75rem' }}>
            Por favor selecciona una opción para comenzar
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <button
              onClick={() => setTipoPaciente('Nuevo')}
              className="btn-primary"
              style={{ width: '100%', minHeight: '56px', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '0.6rem 1rem' }}
            >
              <span style={{ fontWeight: 700 }}>Paciente Nuevo (Consulta / Tratamientos)</span>
              <span style={{ fontSize: '0.78rem', opacity: 0.95, fontWeight: 400 }}>Horario: Lunes a Viernes de 09:00 a 19:30</span>
            </button>

            <button
              onClick={() => setTipoPaciente('Ortodoncia')}
              className="btn-secondary"
              style={{ width: '100%', minHeight: '56px', fontSize: '0.95rem', border: '1px solid var(--mint-leaf)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '0.6rem 1rem' }}
            >
              <span style={{ fontWeight: 700 }}>Paciente de Ortodoncia (Control / Diagnóstico)</span>
              <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 400 }}>Horario: Lunes a Jueves (09:00-12:00 / 15:00-20:00)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { firstDay, daysCount } = getDaysInMonth(currentMonth);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <button onClick={onDismiss} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--celadon)', cursor: 'pointer' }}>
          <X size={22} />
        </button>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--frosted-mint)', marginBottom: '0.2rem' }}>
          {tipoPaciente === 'Nuevo' ? 'Agendar Cita - Paciente Nuevo' : 'Agendar Cita - Paciente Ortodoncia'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--celadon)', marginBottom: '1rem' }}>
          Completa la sucursal, tratamiento y fecha deseada
        </p>

        {tipoPaciente === 'Nuevo' ? (
          <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid var(--sea-green)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: 'var(--frosted-mint)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} color="var(--mint-leaf)" style={{ flexShrink: 0 }} />
            <span><strong>Horario Pacientes Nuevos:</strong> Atención de Lunes a Viernes de 09:00 a 19:30</span>
          </div>
        ) : (
          <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: 'var(--celadon)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} color="var(--mint-leaf)" style={{ flexShrink: 0 }} />
            <span><strong>Horario Ortodoncia:</strong> Lunes a Jueves (09:00 - 12:00 / 15:00 - 20:00)</span>
          </div>
        )}

        {errorMessage && (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: '#ff9999', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {errorMessage}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Sucursal Selection */}
          <div>
            <label className="input-label" style={{ marginBottom: '0.4rem' }}>
              <span><MapPin size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sucursal *</span>
            </label>
            <select
              className="input-field"
              style={{ paddingLeft: '1rem' }}
              value={selectedSucursal?.id_sucursal || ''}
              onChange={(e) => {
                const found = sucursales.find(s => s.id_sucursal === Number(e.target.value));
                setSelectedSucursal(found || null);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
            >
              <option value="">-- Seleccionar Sucursal --</option>
              {sucursales.map(s => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.direccion} ({s.hora_apertura?.substring(0,5)} - {s.hora_cierre?.substring(0,5)})
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Category Selection (for Nuevo Paciente) */}
          {tipoPaciente === 'Nuevo' && (
            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem' }}>
                <span><Stethoscope size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tratamiento Deseado *</span>
              </label>
              <select
                className="input-field"
                style={{ paddingLeft: '1rem' }}
                value={selectedCategoria?.id_categoria || ''}
                onChange={(e) => {
                  const found = categorias.find(c => c.id_categoria === Number(e.target.value));
                  setSelectedCategoria(found || null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
              >
                <option value="">-- Seleccionar Tratamiento --</option>
                {categorias
                  .filter(c => !c.nombre.toLowerCase().includes('cirug'))
                  .map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre} ({c.duracion || 30} min)
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Calendar Date Picker */}
          {selectedSucursal && (tipoPaciente === 'Ortodoncia' || selectedCategoria) && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="input-label"><CalendarIcon size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Seleccionar Fecha</span>
                
                {/* Quick Hoy / Mañana buttons */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(getTodayStr())}
                    className={`btn-outlined ${selectedDate === getTodayStr() ? 'selected' : ''}`}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem', height: 'auto', background: selectedDate === getTodayStr() ? 'var(--sea-green)' : 'transparent', color: selectedDate === getTodayStr() ? '#fff' : 'var(--frosted-mint)' }}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDateSelect(getTomorrowStr())}
                    className={`btn-outlined ${selectedDate === getTomorrowStr() ? 'selected' : ''}`}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem', height: 'auto', background: selectedDate === getTomorrowStr() ? 'var(--sea-green)' : 'transparent', color: selectedDate === getTomorrowStr() ? '#fff' : 'var(--frosted-mint)' }}
                  >
                    Mañana
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--celadon)' }}>Calendario mensual:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    style={{ background: 'var(--dark-emerald)', border: 'none', color: 'var(--frosted-mint)', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--frosted-mint)', textTransform: 'capitalize' }}>
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    style={{ background: 'var(--dark-emerald)', border: 'none', color: 'var(--frosted-mint)', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Month Calendar Grid */}
              <div className="glass-card" style={{ padding: '0.8rem' }}>
                <div className="calendar-grid">
                  {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day, i) => (
                    <div key={i} className="calendar-day-header">{day}</div>
                  ))}

                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysCount }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                    const enabled = isDayEnabled(dateObj);
                    const y = currentMonth.getFullYear();
                    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
                    const dStr = String(dayNum).padStart(2, '0');
                    const fullDateStr = `${y}-${m}-${dStr}`;
                    const isSelected = selectedDate === fullDateStr;

                    return (
                      <div
                        key={dayNum}
                        className={`calendar-day-cell ${enabled ? '' : 'disabled'} ${isSelected ? 'selected' : ''}`}
                        onClick={() => enabled && handleDateClick(dayNum)}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time Slots Selector */}
          {selectedDate && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>
                <span><Clock size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Horarios Disponibles ({duracionMinutos} min)</span>
              </div>

              {isLoadingHoras ? (
                <div style={{ textAlign: 'center', color: 'var(--celadon)', padding: '1rem', fontSize: '0.85rem' }}>Cargando horarios...</div>
              ) : availableSlots.length === 0 ? (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                  No hay horarios libres disponibles para esta fecha.
                </div>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map(slot => (
                    <div
                      key={slot.time}
                      className={`slot-item ${selectedTime?.time === slot.time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot.display}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button onClick={onDismiss} className="btn-outlined" style={{ flex: 1 }}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={!selectedDate || !selectedTime || !selectedSucursal || isSubmitting}
            style={{ flex: 1 }}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar Cita'}
          </button>
        </div>
      </div>
    </div>
  );
}
