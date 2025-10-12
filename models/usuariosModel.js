// usuarios-service/models/usuariosModel.js
import supabase from '../config/database.js';

class UsuariosModel {
  
  // Obtener todos los usuarios
  static async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Obtener usuario por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuario por email
  static async getByEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Obtener usuarios por rol
  static async getByRol(rol) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Crear usuario
  static async create(usuario) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        id: usuario.id,
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        telefono: usuario.telefono || null,
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

  // Eliminar usuario
  static async delete(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

export default UsuariosModel;