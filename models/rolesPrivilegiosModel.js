// usuarios-service/models/rolesPrivilegiosModel.js
import supabase from '../config/database.js';
class RolesPrivilegiosModel {
  // Asignar privilegio a rol
  static async asignar(rol_id, privilegio_id) {
    const { data, error } = await supabase
      .from('roles_privilegios')
      .insert([{
        rol_id,
        privilegio_id,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) {
      // Si ya existe, no es error
      if (error.code === '23505') {
        return { message: 'Privilegio ya asignado' };
      }
      throw error;
    }
    return data;
  }
  // Remover privilegio de rol
  static async remover(rol_id, privilegio_id) {
    const { error } = await supabase
      .from('roles_privilegios')
      .delete()
      .eq('rol_id', rol_id)
      .eq('privilegio_id', privilegio_id);
    
    if (error) throw error;
    return { message: 'Privilegio removido' };
  }
  // Obtener todos los privilegios de un rol
  static async getByRolId(rol_id) {
    const { data, error } = await supabase
      .from('roles_privilegios')
      .select(`
        privilegios (id,codigo,nombre,categoria)
      `)
      .eq('rol_id', rol_id);
    if (error) throw error;
    return data ? data.map(rp => rp.privilegios) : [];
  }
}
export default RolesPrivilegiosModel;