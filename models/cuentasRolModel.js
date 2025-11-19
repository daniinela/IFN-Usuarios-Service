// usuarios-service/models/cuentasRolModel.js
import supabase from '../config/database.js';

class CuentasRolModel {
  
  // ✅ Obtener todas las cuentas_rol
  static async getAll() {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .select(`
        *,
        usuarios (
          id,
          nombre_completo,
          email,
          estado_aprobacion,
          activo
        ),
        roles_sistema (
          codigo,
          nombre,
          nivel
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // ✅ Obtener cuenta_rol por ID
  static async getById(id) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .select(`
        *,
        usuarios (
          id,
          nombre_completo,
          email,
          estado_aprobacion,
          activo
        ),
        roles_sistema (
          codigo,
          nombre,
          nivel
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // ✅ Obtener cuentas_rol de un usuario específico
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

  // ✅ Crear nueva cuenta_rol
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

  // ✅ Actualizar cuenta_rol
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('cuentas_rol')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        roles_sistema (codigo, nombre, nivel)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // ✅ Eliminar cuenta_rol (hard delete)
  static async delete(id) {
    const { error } = await supabase
      .from('cuentas_rol')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // ✅ Desactivar cuenta_rol (soft delete)
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

  // ✅ Activar cuenta_rol
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

  // ✅ Verificar si un usuario tiene un rol específico
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

  // 🔥 MÉTODO CLAVE: Obtener cuentas_rol con filtros (para buscar personal)
  static async getByFiltros(filtros) {
    console.log('📊 CuentasRolModel.getByFiltros recibió:', filtros);
    
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
    
    // ✅ Filtro por rol
    if (filtros.rol_codigo) {
      query = query.eq('roles_sistema.codigo', filtros.rol_codigo);
      console.log('🔍 Filtro ROL:', filtros.rol_codigo);
    }
    
    // ✅ Filtro por estado de aprobación del usuario
    if (filtros.solo_aprobados) {
      query = query.eq('usuarios.estado_aprobacion', 'aprobado');
      query = query.eq('usuarios.activo', true);
      console.log('✅ Solo usuarios APROBADOS');
    }
    
    // 🔥 FILTROS GEOGRÁFICOS - Prioridad: Municipio > Departamento > Región
    if (filtros.municipio_id) {
      console.log('🎯 Filtrando por MUNICIPIO:', filtros.municipio_id);
      query = query.eq('municipio_id', filtros.municipio_id);
      
    } else if (filtros.departamento_id) {
      console.log('🎯 Filtrando por DEPARTAMENTO:', filtros.departamento_id);
      query = query.eq('departamento_id', filtros.departamento_id);
      
    } else if (filtros.region_id) {
      console.log('🎯 Filtrando por REGIÓN:', filtros.region_id);
      query = query.eq('region_id', filtros.region_id);
    }
    
    console.log('📡 Ejecutando query en Supabase...');
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error en query getByFiltros:', error);
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} registros encontrados`);
    
    // 🔍 DEBUG: Mostrar detalles de los resultados
    if (data && data.length > 0) {
      console.log('👥 Personal encontrado:');
      data.forEach(item => {
        console.log(`  - ${item.usuarios?.nombre_completo} (${item.roles_sistema?.codigo})`);
        console.log(`    Ubicación: R:${item.region_id || 'N/A'} D:${item.departamento_id || 'N/A'} M:${item.municipio_id || 'N/A'}`);
      });
    } else {
      console.warn('⚠️ No se encontró personal con los filtros aplicados');
      console.warn('Filtros usados:', filtros);
    }
    
    return data || [];
  }
}

export default CuentasRolModel;