// Simulated in-memory database for testing without modifying production data

let sucursales = [
  { id_sucursal: 2, direccion: "La Paz (Edificio Esperanza)", hora_apertura: "09:00:00", hora_cierre: "20:00:00" },
  { id_sucursal: 4, direccion: "El Alto (Galería Rosario)", hora_apertura: "09:00:00", hora_cierre: "20:00:00" }
];

let categorias = [
  { id_categoria: 2, nombre: "Consulta general", duracion: 30, descripcion: "Revisión y diagnóstico general" },
  { id_categoria: 3, nombre: "Ortodoncia", duracion: 15, descripcion: "Control y ajuste de brackets" },
  { id_categoria: 4, nombre: "Estética dental", duracion: 30, descripcion: "Blanqueamiento y carillas" },
  { id_categoria: 5, nombre: "Cirugía", duracion: 120, descripcion: "Cirugía y extracciones complejas" },
  { id_categoria: 6, nombre: "Endodoncia", duracion: 30, descripcion: "Tratamiento de conducto" },
  { id_categoria: 7, nombre: "Atención a niños", duracion: 30, descripcion: "Odontopediatría" },
  { id_categoria: 8, nombre: "Placas dentales", duracion: 30, descripcion: "Prótesis dentales" }
];

let reglas = [
  { id_regla: 1, id_sucursal: 2, dias_min: 1, dias_max: 60 },
  { id_regla: 2, id_sucursal: 4, dias_min: 1, dias_max: 30 }
];

let clientes = [
  {
    id_cliente: 1,
    nombre: "Administrador",
    apellido: "Principal",
    email: "admin@dental.com",
    fecha_nacimiento: "1985-05-15",
    ci: "1234567",
    telefono: "73520449",
    password_hash: "admin123"
  },
  {
    id_cliente: 14,
    nombre: "Juan",
    apellido: "Perez",
    email: "juan@gmail.com",
    fecha_nacimiento: "1995-10-20",
    ci: "7654321",
    telefono: "70012345",
    password_hash: "paciente123"
  }
];

let sesiones = [
  {
    id_sesion: 101,
    id_sucursal: 2,
    id_cliente: 14,
    id_categoria: 2,
    fecha: "2026-09-10",
    hora_inicio: "09:00:00",
    hora_fin: "09:30:00",
    notas: "Consulta general agendada",
    estado: "Confirmada",
    nombre_paciente: "Juan Perez"
  },
  {
    id_sesion: 102,
    id_sucursal: 2,
    id_cliente: null,
    id_categoria: 5,
    fecha: "2026-09-10",
    hora_inicio: "10:00:00",
    hora_fin: "12:00:00",
    notas: "Cirugía de cordales",
    estado: "Confirmada",
    nombre_paciente: "Maria Gomez"
  }
];

let nextSesionId = 200;
let nextClienteId = 50;

