// usuarios-service/controllers/usuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import supabase from '../config/database.js';

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
      const usuario = await UsuariosModel.getById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ Método para verificar email (usado internamente y por HTTP)
  static async getByEmail(req, res) {
    try {
      const { email } = req.params;
      const usuario = await UsuariosModel.getByEmail(email);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      console.error('Error en getByEmail:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    console.log('🚀 MÉTODO LOGIN EJECUTADO');
    console.log('📦 Body recibido:', req.body);
    
    try {
      const { email } = req.body;
      
      console.log('📧 Login intento para:', email);
      
      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      const usuario = await UsuariosModel.getByEmail(email);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('✅ Usuario encontrado en BD:', {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      });

      // Sincronizar el rol en Supabase Auth automáticamente
      try {
        console.log('🔍 Obteniendo usuario de Auth por ID...');
        
        const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(usuario.id);
        
        if (getUserError) {
          console.error('❌ Error obteniendo usuario de Auth:', getUserError);
        } else if (!authUser || !authUser.user) {
          console.error('❌ Usuario NO encontrado en Auth:', email);
        } else {
          console.log('✅ Usuario encontrado en Auth:', authUser.user.id);
          console.log('📋 Metadata actual en Auth:', authUser.user.user_metadata);
          
          const rolActual = authUser.user.user_metadata?.rol;
          
          console.log('🔍 Comparación de roles:');
          console.log('   - Rol en BD:', usuario.rol);
          console.log('   - Rol en Auth:', rolActual || 'NINGUNO');
          
          if (rolActual !== usuario.rol) {
            console.log('🔄 ¡Roles diferentes! Sincronizando...');
            
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
              authUser.user.id,
              {
                user_metadata: {
                  rol: usuario.rol,
                  nombre_completo: usuario.nombre_completo
                }
              }
            );
            
            if (updateError) {
              console.error('❌ Error actualizando metadata:', updateError);
            } else {
              console.log('✅ Metadata actualizado exitosamente');
              console.log('📋 Nuevo metadata:', updateData.user.user_metadata);
              console.log('⚠️  IMPORTANTE: Debes cerrar sesión y volver a loguearte');
            }
          } else {
            console.log('✅ Roles coinciden, no se necesita actualización');
          }
        }
      } catch (syncError) {
        console.error('❌ Error en sincronización:', syncError);
      }

      console.log('✅ Respondiendo con datos del usuario');
      res.json({ user: usuario });
    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { id, email, nombre_completo, rol, telefono } = req.body;

      if (!id || !email || !nombre_completo || !rol) {
        console.error('❌ Campos faltantes:', { id, email, nombre_completo, rol });
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: id, email, nombre_completo, rol',
          recibido: { id, email, nombre_completo, rol }
        });
      }

      const rolesValidos = ['admin', 'brigadista'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const nuevoUsuario = await UsuariosModel.create({
        id,
        email,
        nombre_completo,
        rol,
        telefono: telefono || null
      });

      console.log('✅ Usuario guardado en BD:', nuevoUsuario);
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      console.error('Error en create:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email ya registrado' });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (updates.rol) {
        const rolesValidos = ['admin', 'brigadista'];
        if (!rolesValidos.includes(updates.rol)) {
          return res.status(400).json({ error: 'Rol inválido' });
        }
      }

      const usuarioActualizado = await UsuariosModel.update(id, updates);

      if (updates.nombre_completo || updates.rol) {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            nombre_completo: updates.nombre_completo || existe.nombre_completo,
            rol: updates.rol || existe.rol
          }
        });
      }

      res.json(usuarioActualizado);
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 🔥 DELETE COMPLETO: Elimina de Auth, usuarios Y brigadistas (cascada)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      console.log('🗑️ === INICIANDO ELIMINACIÓN COMPLETA ===');
      console.log('Usuario ID:', id);

      // 1. Verificar si existe en BD
      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        console.log('⚠️ Usuario no encontrado en BD');
        return res.status(404).json({ error: 'Usuario no encontrado en BD' });
      }

      console.log('✅ Usuario encontrado:', existe.email, '- Rol:', existe.rol);

      // 2. Proteger admins
      if (existe.rol === 'admin') {
        return res.status(403).json({ 
          error: 'No se pueden eliminar usuarios administradores' 
        });
      }

      let eliminadoDe = [];

      // 3. Eliminar de tabla usuarios PRIMERO (cascada eliminará de brigadistas)
      console.log('📊 Paso 1: Eliminando de tabla usuarios...');
      try {
        await UsuariosModel.delete(id);
        eliminadoDe.push('usuarios (BD)');
        eliminadoDe.push('brigadistas (cascada)');
        console.log('✅ Eliminado de tabla usuarios (y brigadistas por cascada)');
      } catch (dbError) {
        console.error('❌ Error eliminando de BD:', dbError.message);
        return res.status(500).json({ 
          error: 'Error eliminando de base de datos',
          detalle: dbError.message
        });
      }

      // 4. Eliminar de Supabase Auth
      console.log('🔐 Paso 2: Eliminando de Supabase Auth...');
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
        
        if (deleteError) {
          console.error('❌ Error al eliminar de Auth:', deleteError.message);
          console.error('Código:', deleteError.code);
          console.error('Status:', deleteError.status);
          
          // No fallar si el usuario ya no existe en Auth
          if (deleteError.status === 404 || deleteError.message.includes('not found')) {
            console.log('⚠️ Usuario no existía en Auth (probablemente ya fue eliminado)');
            eliminadoDe.push('auth.users (ya no existía)');
          } else {
            console.warn('⚠️ Usuario eliminado de BD pero falló eliminación de Auth');
            eliminadoDe.push('auth.users (ERROR)');
          }
        } else {
          console.log('✅ Usuario eliminado de Auth');
          eliminadoDe.push('auth.users');
        }
      } catch (authError) {
        console.error('❌ Excepción al eliminar de Auth:', authError);
        eliminadoDe.push('auth.users (ERROR)');
      }

      console.log('✅ === ELIMINACIÓN COMPLETADA ===');
      console.log('Eliminado de:', eliminadoDe);

      res.json({ 
        message: 'Usuario eliminado exitosamente',
        id,
        email: existe.email,
        eliminado_de: eliminadoDe
      });

    } catch (error) {
      console.error('❌ ERROR GENERAL en delete:', error.message);
      console.error('Stack:', error.stack);
      res.status(500).json({ 
        error: 'Error al eliminar usuario',
        detalle: error.message
      });
    }
  }

  static async getByRol(req, res) {
    try {
      const { rol } = req.params;

      const rolesValidos = ['admin', 'brigadista'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const usuarios = await UsuariosModel.getByRol(rol);
      res.json(usuarios);
    } catch (error) {
      console.error('Error en getByRol:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }

      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { error } = await supabase.auth.admin.updateUserById(id, {
        password: newPassword
      });

      if (error) {
        console.error('Error cambiando contraseña:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en changePassword:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async confirmarEmail(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirmed_at: new Date().toISOString()
      });

      if (error) {
        console.error('❌ Error confirmando email:', error);
        return res.status(400).json({ error: error.message });
      }

      console.log('✅ Email confirmado para usuario:', userId);
      res.json({ message: 'Email confirmado exitosamente' });

    } catch (error) {
      console.error('Error en confirmarEmail:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 🔥 MÉTODO CORREGIDO: Ahora SÍ envía el email de invitación
  static async inviteUser(req, res) {
    try {
      const { email, rol } = req.body;
      
      console.log('📧 Invitando usuario:', { email, rol });
      
      if (!email || !rol) {
        return res.status(400).json({ error: 'Email y rol requeridos' });
      }
      
      if (!['admin', 'brigadista'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      
      // Verificar que no exista
      const usuarioExiste = await UsuariosModel.getByEmail(email).catch(() => null);
      if (usuarioExiste) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      // ✅ USAR inviteUserByEmail para que envíe el correo
      const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register`;
      
      console.log('📤 Enviando invitación a:', email);
      console.log('🔗 Redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          rol: rol,
          invited: true
        },
        redirectTo: redirectTo
      });
      
      if (error) {
        console.error('❌ Error invitando usuario:', error);
        return res.status(400).json({ error: error.message });
      }

      if (!data?.user) {
        return res.status(400).json({ error: 'No se pudo crear invitación' });
      }

      console.log('✅ Usuario invitado (Supabase Auth):', data.user.id);

      // ✅ NO guardamos en BD todavía
      // El usuario completará su registro desde el link del email
      console.log('⏳ Usuario pendiente de completar registro en /register');
      
      res.json({ 
        message: 'Invitación enviada exitosamente. El usuario recibirá un email para completar su registro.',
        email,
        rol,
        userId: data.user.id
      });

    } catch (error) {
      console.error('❌ Error en inviteUser:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;