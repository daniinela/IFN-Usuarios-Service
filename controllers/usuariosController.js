// usuarios-service/controllers/usuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import CuentasRolModel from '../models/cuentasRolModel.js';
import RolesModel from '../models/rolesModel.js';
import supabase from '../config/database.js';
import axios from 'axios';

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
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      const usuario = await UsuariosModel.getByEmail(email);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!usuario.activo) {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }

      // Obtener privilegios del usuario
      const privilegios = await UsuariosModel.getPrivilegiosByUsuarioId(usuario.id);

      res.json({ 
        user: usuario,
        privilegios: privilegios.map(p => p.codigo)
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { id, email, cedula, nombre_completo, telefono, rol_codigo, region_id, departamento_id } = req.body;

      // Validar campos requeridos
      if (!id || !email || !cedula || !nombre_completo) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: id, email, cedula, nombre_completo'
        });
      }

      // Verificar que el email no exista
      const emailExiste = await UsuariosModel.getByEmail(email);
      if (emailExiste) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      // Verificar que la cédula no exista
      const cedulaExiste = await UsuariosModel.getByCedula(cedula);
      if (cedulaExiste) {
        return res.status(409).json({ error: 'Cédula ya registrada' });
      }

      // Crear usuario
      const nuevoUsuario = await UsuariosModel.create({
        id,
        email,
        cedula,
        nombre_completo,
        telefono: telefono || null
      });

      // Si viene rol_codigo, crear cuenta de rol
      if (rol_codigo) {
        const rol = await RolesModel.getByCodigo(rol_codigo);
        if (!rol) {
          return res.status(400).json({ error: 'Rol inválido' });
        }

        // Si es admin_regional, requiere region_id y departamento_id
        if (rol_codigo === 'admin_regional' && (!region_id || !departamento_id)) {
          return res.status(400).json({ 
            error: 'Admin regional requiere region_id y departamento_id' 
          });
        }

        await CuentasRolModel.create({
          usuario_id: nuevoUsuario.id,
          tipo_rol_id: rol.id,
          region_id: rol_codigo === 'admin_regional' ? region_id : null,
          departamento_id: rol_codigo === 'admin_regional' ? departamento_id : null
        });
      }

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email o cédula ya registrados' });
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

      const usuarioActualizado = await UsuariosModel.update(id, updates);

      // Actualizar metadata en Supabase Auth si cambió nombre
      if (updates.nombre_completo) {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            nombre_completo: updates.nombre_completo
          }
        });
      }

      res.json(usuarioActualizado);
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      console.log('\n🗑️ ========== ELIMINACIÓN INICIADA ==========');
      console.log('ID:', id);

      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('Usuario:', existe.email);

      // Verificar si es super_admin
      const esSuperAdmin = await CuentasRolModel.tieneRol(id, 'super_admin');
      if (esSuperAdmin) {
        return res.status(403).json({ 
          error: 'No se pueden eliminar super administradores' 
        });
      }

      const eliminados = [];

      // PASO 1: Brigadistas (si tiene rol brigadista)
      const esBrigadista = await CuentasRolModel.tieneRol(id, 'brigadista');
      if (esBrigadista) {
        console.log('\n📍 PASO 1: Brigadistas...');
        try {
          const token = req.headers.authorization;
          const brigRes = await axios.get(
            `http://localhost:3002/api/brigadistas/user/${id}`,
            { headers: { Authorization: token } }
          );

          if (brigRes?.data?.id) {
            await axios.delete(
              `http://localhost:3002/api/brigadistas/${brigRes.data.id}`,
              { headers: { Authorization: token } }
            );
            eliminados.push('brigadistas ✅');
            console.log('✅ Brigadista eliminado');
          }
        } catch (e) {
          eliminados.push('brigadistas ⚠️');
          console.log('⚠️ Sin brigadista');
        }
      }

      // PASO 2: Auth
      console.log('\n📍 PASO 2: Auth...');
      try {
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error && error.status !== 404) throw error;
        eliminados.push('auth ✅');
        console.log('✅ Auth eliminado');
      } catch (e) {
        eliminados.push('auth ❌');
        console.log('❌ Error Auth:', e.message);
      }

      // PASO 3: Soft delete del usuario
      console.log('\n📍 PASO 3: Desactivando usuario...');
      await UsuariosModel.softDelete(id, motivo || 'Eliminado por administrador');
      eliminados.push('usuarios ✅');
      console.log('✅ Usuario desactivado');

      console.log('\n✅ ========== COMPLETADO ==========');
      console.log('Resultado:', eliminados.join(' | '));

      res.json({ 
        success: true,
        message: 'Usuario eliminado',
        eliminado_de: eliminados
      });

    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
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
        return res.status(500).json({ error: error.message });
      }

      res.json({ message: 'Contraseña actualizada' });
    } catch (error) {
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
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Email confirmado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async inviteUser(req, res) {
    try {
      const { email, rol_codigo, region_id, departamento_id } = req.body;
      
      if (!email || !rol_codigo) {
        return res.status(400).json({ error: 'Email y rol_codigo requeridos' });
      }
      
      // Validar que el rol existe
      const rol = await RolesModel.getByCodigo(rol_codigo);
      if (!rol) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      // Si es admin_regional, requiere ubicación
      if (rol_codigo === 'admin_regional' && (!region_id || !departamento_id)) {
        return res.status(400).json({ 
          error: 'Admin regional requiere region_id y departamento_id' 
        });
      }
      
      const usuarioExiste = await UsuariosModel.getByEmail(email).catch(() => null);
      if (usuarioExiste) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { 
          rol_codigo, 
          region_id: region_id || null,
          departamento_id: departamento_id || null,
          invited: true 
        },
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register`
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data?.user) {
        return res.status(400).json({ error: 'No se pudo crear invitación' });
      }

      res.json({ 
        message: 'Invitación enviada',
        email,
        rol: rol.nombre,
        userId: data.user.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener privilegios de un usuario
  static async getPrivilegios(req, res) {
    try {
      const { id } = req.params;
      const privilegios = await UsuariosModel.getPrivilegiosByUsuarioId(id);
      res.json(privilegios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;