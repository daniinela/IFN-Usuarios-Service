// usuarios-service/models/privilegiosModel.js
import supabase from '../config/database.js';
class PrivilegiosModel {
  // Obtener todos los privilegios
  static async getAll() {
    const { data, error } = await supabase
      .from('privilegios')
      .select('*')
      .order('categoria', { ascending: true });
    if (error) throw error;
    return data || [];
  }
  // Obtener privilegios por categoría
  static async getByCategoria(categoria) {
    const { data, error } = await supabase
      .from('privilegios')
      .select('*')
      .eq('categoria', categoria)
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  // Crear privilegio (solo super_admin puede)
  static async create(privilegio) {
    const { data, error } = await supabase
      .from('privilegios')
      .insert([{codigo: privilegio.codigo,nombre: privilegio.nombre,categoria: privilegio.categoria,descripcion: privilegio.descripcion || null,creado_por: privilegio.creado_por,created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
export default PrivilegiosModel;