// usuarios-service/controllers/cuentasRolController.js
import CuentasRolModel from '../models/cuentasRolModel.js';
import UsuariosModel from '../models/usuariosModel.js';
import RolesModel from '../models/rolesModel.js';
class CuentasRolController {
  // Obtener cuentas de rol de un usuario
  static async getByUsuarioId(req, res) {
    try {
      const { usuario_id } = req.params;
      // Verificar que el usuario existe
      const usuario = await UsuariosModel.getById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const cuentas = await CuentasRolModel.getByUsuarioId(usuario_id);
      res.json(cuentas);
    } catch (error) {
      console.error('Error en getByUsuarioId:', error);
      res.status(500).json({ error: error.message });
    }
  }
  // Asignar rol a usuario
  static async create(req, res) {
    try {
      const { usuario_id, tipo_rol_id, region_id, departamento_id } = req.body;
      // Validar campos requeridos
      if (!usuario_id || !tipo_rol_id) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: usuario_id, tipo_rol_id' 
        });
      }
      // Verificar que el usuario existe
      const usuario = await UsuariosModel.getById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar que el rol existe
      const rol = await RolesModel.getById(tipo_rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }
      // Si es admin_regional, requiere region_id y departamento_id
      if (rol.codigo === 'admin_regional') {
        if (!region_id || !departamento_id) {
          return res.status(400).json({ 
            error: 'Admin regional requiere region_id y departamento_id' 
          });
        }
      }
      // Verificar que el usuario no tenga ya ese rol activo
      const yaLoTiene = await CuentasRolModel.tieneRol(usuario_id, rol.codigo);
      if (yaLoTiene) {
        return res.status(409).json({ 
          error: `El usuario ya tiene el rol ${rol.nombre}` 
        });
      }

      const nuevaCuenta = await CuentasRolModel.create({
        usuario_id,
        tipo_rol_id,
        region_id: rol.codigo === 'admin_regional' ? region_id : null,
        departamento_id: rol.codigo === 'admin_regional' ? departamento_id : null
      });

      res.status(201).json(nuevaCuenta);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'El usuario ya tiene ese rol asignado' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Desactivar cuenta de rol
  static async desactivar(req, res) {
    try {
      const { id } = req.params;

      const cuenta = await CuentasRolModel.desactivar(id);
      
      res.json({ 
        message: 'Cuenta de rol desactivada',
        cuenta 
      });
    } catch (error) {
      console.error('Error en desactivar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Activar cuenta de rol
  static async activar(req, res) {
    try {
      const { id } = req.params;

      const cuenta = await CuentasRolModel.activar(id);
      
      res.json({ 
        message: 'Cuenta de rol activada',
        cuenta 
      });
    } catch (error) {
      console.error('Error en activar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Verificar si un usuario tiene un rol
  static async verificarRol(req, res) {
    try {
      const { usuario_id, codigo_rol } = req.params;

      const tieneRol = await CuentasRolModel.tieneRol(usuario_id, codigo_rol);
      
      res.json({ 
        usuario_id,
        codigo_rol,
        tiene_rol: tieneRol 
      });
    } catch (error) {
      console.error('Error en verificarRol:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
export default CuentasRolController;