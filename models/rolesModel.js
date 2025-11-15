// usuarios-service/models/rolesModel.js
import supabase from '../config/database.js';

class RolesModel {
  
  static async getAll() {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .order('nivel', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByCodigo(codigo) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getByNivel(nivel) {
    const { data, error } = await supabase
      .from('roles_sistema')
      .select('*')
      .eq('nivel', nivel)
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
}

export default RolesModel;