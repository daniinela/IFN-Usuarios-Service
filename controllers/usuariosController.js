// controllers/UsuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import CuentasRolModel from '../models/cuentasRolModel.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class UsuariosController {
  
  static async getAll(req, res) {
    try {
      const usuarios = await UsuariosModel.getAll();
      res.json(usuarios); 
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      console.log('📥 Buscando usuario:', id);
      
      const usuario = await UsuariosModel.getById(id);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      console.log('✅ Usuario encontrado:', usuario.email);
      
      res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('❌ Error en getById:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async create(req, res) {
    try {
      const usuarioData = req.body;
      
      if (!usuarioData.email) {
        return res.status(400).json({ error: 'Email requerido' });
      }
      
      const existe = await UsuariosModel.getByEmail(usuarioData.email);
      if (existe) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      
      const nuevoUsuario = await UsuariosModel.create(usuarioData);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: nuevoUsuario
      });
    } catch (error) {
      console.error('❌ Error en create:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const usuarioActual = await UsuariosModel.getById(id);
      if (!usuarioActual) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const usuarioActualizado = await UsuariosModel.update(id, updates);
      
      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado
      });
    } catch (error) {
      console.error('❌ Error en update:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      await UsuariosModel.softDelete(id, 'Eliminado por administrador');
      
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error en delete:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async login(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
      }
      
      const usuario = await UsuariosModel.getByEmail(email);
      
      if (!usuario) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        user: usuario
      });
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
static async inviteUser(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    
    console.log('📧 Invitando usuario:', email);
    
    // ✅ PASO 1: Verificar si ya existe en Auth
    let userId = null;
    let yaExisteEnAuth = false;

    // Invitar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        rol: 'brigadista',
        invited_by: 'gestor_recursos'
      },
      redirectTo: `${process.env.FRONTEND_URL}/register`
    });

    if (authError) {
      // Si el error es porque ya existe, intentar obtener el usuario
      if (authError.message.includes('already') || authError.message.includes('existe')) {
        console.log('⚠️ Usuario ya existe en Auth, obteniendo ID...');
        
        // Buscar el usuario existente en la BD
        const usuarioExistente = await UsuariosModel.getByEmail(email);
        
        if (usuarioExistente) {
          userId = usuarioExistente.id;
          yaExisteEnAuth = true;
          console.log('✅ Usuario encontrado:', userId);
        } else {
          throw new Error('El usuario ya existe en Auth pero no en la BD');
        }
      } else {
        console.error('❌ Error Supabase Auth:', authError);
        throw new Error('Error enviando invitación: ' + authError.message);
      }
    } else {
      userId = authData.user.id;
      console.log('✅ Invitación enviada a nuevo usuario:', userId);
    }

    // ✅ PASO 2: Crear o actualizar en tabla usuarios
    try {
      const usuarioExistente = await UsuariosModel.getByEmail(email);
      
      if (usuarioExistente) {
        // Ya existe, solo actualizar estado
        console.log('⚠️ Usuario ya existe en BD, actualizando estado...');
        await UsuariosModel.update(usuarioExistente.id, {
          estado_aprobacion: 'invitado',
          activo: false
        });
        console.log('✅ Estado actualizado a "invitado"');
      } else {
        // No existe, crear nuevo
        console.log('💾 Creando nuevo registro en BD...');
        await UsuariosModel.create({
          id: userId,
          email: email,
          estado_aprobacion: 'invitado',
          activo: false
        });
        console.log('✅ Usuario pre-registrado en BD');
      }
    } catch (dbError) {
      console.error('❌ Error en BD:', dbError);
      throw new Error('Error guardando en base de datos: ' + dbError.message);
    }

    console.log('✅ Proceso completado exitosamente');
    
    res.status(200).json({
      success: true,
      message: yaExisteEnAuth 
        ? `Invitación reenviada a ${email}` 
        : `Invitación enviada a ${email}`,
      data: {
        email,
        user_id: userId,
        invited_at: new Date().toISOString(),
        ya_existia: yaExisteEnAuth
      }
    });
  } catch (error) {
    console.error('❌ Error en inviteUser:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

  static async getPendientes(req, res) {
    try {
      const pendientes = await UsuariosModel.getPendientes();
      res.json(pendientes);
    } catch (error) {
      console.error('Error en getPendientes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 🆕 MODIFICADO: Aprobar usuario con múltiples roles
  static async aprobar(req, res) {
    try {
      const { id } = req.params;
      const { roles } = req.body; // Array de roles
      
      // Validar que venga al menos un rol
      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ 
          error: 'Debe asignar al menos un rol al aprobar' 
        });
      }

      // Validar que cada rol tenga ubicación
      for (const rol of roles) {
        if (!rol.tipo_rol_id) {
          return res.status(400).json({ 
            error: 'Cada rol debe tener tipo_rol_id' 
          });
        }
        
        // Validar que tenga al menos región, departamento o municipio
        if (!rol.region_id && !rol.departamento_id && !rol.municipio_id) {
          return res.status(400).json({ 
            error: 'Cada rol debe tener al menos una ubicación geográfica' 
          });
        }
      }

      console.log('✅ Aprobando usuario:', id);
      console.log('📋 Roles a asignar:', roles);

      // Aprobar usuario
      const usuario = await UsuariosModel.aprobar(id);

      // Asignar todos los roles
      const rolesCreados = [];
      for (const rol of roles) {
        const cuentaRol = await CuentasRolModel.create({
          usuario_id: id,
          tipo_rol_id: rol.tipo_rol_id,
          region_id: rol.region_id || null,
          departamento_id: rol.departamento_id || null,
          municipio_id: rol.municipio_id || null
        });
        rolesCreados.push(cuentaRol);
      }

      console.log(`✅ Usuario aprobado con ${rolesCreados.length} rol(es)`);

      res.json({ 
        message: 'Usuario aprobado exitosamente',
        usuario,
        roles: rolesCreados
      });
    } catch (error) {
      console.error('❌ Error en aprobar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      if (!motivo || motivo.length < 10) {
        return res.status(400).json({ 
          error: 'Motivo requerido (mínimo 10 caracteres)' 
        });
      }

      const usuario = await UsuariosModel.rechazar(id, motivo);
      
      res.json({ 
        message: 'Usuario rechazado', 
        usuario 
      });
    } catch (error) {
      console.error('Error en rechazar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByEmail(req, res) {
    try {
      const { email } = req.params;
      console.log('📥 Buscando usuario por email:', email);
      
      const usuario = await UsuariosModel.getByEmail(email);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }
      
      console.log('✅ Usuario encontrado:', usuario.email);
      
      res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('❌ Error en getByEmail:', error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async getJefesBrigadaDisponibles(req, res) {
    try {
      const { region_id, departamento_id, municipio_id, rol_codigo, activo, solo_aprobados } = req.query;
      
      console.log('🔍 getJefesBrigadaDisponibles - Query params:', {
        region_id, departamento_id, municipio_id, rol_codigo, activo, solo_aprobados
      });
      
      const filtros = {
        rol_codigo: rol_codigo || 'JEFE_BRIGADA',
        activo: activo === 'false' ? false : true,
        solo_aprobados: solo_aprobados === 'false' ? false : true
      };
      
      if (municipio_id) {
        filtros.municipio_id = municipio_id;
      } else if (departamento_id) {
        filtros.departamento_id = departamento_id;
      } else if (region_id) {
        filtros.region_id = region_id;
      }
      
      const jefesBrigada = await CuentasRolModel.getByFiltros(filtros);
      
      console.log(`✅ ${jefesBrigada.length} Jefes de Brigada encontrados`);
      
      res.json({
        success: true,
        data: jefesBrigada,
        total: jefesBrigada.length,
        filtros_aplicados: filtros
      });
    } catch (error) {
      console.error('❌ Error en getJefesBrigadaDisponibles:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // 🆕 NUEVO: Obtener solo personal operacional (sin Coordinadores INF ni Gestores)
  static async getPersonalOperacional(req, res) {
    try {
      console.log('👥 Obteniendo personal operacional');
      
      const rolesOperacionales = ['JEFE_BRIGADA', 'BOTANICO', 'TECNICO', 'COINVESTIGADOR'];
      
      // Obtener todos los usuarios aprobados con roles operacionales
      const usuarios = await UsuariosModel.getAll();
      
      // Filtrar solo usuarios aprobados y activos
      const usuariosAprobados = usuarios.filter(u => 
        u.estado_aprobacion === 'aprobado' && 
        u.activo === true
      );

      // Obtener cuentas_rol para cada usuario aprobado
      const resultado = [];
      
      for (const usuario of usuariosAprobados) {
        const cuentasRol = await CuentasRolModel.getByUsuarioId(usuario.id);
        
        // Filtrar solo roles operacionales
        const rolesOperacionalesFiltrados = cuentasRol.filter(cr => 
          cr.roles_sistema && 
          rolesOperacionales.includes(cr.roles_sistema.codigo) &&
          cr.activo === true
        );

        // Si tiene al menos un rol operacional, agregarlo
        if (rolesOperacionalesFiltrados.length > 0) {
          rolesOperacionalesFiltrados.forEach(rol => {
            resultado.push({
              ...rol,
              usuarios: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                telefono: usuario.telefono,
                cedula: usuario.cedula,
                estado_aprobacion: usuario.estado_aprobacion,
                activo: usuario.activo,
                fecha_aprobacion: usuario.fecha_aprobacion
              }
            });
          });
        }
      }

      console.log(`✅ ${resultado.length} registros operacionales encontrados`);

      res.json({
        success: true,
        data: resultado,
        total: resultado.length
      });
    } catch (error) {
      console.error('❌ Error en getPersonalOperacional:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

export default UsuariosController;