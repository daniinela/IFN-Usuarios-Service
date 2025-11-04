// usuarios-service/models/rolesModel.js
import supabase from '../config/database.js';
class RolesModel {
  // Obtener todos los roles
  static async getAll() {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .order('nivel', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  // Obtener rol por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
  // Obtener rol por código
  static async getByCodigo(codigo) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  // Crear rol (solo super_admin puede)
  static async create(rol) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .insert([{codigo: rol.codigo,nombre: rol.nombre,nivel: rol.nivel,descripcion: rol.descripcion || null,creado_por: rol.creado_por,created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  // Obtener privilegios de un rol
  static async getPrivilegiosByRolId(rol_id) {
    const { data, error } = await supabase
      .from('roles_privilegios')
      .select(`privilegios (id,codigo,nombre,categoria,descripcion
        )
      `)
      .eq('rol_id', rol_id);
    
    if (error) throw error;
    return data ? data.map(rp => rp.privilegios) : [];
  }
}
export default RolesModel;