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
  console.log('📊 CuentasRolModel.getByFiltros con filtros:', filtros);
  
  let query = supabase
    .from('cuentas_rol')
    .select(`
      *,
      usuarios!inner (
        id, 
        nombre_completo, 
        email, 
        telefono,
        municipio_residencia,
        estado_aprobacion,
        activo
      ),
      roles_sistema!inner (
        codigo, 
        nombre, 
        nivel
      )
    `)
    .eq('activo', filtros.activo !== undefined ? filtros.activo : true);
  
  // Filtro por rol
  if (filtros.rol_codigo) {
    query = query.eq('roles_sistema.codigo', filtros.rol_codigo);
  }
  
  // Filtro geográfico: Región
  if (filtros.region_id) {
    query = query.eq('region_id', filtros.region_id);
  }
  
  // Filtro geográfico: Departamento (más específico)
  if (filtros.departamento_id) {
    query = query.eq('departamento_id', filtros.departamento_id);
  }
  
  // Filtro geográfico: Municipio (más específico)
  if (filtros.municipio_id) {
    query = query.eq('municipio_id', filtros.municipio_id);
  }

  // Filtro por estado de aprobación
  if (filtros.solo_aprobados) {
    query = query.eq('usuarios.estado_aprobacion', 'aprobado');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error en query getByFiltros:', error);
    throw error;
  }
  
  console.log(`✅ ${data?.length || 0} registros encontrados`);
  return data || [];
}
}

export default CuentasRolModel;