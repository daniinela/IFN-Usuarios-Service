// usuarios-service/models/cuentasRolModel.js
import supabase from '../config/database.js';

class CuentasRolModel {
  
static async getByUsuarioId(usuario_id) {
  console.log('📊 Consultando cuentas_rol para:', usuario_id);
  
  const { data, error } = await supabase
    .from('cuentas_rol')
    .select(`
      *,
      roles_sistema (codigo, nombre, nivel, descripcion)
    `)
    .eq('usuario_id', usuario_id);
  
  if (error) {
    console.error('❌ Error en query cuentas_rol:', error);
    throw error;
  }
  
  console.log('✅ Datos obtenidos de cuentas_rol:', data);
  return data || [];
}

  static async create(cuentaRol) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .insert([{
        usuario_id: cuentaRol.usuario_id,
        tipo_rol_id: cuentaRol.tipo_rol_id,
        region_id: cuentaRol.region_id || null,
        departamento_id: cuentaRol.departamento_id || null,
        municipio_id: cuentaRol.municipio_id || null,
        activo: true
      }])
      .select(`
        *,
        roles_sistema (codigo, nombre, nivel)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async desactivar(id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .update({ 
        activo: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async activar(id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .update({ 
        activo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async tieneRol(usuario_id, codigo_rol) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .select(`
        roles_sistema!inner (codigo)
      `)
      .eq('usuario_id', usuario_id)
      .eq('roles_sistema.codigo', codigo_rol)
      .eq('activo', true)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }

  static async getByFiltros(filtros) {
    let query = supabase
      .from('cuentas_rol')
      .select(`
        *,
        usuarios!inner (id, nombre_completo, email, estado_aprobacion),
        roles_sistema (codigo, nombre, nivel)
      `)
      .eq('activo', filtros.activo !== undefined ? filtros.activo : true);
    
    if (filtros.rol_codigo) {
      query = query.eq('roles_sistema.codigo', filtros.rol_codigo);
    }
    
    if (filtros.departamento_id) {
      query = query.eq('departamento_id', filtros.departamento_id);
    }
    
    if (filtros.municipio_id) {
      query = query.eq('municipio_id', filtros.municipio_id);
    }

    if (filtros.solo_aprobados) {
      query = query.eq('usuarios.estado_aprobacion', 'aprobado');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
}

export default CuentasRolModel;