// usuarios-service/controllers/cuentasRolController.js
import CuentasRolModel from '../models/cuentasRolModel.js';
import UsuariosModel from '../models/usuariosModel.js';
import RolesModel from '../models/rolesModel.js';

class CuentasRolController {
  
  static async getByUsuarioId(req, res) {
    try {
      const { usuario_id } = req.params;
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

  static async create(req, res) {
    try {
      const { usuario_id, tipo_rol_id, region_id, departamento_id, municipio_id } = req.body;
      
      if (!usuario_id || !tipo_rol_id) {
        return res.status(400).json({ error: 'usuario_id y tipo_rol_id requeridos' });
      }
      
      const usuario = await UsuariosModel.getById(usuario_id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado_aprobacion !== 'aprobado') {
        return res.status(400).json({ error: 'Solo se pueden asignar roles a usuarios aprobados' });
      }

      const rol = await RolesModel.getById(tipo_rol_id);
      if (!rol) {
        return res.status(404).json({ error: 'Rol no encontrado' });
      }

      const nuevaCuenta = await CuentasRolModel.create({
        usuario_id, tipo_rol_id, region_id, departamento_id, municipio_id
      });

      res.status(201).json(nuevaCuenta);
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async desactivar(req, res) {
    try {
      const cuenta = await CuentasRolModel.desactivar(req.params.id);
      res.json({ message: 'Cuenta desactivada', cuenta });
    } catch (error) {
      console.error('Error en desactivar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async activar(req, res) {
    try {
      const cuenta = await CuentasRolModel.activar(req.params.id);
      res.json({ message: 'Cuenta activada', cuenta });
    } catch (error) {
      console.error('Error en activar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getByFiltros(req, res) {
    try {
      const { rol_codigo, departamento_id, municipio_id, activo = true, solo_aprobados = true } = req.query;
      
      const filtros = {
        activo: activo === 'true',
        solo_aprobados: solo_aprobados === 'true'
      };

      if (rol_codigo) filtros.rol_codigo = rol_codigo;
      if (departamento_id) filtros.departamento_id = departamento_id;
      if (municipio_id) filtros.municipio_id = municipio_id;
      
      const cuentas = await CuentasRolModel.getByFiltros(filtros);
      res.json(cuentas);
    } catch (error) {
      console.error('Error en getByFiltros:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default CuentasRolController;