// usuarios-service/models/usuariosModel.js
import supabase from '../config/database.js';

class UsuariosModel {
  
  // Obtener todos los usuarios con sus roles y privilegios
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
          roles_sistema (
            codigo,
            nombre,
            nivel
          )
        )
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    
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
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

  // Obtener privilegios de un usuario
  static async getPrivilegiosByUsuarioId(usuario_id) {
    // Obtener cuentas de rol del usuario
    const { data: cuentas, error: cuentasError } = await supabase
      .from('cuentas_rol')
      .select('tipo_rol_id')
      .eq('usuario_id', usuario_id)
      .eq('activo', true);
    
    if (cuentasError) throw cuentasError;
    if (!cuentas || cuentas.length === 0) return [];

    // Obtener privilegios de esos roles
    const rolesIds = cuentas.map(c => c.tipo_rol_id);
    
    const { data, error } = await supabase
      .from('roles_privilegios')
      .select(`
        privilegios (
          codigo,
          nombre,
          categoria
        )
      `)
      .in('rol_id', rolesIds);
    
    if (error) throw error;
    
    // Extraer solo los privilegios únicos
    const privilegios = data
      .map(rp => rp.privilegios)
      .filter((p, index, self) => 
        self.findIndex(t => t.codigo === p.codigo) === index
      );
    
    return privilegios;
  }
}

export default UsuariosModel;