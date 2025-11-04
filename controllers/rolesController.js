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

  // Crear rol (solo super_admin)
  static async create(req, res) {
    try {
      const { codigo, nombre, nivel, descripcion } = req.body;
      const creado_por = req.user?.id; // Del middleware de autenticación

      // Validar campos requeridos
      if (!codigo || !nombre || !nivel) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: codigo, nombre, nivel' 
        });
      }

      // Validar nivel
      const nivelesValidos = ['sistema', 'regional', 'operacional'];
      if (!nivelesValidos.includes(nivel)) {
        return res.status(400).json({ 
          error: 'Nivel inválido. Debe ser: sistema, regional u operacional' 
        });
      }

      // Verificar que el código no exista
      const existe = await RolesModel.getByCodigo(codigo);
      if (existe) {
        return res.status(409).json({ error: 'Ya existe un rol con ese código' });
      }

      const nuevoRol = await RolesModel.create({
        codigo,
        nombre,
        nivel,
        descripcion: descripcion || null,
        creado_por
      });

      res.status(201).json(nuevoRol);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Código de rol ya existe' });
      }
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