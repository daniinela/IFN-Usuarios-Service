// usuarios-service/models/usuariosModel.js
import supabase from '../config/database.js';

class UsuariosModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id, activo, region_id, departamento_id, municipio_id,
          roles_sistema (codigo, nombre, nivel)
        )
      `)
      .eq('activo', true)
      .order('nombre_completo', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id, activo, region_id, departamento_id, municipio_id,
          roles_sistema (codigo, nombre, nivel, descripcion)
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id, activo, region_id, departamento_id, municipio_id,
          roles_sistema (codigo, nombre, nivel)
        )
      `)
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByCedula(cedula) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cedula', cedula)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async create(usuario) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        id: usuario.id,
        email: usuario.email,
        cedula: usuario.cedula,
        nombre_completo: usuario.nombre_completo,
        telefono: usuario.telefono || null,
        municipio_residencia: usuario.municipio_residencia || null,
        titulos: usuario.titulos || [],
        experiencia_laboral: usuario.experiencia_laboral || [],
        disponibilidad: usuario.disponibilidad || [],
        info_extra_calificaciones: usuario.info_extra_calificaciones || null,
        estado_aprobacion: 'pendiente',
        activo: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async softDelete(id, motivo) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        activo: false,
        fecha_baja: new Date().toISOString(),
        motivo_baja: motivo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Usuarios pendientes de aprobación
  static async getPendientes() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('estado_aprobacion', 'pendiente')
      .eq('activo', true)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Aprobar usuario (Gestor de Recursos)
  static async aprobar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado_aprobacion: 'aprobado',
        fecha_aprobacion: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Rechazar usuario
  static async rechazar(id, motivo) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado_aprobacion: 'rechazado',
        motivo_baja: motivo,
        activo: false,
        fecha_baja: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByEstadoAprobacion(estado) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('estado_aprobacion', estado)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export default UsuariosModel;