export const mockApi = {
  // Reset memory to initial test state
  resetState() {
    sesiones = [
      {
        id_sesion: 101,
        id_sucursal: 2,
        id_cliente: 14,
        id_categoria: 2,
        fecha: "2026-09-10",
        hora_inicio: "09:00:00",
        hora_fin: "09:30:00",
        notas: "Consulta general agendada",
        estado: "Confirmada",
        nombre_paciente: "Juan Perez"
      },
      {
        id_sesion: 102,
        id_sucursal: 2,
        id_cliente: null,
        id_categoria: 5,
        fecha: "2026-09-10",
        hora_inicio: "10:00:00",
        hora_fin: "12:00:00",
        notas: "Cirugía de cordales",
        estado: "Confirmada",
        nombre_paciente: "Maria Gomez"
      }
    ];
    nextSesionId = 200;
  },

  async getSucursales() {
    return JSON.parse(JSON.stringify(sucursales));
  },

  async getCategorias() {
    return JSON.parse(JSON.stringify(categorias));
  },

  async getReglas() {
    return JSON.parse(JSON.stringify(reglas));
  },

  async getClientes() {
    return JSON.parse(JSON.stringify(clientes));
  },

  async login(identifier, password) {
    const ident = (identifier || "").trim().toLowerCase();
    // Special admin login
    if (ident === "admin" && password === "admin123") {
      return [{ id: 1, id_cliente: 1, rol: "admin", role: "admin", nombre: "Administrador", apellido: "General" }];
    }
    const found = clientes.find(c => 
      (c.email?.toLowerCase() === ident || c.ci === ident) && c.password_hash === password
    );
    if (!found) {
      throw new Error("Credenciales inválidas");
    }
    return [{ id: found.id_cliente, id_cliente: found.id_cliente, rol: "Cliente", role: "patient", nombre: found.nombre, apellido: found.apellido }];
  },

  async guardarCliente(data) {
    const newCli = {
      id_cliente: nextClienteId++,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email || null,
      fecha_nacimiento: data.fechaNacimiento,
      ci: data.ci,
      telefono: data.telefono,
      password_hash: data.password
    };
    clientes.push(newCli);
    return true;
  },

  async cambiarPassword({ ci, fechaNacimiento, newPassword }) {
    const cleanCi = String(ci || '').trim();
    const cleanFecha = String(fechaNacimiento || '').trim();
    const found = clientes.find(c => String(c.ci).trim() === cleanCi && c.fecha_nacimiento === cleanFecha);
    if (!found) {
      throw new Error("No se encontró ningún paciente con el CI y fecha de nacimiento proporcionados.");
    }
    found.password_hash = newPassword;
    return {
      success: true,
      nombre: found.nombre,
      apellido: found.apellido
    };
  },

  async getSesiones() {
    return JSON.parse(JSON.stringify(sesiones));
  },

  async getSesionesPorCliente(idCliente) {
    return JSON.parse(JSON.stringify(sesiones.filter(s => s.id_cliente === idCliente)));
  },

  async getSesionesPorFechaYSucursal(fechaStr, idSucursal) {
    return JSON.parse(JSON.stringify(
      sesiones.filter(s => s.fecha === fechaStr && s.id_sucursal === Number(idSucursal))
    ));
  },

  async agendarCita(sesionData) {
    const isBloqueo = sesionData.estado === 'Bloqueado' || (sesionData.notas || '').startsWith('[BLOQUEO]');
    if (!isBloqueo && !sesionData.id_cliente && !sesionData.nombre_paciente) {
      throw new Error("No se puede agendar una cita sin id_cliente ni nombre de paciente.");
    }

    const newSesion = {
      id_sesion: nextSesionId++,
      id_sucursal: Number(sesionData.id_sucursal),
      id_cliente: sesionData.id_cliente ? Number(sesionData.id_cliente) : null,
      id_categoria: Number(sesionData.id_categoria),
      fecha: sesionData.fecha,
      hora_inicio: sesionData.hora_inicio,
      hora_fin: sesionData.hora_fin,
      notas: sesionData.notas || "Cita agendada desde la Web",
      nombre_paciente: sesionData.nombre_paciente || null,
      estado: sesionData.estado || "Confirmada"
    };
    sesiones.push(newSesion);
    return true;
  },

  async programarCirugia(cirugiaData) {
    return this.agendarCita({
      ...cirugiaData,
      id_categoria: 5,
      notas: cirugiaData.notas || "Cirugía programada por Admin"
    });
  },

  async bloquearDia({ fecha, id_sucursal, motivo }) {
    const newBloqueo = {
      id_sesion: nextSesionId++,
      id_sucursal: Number(id_sucursal),
      id_cliente: null,
      id_categoria: 2,
      fecha: fecha,
      hora_inicio: "08:00:00",
      hora_fin: "20:00:00",
      notas: motivo ? `[BLOQUEO] ${motivo}` : "[BLOQUEO] Día bloqueado",
      estado: "Bloqueado",
      nombre_paciente: motivo ? `BLOQUEO: ${motivo}` : "DÍA BLOQUEADO"
    };
    sesiones.push(newBloqueo);
    return true;
  },

  async desbloquearDia(idSesion) {
    return this.eliminarSesion(idSesion);
  },

  async getBloqueos() {
    return JSON.parse(JSON.stringify(
      sesiones.filter(s => s.estado === "Bloqueado" || (s.notas || "").startsWith("[BLOQUEO]"))
    ));
  },

  async actualizarEstadoSesion(idSesion, nuevoEstado) {
    const found = sesiones.find(s => s.id_sesion === Number(idSesion));
    if (!found) throw new Error("Sesión no encontrada");
    found.estado = nuevoEstado;
    return true;
  },

  async eliminarSesion(idSesion) {
    const idx = sesiones.findIndex(s => s.id_sesion === Number(idSesion));
    if (idx !== -1) {
      sesiones.splice(idx, 1);
    }
    return true;
  }
};
