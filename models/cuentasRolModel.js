// usuarios-service/models/cuentasRolModel.js
import supabase from '../config/database.js';
class CuentasRolModel {
  // Obtener todas las cuentas de rol de un usuario
  static async getByUsuarioId(usuario_id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .select(`
        *,
        roles_sistema (
          codigo,
          nombre,
          nivel
        )
      `)
      .eq('usuario_id', usuario_id);
    
    if (error) throw error;
    return data || [];
  }

  // Crear cuenta de rol (asignar rol a usuario)
  static async create(cuentaRol) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .insert([{usuario_id: cuentaRol.usuario_id,tipo_rol_id: cuentaRol.tipo_rol_id,region_id: cuentaRol.region_id || null,departamento_id: cuentaRol.departamento_id || null,activo: true,created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  // Desactivar cuenta de rol
  static async desactivar(id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  // Activar cuenta de rol
  static async activar(id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .update({ activo: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  // Verificar si un usuario tiene un rol específico
  static async tieneRol(usuario_id, codigo_rol) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .select(`
        roles_sistema!inner (
          codigo
        )
      `)
      .eq('usuario_id', usuario_id)
      .eq('roles_sistema.codigo', codigo_rol)
      .eq('activo', true)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }
}

export default CuentasRolModel;