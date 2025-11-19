// usuarios-service/controllers/cuentasRolController.js
import CuentasRolModel from '../models/cuentasRolModel.js';

class CuentasRolController {
  
  static async getAll(req, res) {
    try {
      const cuentasRol = await CuentasRolModel.getAll();
      res.json(cuentasRol);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const cuentaRol = await CuentasRolModel.getById(id);
      
      if (!cuentaRol) {
        return res.status(404).json({ error: 'Cuenta rol no encontrada' });
      }
      
      res.json(cuentaRol);
    } catch (error) {
      console.error('Error en getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ✅ CORREGIDO: Cambiar nombre a getByUsuarioId para coincidir con el modelo
  static async getByUsuarioId(req, res) {
    try {
      const { usuario_id } = req.params;
      console.log('📋 Obteniendo roles del usuario:', usuario_id);
      
      const cuentasRol = await CuentasRolModel.getByUsuarioId(usuario_id);
      
      console.log(`✅ ${cuentasRol.length} roles encontrados`);
      res.json(cuentasRol);
    } catch (error) {
      console.error('Error en getByUsuarioId:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 🆕 ENDPOINT CLAVE: Obtener personal con filtros
  static async getByFiltros(req, res) {
    try {
      const { 
        rol_codigo, 
        region_id, 
        departamento_id, 
        municipio_id,
        activo = 'true',
        solo_aprobados = 'true'
      } = req.query;

      console.log('🔍 Filtros query recibidos:', {
        rol_codigo,
        region_id,
        departamento_id,
        municipio_id,
        activo,
        solo_aprobados
      });

      // Validación de rol requerido
      if (!rol_codigo) {
        return res.status(400).json({ 
          error: 'El parámetro rol_codigo es requerido',
          ejemplo: '?rol_codigo=BOTANICO&municipio_id=xxx'
        });
      }

      // Construir objeto de filtros
      const filtros = {
        rol_codigo,
        activo: activo === 'true',
        solo_aprobados: solo_aprobados === 'true'
      };

      // Agregar filtros geográficos si existen
      if (municipio_id) {
        filtros.municipio_id = municipio_id;
        console.log('✅ Filtro MUNICIPIO aplicado:', municipio_id);
      } else if (departamento_id) {
        filtros.departamento_id = departamento_id;
        console.log('✅ Filtro DEPARTAMENTO aplicado:', departamento_id);
      } else if (region_id) {
        filtros.region_id = region_id;
        console.log('✅ Filtro REGIÓN aplicado:', region_id);
      }

      console.log('📡 Llamando a CuentasRolModel.getByFiltros...');
      const cuentasRol = await CuentasRolModel.getByFiltros(filtros);
      
      console.log(`✅ ${cuentasRol.length} registros encontrados en el controlador`);
      
      res.json(cuentasRol);
    } catch (error) {
      console.error('❌ Error en getByFiltros:', error.message);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async create(req, res) {
    try {
      const { usuario_id, tipo_rol_id, region_id, departamento_id, municipio_id } = req.body;

      if (!usuario_id || !tipo_rol_id) {
        return res.status(400).json({ 
          error: 'usuario_id y tipo_rol_id son requeridos' 
        });
      }

      const nuevaCuentaRol = await CuentasRolModel.create({
        usuario_id,
        tipo_rol_id,
        region_id,
        departamento_id,
        municipio_id
      });

      res.status(201).json({
        message: 'Cuenta rol creada exitosamente',
        data: nuevaCuentaRol
      });
    } catch (error) {
      console.error('Error en create:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const cuentaRol = await CuentasRolModel.getById(id);
      if (!cuentaRol) {
        return res.status(404).json({ error: 'Cuenta rol no encontrada' });
      }

      const cuentaRolActualizada = await CuentasRolModel.update(id, updates);

      res.json({
        message: 'Cuenta rol actualizada',
        data: cuentaRolActualizada
      });
    } catch (error) {
      console.error('Error en update:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const cuentaRol = await CuentasRolModel.getById(id);
      if (!cuentaRol) {
        return res.status(404).json({ error: 'Cuenta rol no encontrada' });
      }

      await CuentasRolModel.delete(id);

      res.json({ message: 'Cuenta rol eliminada' });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async desactivar(req, res) {
    try {
      const { id } = req.params;

      const cuentaRol = await CuentasRolModel.getById(id);
      if (!cuentaRol) {
        return res.status(404).json({ error: 'Cuenta rol no encontrada' });
      }

      const cuentaRolDesactivada = await CuentasRolModel.desactivar(id);

      res.json({
        message: 'Cuenta rol desactivada',
        data: cuentaRolDesactivada
      });
    } catch (error) {
      console.error('Error en desactivar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async activar(req, res) {
    try {
      const { id } = req.params;

      const cuentaRol = await CuentasRolModel.getById(id);
      if (!cuentaRol) {
        return res.status(404).json({ error: 'Cuenta rol no encontrada' });
      }

      const cuentaRolActivada = await CuentasRolModel.activar(id);

      res.json({
        message: 'Cuenta rol activada',
        data: cuentaRolActivada
      });
    } catch (error) {
      console.error('Error en activar:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default CuentasRolController;