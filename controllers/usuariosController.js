// controllers/UsuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import CuentasRolModel from '../models/cuentasRolModel.js';

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

      if (updates.email && updates.email !== usuarioActual.email) {
        const existe = await UsuariosModel.getByEmail(updates.email);
        if (existe) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
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
      const { email, rol } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
      }
      
      const existe = await UsuariosModel.getByEmail(email);
      if (existe) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Invitación procesada'
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

  static async aprobar(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuariosModel.aprobar(id);
      res.json({ message: 'Usuario aprobado exitosamente', usuario });
    } catch (error) {
      console.error('Error en aprobar:', error);
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
  static async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      if (!motivo) return res.status(400).json({ error: 'Motivo requerido' });
      const usuario = await UsuariosModel.rechazar(id, motivo);
      res.json({ message: 'Usuario rechazado', usuario });
    } catch (error) {
      console.error('Error en rechazar:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;