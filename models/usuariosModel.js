// usuarios-service/models/usuariosModel.js
import supabase from '../config/database.js';

class UsuariosModel {
  
  // Obtener todos los usuarios con sus roles y privilegios
static async getAll() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id, email, cedula, nombre_completo, telefono, activo,
      cuentas_rol (
        id, activo, region_id, departamento_id,
        roles_sistema (codigo, nombre, nivel)
      )
    `)
    .eq('activo', true)
    .order('nombre_completo', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

  // Obtener usuario por ID con toda su info
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
          roles_sistema (
            codigo,
            nombre,
            nivel
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuario por email
  static async getByEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        cuentas_rol (
          id,
          activo,
          region_id,
          departamento_id,
          roles_sistema (
            codigo,
            nombre,
            nivel
          )
        )
      `)
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuario por cédula
  static async getByCedula(cedula) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cedula', cedula)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Crear usuario (sin rol, eso va en cuentas_rol)
static async create(usuario) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      id: usuario.id,
      email: usuario.email,
      cedula: usuario.cedula,
      nombre_completo: usuario.nombre_completo,
      telefono: usuario.telefono || null,
      activo: true
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

  // Actualizar usuario
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

  // Soft delete (desactivar usuario)
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

  // Hard delete (eliminar físicamente)
  static async delete(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

static async getPrivilegiosByUsuarioId(usuario_id) {
  const { data, error } = await supabase
    .from('cuentas_rol')
    .select(`
      roles_sistema!inner (
        roles_privilegios (
          privilegios (codigo, nombre, categoria)
        )
      )
    `)
    .eq('usuario_id', usuario_id)
    .eq('activo', true);
  
  if (error) throw error;
  
  const privilegiosSet = new Set();
  data.forEach(cr => {
    cr.roles_sistema?.roles_privilegios?.forEach(rp => {
      if (rp.privilegios) {
        privilegiosSet.add(JSON.stringify(rp.privilegios));
      }
    });
  });
  
  return Array.from(privilegiosSet).map(p => JSON.parse(p));
}
}

export default UsuariosModel;