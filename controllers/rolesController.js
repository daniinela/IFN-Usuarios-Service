// usuarios-service/controllers/rolesController.js
import RolesModel from '../models/rolesModel.js';

class RolesController {
  
  // Obtener todos los roles
  static async getAll(req, res) {
    try {
      const roles = await RolesModel.getAll();
      res.json(roles);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener rol por ID
  static async getById(req, res) {
    try {
      const rol = await RolesModel.getById(req.params.id);
      
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }
      
      res.json(rol);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener rol por código
  static async getByCodigo(req, res) {
    try {
      const rol = await RolesModel.getByCodigo(req.params.codigo);
      
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }
      
      res.json(rol);
    } catch (error) {
      console.error('Error en getByCodigo:', error);
      res.status(500).json({ error: error.message });
    }
  }


  // Obtener privilegios de un rol
  static async getPrivilegios(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el rol existe
      const rol = await RolesModel.getById(id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const privilegios = await RolesModel.getPrivilegiosByRolId(id);
      
      res.json({
        rol: {
          id: rol.id,
          codigo: rol.codigo,
          nombre: rol.nombre,
          nivel: rol.nivel
        },
        privilegios
      });
    } catch (error) {
      console.error('Error en getPrivilegios:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default RolesController;