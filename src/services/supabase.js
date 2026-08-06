const BASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qpxgoltvnwaenqwwhilb.supabase.co/rest/v1/";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_sk3GOk3RA1-JIq1BZ762kA_sGRoKb4K";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

export const api = {
  // SUCURSALES
  async getSucursales() {
    try {
      const res = await fetch(`${BASE_URL}sucursal?select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener sucursales");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [
        { id_sucursal: 2, direccion: "La Paz", hora_apertura: "09:00:00", hora_cierre: "20:00:00" },
        { id_sucursal: 4, direccion: "El Alto", hora_apertura: "09:00:00", hora_cierre: "20:00:00" }
      ];
    }
  },

  // CATEGORIAS
  async getCategorias() {
    try {
      const res = await fetch(`${BASE_URL}categoria_cita?select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener categorías");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [
        { id_categoria: 2, nombre: "Consulta general", duracion: 30 },
        { id_categoria: 3, nombre: "Ortodoncia", duracion: 15 },
        { id_categoria: 4, nombre: "Estética dental", duracion: 30 },
        { id_categoria: 5, nombre: "Cirugía", duracion: 120 },
        { id_categoria: 6, nombre: "Endodoncia", duracion: 30 },
        { id_categoria: 7, nombre: "Atención a niños", duracion: 30 },
        { id_categoria: 8, nombre: "Placas dentales", duracion: 30 }
      ];
    }
  },

  // REGLAS SUCURSAL
  async getReglas() {
    try {
      const res = await fetch(`${BASE_URL}regla_sesion?select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener reglas");
      const data = await res.json();
      return data.map(r => ({
        id_regla: r.id_regla,
        id_sucursal: r.id_sucursal,
        dias_min: r.dias_min ?? r.dias_anticipacion_min ?? 2,
        dias_max: r.dias_max ?? r.dias_anticipacion_max ?? 30
      }));
    } catch (e) {
      console.error(e);
      return [
        { id_regla: 1, id_sucursal: 2, dias_min: 2, dias_max: 60 },
        { id_regla: 2, id_sucursal: 4, dias_min: 2, dias_max: 30 }
      ];
    }
  },

  // CLIENTES
  async getClientes() {
    try {
      const res = await fetch(`${BASE_URL}cliente?select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener clientes");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // LOGIN (RPC)
  async login(identifier, password) {
    try {
      const res = await fetch(`${BASE_URL}rpc/verificar_credenciales`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_email: identifier, p_password_hash: password })
      });
      if (!res.ok) throw new Error("Error en servidor al iniciar sesión");
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // GUARDAR CLIENTE / REGISTRO (RPC)
  async guardarCliente(data) {
    try {
      const res = await fetch(`${BASE_URL}rpc/guardar_cliente`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_nombre: data.nombre,
          p_apellido: data.apellido,
          p_email: data.email || null,
          p_fecha_nacimiento: data.fechaNacimiento,
          p_ci: data.ci,
          p_telefono: data.telefono,
          p_password_hash: data.password
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // GET SESIONES (TODAS - ADMIN)
  async getSesiones() {
    try {
      const res = await fetch(`${BASE_URL}sesion?select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener sesiones");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // GET SESIONES POR CLIENTE
  async getSesionesPorCliente(idCliente) {
    try {
      const res = await fetch(`${BASE_URL}sesion?id_cliente=eq.${idCliente}&select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener sesiones del cliente");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // GET SESIONES POR FECHA Y SUCURSAL
  async getSesionesPorFechaYSucursal(fechaStr, idSucursal) {
    try {
      const res = await fetch(`${BASE_URL}sesion?fecha=eq.${fechaStr}&id_sucursal=eq.${idSucursal}&select=*`, { headers });
      if (!res.ok) throw new Error("Error al obtener horas ocupadas");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  // AGENDAR CITA (DIRECTO O RPC)
  async agendarCita(sesionData) {
    try {
      const res = await fetch(`${BASE_URL}sesion`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id_sucursal: sesionData.id_sucursal,
          id_cliente: sesionData.id_cliente || null,
          id_categoria: sesionData.id_categoria,
          fecha: sesionData.fecha,
          hora_inicio: sesionData.hora_inicio,
          hora_fin: sesionData.hora_fin,
          notas: sesionData.notas || "Cita programada desde la Web",
          nombre_paciente: sesionData.nombre_paciente || null,
          estado: sesionData.estado || "Pendiente"
        })
      });
      if (res.ok) return true;

      const rpcRes = await fetch(`${BASE_URL}rpc/programar_sesion`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_id_sucursal: sesionData.id_sucursal,
          p_id_cliente: sesionData.id_cliente || null,
          p_id_categoria: sesionData.id_categoria,
          p_fecha: sesionData.fecha,
          p_hora_inicio: sesionData.hora_inicio,
          p_hora_fin: sesionData.hora_fin,
          p_notas: sesionData.notas || "Cita programada desde la Web",
          p_nombre_paciente: sesionData.nombre_paciente || null,
          p_estado: sesionData.estado || "Pendiente"
        })
      });
      if (!rpcRes.ok) {
        const err = await rpcRes.text();
        throw new Error(err);
      }
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // PROGRAMAR CIRUGÍA (USA programar_sesion CON CATEGORIA 5)
  async programarCirugia(cirugiaData) {
    try {
      const rpcRes = await fetch(`${BASE_URL}rpc/programar_sesion`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_id_sucursal: cirugiaData.id_sucursal,
          p_id_cliente: cirugiaData.id_cliente || null,
          p_id_categoria: 5,
          p_fecha: cirugiaData.fecha,
          p_hora_inicio: cirugiaData.hora_inicio,
          p_hora_fin: cirugiaData.hora_fin,
          p_notas: cirugiaData.notas || "Cirugía programada desde la Web",
          p_nombre_paciente: cirugiaData.nombre_paciente || null,
          p_estado: cirugiaData.estado || "Pendiente"
        })
      });
      if (rpcRes.ok) return true;

      // Fallback a agendarCita (inserción directa / RPC) con id_categoria 5
      return this.agendarCita({
        ...cirugiaData,
        id_categoria: 5
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // ACTUALIZAR SESION (ESTADO)
  async actualizarEstadoSesion(idSesion, nuevoEstado) {
    try {
      const res = await fetch(`${BASE_URL}sesion?id_sesion=eq.${idSesion}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) throw new Error("Error al actualizar sesión");
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  // ELIMINAR SESION
  async eliminarSesion(idSesion) {
    try {
      const res = await fetch(`${BASE_URL}sesion?id_sesion=eq.${idSesion}`, {
        method: "DELETE",
        headers
      });
      if (!res.ok) throw new Error("Error al eliminar sesión");
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
