// usuarios-service/controllers/rolesPrivilegiosController.js
import RolesPrivilegiosModel from '../models/rolesPrivilegiosModel.js';
import RolesModel from '../models/rolesModel.js';
import PrivilegiosModel from '../models/privilegiosModel.js';

class RolesPrivilegiosController {
  
  // Asignar privilegio a rol
  static async asignar(req, res) {
    try {
      const { rol_id, privilegio_id } = req.body;

      // Validar campos requeridos
      if (!rol_id || !privilegio_id) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: rol_id, privilegio_id' 
        });
      }

      // Verificar que el rol existe
      const rol = await RolesModel.getById(rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      // Verificar que el privilegio existe (necesitas crear este método)
      // Por ahora asumimos que existe

      const resultado = await RolesPrivilegiosModel.asignar(rol_id, privilegio_id);

      res.status(201).json({
        message: 'Privilegio asignado al rol',
        data: resultado
      });
    } catch (error) {
      console.error('Error en asignar:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'El rol ya tiene ese privilegio' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Asignar múltiples privilegios a un rol
  static async asignarMultiples(req, res) {
    try {
      const { rol_id, privilegios_ids } = req.body;

      // Validar campos requeridos
      if (!rol_id || !Array.isArray(privilegios_ids) || privilegios_ids.length === 0) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: rol_id, privilegios_ids (array)' 
        });
      }

      // Verificar que el rol existe
      const rol = await RolesModel.getById(rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const resultados = [];
      const errores = [];

      for (const privilegio_id of privilegios_ids) {
        try {
          const resultado = await RolesPrivilegiosModel.asignar(rol_id, privilegio_id);
          resultados.push(resultado);
        } catch (error) {
          if (error.code !== '23505') { // Ignorar duplicados
            errores.push({ privilegio_id, error: error.message });
          }
        }
      }

      res.json({
        message: `${resultados.length} privilegios asignados`,
        asignados: resultados.length,
        errores: errores.length > 0 ? errores : null
      });
    } catch (error) {
      console.error('Error en asignarMultiples:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Remover privilegio de rol
  static async remover(req, res) {
    try {
      const { rol_id, privilegio_id } = req.params;

      // Validar que existan los parámetros
      if (!rol_id || !privilegio_id) {
        return res.status(400).json({ 
          error: 'Faltan parámetros: rol_id, privilegio_id' 
        });
      }

      // Verificar que el rol existe
      const rol = await RolesModel.getById(rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      await RolesPrivilegiosModel.remover(rol_id, privilegio_id);

      res.json({ 
        message: 'Privilegio removido del rol'
      });
    } catch (error) {
      console.error('Error en remover:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener todos los privilegios de un rol
  static async getByRolId(req, res) {
    try {
      const { rol_id } = req.params;

      // Verificar que el rol existe
      const rol = await RolesModel.getById(rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const privilegios = await RolesPrivilegiosModel.getByRolId(rol_id);

      res.json({
        rol: {
          id: rol.id,
          codigo: rol.codigo,
          nombre: rol.nombre
        },
        privilegios,
        total: privilegios.length
      });
    } catch (error) {
      console.error('Error en getByRolId:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Reemplazar todos los privilegios de un rol
  static async reemplazar(req, res) {
    try {
      const { rol_id } = req.params;
      const { privilegios_ids } = req.body;

      // Validar campos requeridos
      if (!Array.isArray(privilegios_ids)) {
        return res.status(400).json({ 
          error: 'privilegios_ids debe ser un array' 
        });
      }

      // Verificar que el rol existe
      const rol = await RolesModel.getById(rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      // Obtener privilegios actuales
      const privilegiosActuales = await RolesPrivilegiosModel.getByRolId(rol_id);
      
      // Remover todos los actuales
      for (const priv of privilegiosActuales) {
        await RolesPrivilegiosModel.remover(rol_id, priv.id);
      }

      // Asignar los nuevos
      const resultados = [];
      for (const privilegio_id of privilegios_ids) {
        try {
          const resultado = await RolesPrivilegiosModel.asignar(rol_id, privilegio_id);
          resultados.push(resultado);
        } catch (error) {
          console.error(`Error asignando privilegio ${privilegio_id}:`, error);
        }
      }
      res.json({
        message: 'Privilegios actualizados',
        total_anterior: privilegiosActuales.length,
        total_nuevo: resultados.length
      });
    } catch (error) {
      console.error('Error en reemplazar:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
export default RolesPrivilegiosController;