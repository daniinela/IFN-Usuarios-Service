// usuarios-service/models/usuariosModel.js
import supabase from '../config/database.js';

class UsuariosModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id,
          activo,
          region_id,
          departamento_id,
          municipio_id,
          roles_sistema (*)
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id,
          activo,
          region_id,
          departamento_id,
          municipio_id,
          roles_sistema (*)
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async create(usuario) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        cedula: usuario.cedula,
        telefono: usuario.telefono,
        municipio_residencia: usuario.municipio_residencia,
        titulos: usuario.titulos || [],
        experiencia_laboral: usuario.experiencia_laboral || [],
        disponibilidad: usuario.disponibilidad || [],
        info_extra_calificaciones: usuario.info_extra_calificaciones,
        estado_aprobacion: 'pendiente'
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

  static async delete(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // CORREGIDO: Usar updated_at en lugar de created_at
  static async getPendientes() {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id,
          activo,
          region_id,
          departamento_id,
          municipio_id,
          roles_sistema (*)
        )
      `)
      .eq('estado_aprobacion', 'pendiente')
      .order('updated_at', { ascending: false }); // ← CAMBIO AQUÍ
    
    if (error) throw error;
    return data || [];
  }

  static async aprobar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado_aprobacion: 'aprobado',
        fecha_aprobacion: new Date().toISOString(),
        activo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async rechazar(id, motivo) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        estado_aprobacion: 'rechazado',
        fecha_aprobacion: new Date().toISOString(),
        motivo_baja: motivo,
        activo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async darDeBaja(id, motivo) {
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

  static async reactivar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        activo: true,
        fecha_baja: null,
        motivo_baja: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
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
}

export default UsuariosModel;