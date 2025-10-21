import UsuariosModel from '../models/usuariosModel.js';
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

      res.json({ user: usuario });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { id, email, nombre_completo, rol, telefono } = req.body;

      if (!id || !email || !nombre_completo || !rol) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos'
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

      res.status(201).json(nuevoUsuario);
    } catch (error) {
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

  static async delete(req, res) {
    try {
      const { id } = req.params;

      console.log('\n🗑️ ========== ELIMINACIÓN INICIADA ==========');
      console.log('ID:', id);

      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      console.log('Usuario:', existe.email, '| Rol:', existe.rol);

      if (existe.rol === 'admin') {
        return res.status(403).json({ 
          error: 'No se pueden eliminar administradores' 
        });
      }

      const eliminados = [];

      // PASO 1: Brigadistas
      if (existe.rol === 'brigadista') {
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

      // PASO 3: Usuarios
      console.log('\n📍 PASO 3: Usuarios...');
      await UsuariosModel.delete(id);
      eliminados.push('usuarios ✅');
      console.log('✅ Usuario eliminado');

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
      const { email, rol } = req.body;
      
      if (!email || !rol) {
        return res.status(400).json({ error: 'Email y rol requeridos' });
      }
      
      if (!['admin', 'brigadista'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      
      const usuarioExiste = await UsuariosModel.getByEmail(email).catch(() => null);
      if (usuarioExiste) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { rol, invited: true },
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
        rol,
        userId: data.user.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;