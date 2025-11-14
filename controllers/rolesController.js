// usuarios-service/controllers/rolesController.js
import RolesModel from '../models/rolesModel.js';

class RolesController {
  
  static async getAll(req, res) {
    try {
      const roles = await RolesModel.getAll();
      res.json(roles);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

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

  static async getByNivel(req, res) {
    try {
      const { nivel } = req.params;
      const nivelesValidos = ['sistema', 'regional', 'operacional'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({ error: 'Nivel inválido' });
      }
      const roles = await RolesModel.getByNivel(nivel);
      res.json(roles);
    } catch (error) {
      console.error('Error en getByNivel:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default RolesController;