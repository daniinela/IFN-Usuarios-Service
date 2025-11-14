// usuarios-service/controllers/usuariosController.js
import UsuariosModel from '../models/usuariosModel.js';
import CuentasRolModel from '../models/cuentasRolModel.js';
import RolesModel from '../models/rolesModel.js';
import supabase from '../config/database.js';

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
      const usuario = await UsuariosModel.getByEmail(req.params.email);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      console.error('Error en getByEmail:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { 
        id, email, cedula, nombre_completo, telefono,
        municipio_residencia, titulos, experiencia_laboral,
        disponibilidad, info_extra_calificaciones
      } = req.body;

      if (!id || !email || !cedula || !nombre_completo) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: id, email, cedula, nombre_completo'
        });
      }

      const emailExiste = await UsuariosModel.getByEmail(email);
      if (emailExiste) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }

      const cedulaExiste = await UsuariosModel.getByCedula(cedula);
      if (cedulaExiste) {
        return res.status(409).json({ error: 'Cédula ya registrada' });
      }

      const nuevoUsuario = await UsuariosModel.create({
        id, email, cedula, nombre_completo, telefono,
        municipio_residencia, titulos, experiencia_laboral,
        disponibilidad, info_extra_calificaciones
      });

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

      const existe = await UsuariosModel.getById(id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await UsuariosModel.softDelete(id, motivo || 'Eliminado');

      try {
        await supabase.auth.admin.deleteUser(id);
      } catch (authError) {
        console.error('⚠️ Error eliminando de Auth:', authError.message);
      }

      res.json({ message: 'Usuario desactivado' });
    } catch (error) {
      console.error('Error en delete:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // APROBACIÓN (Gestor de Recursos)
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
      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'Debe especificar al menos un rol' });
      }

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado_aprobacion !== 'pendiente') {
        return res.status(400).json({ 
          error: 'Solo se pueden aprobar usuarios pendientes'
        });
      }

      const usuarioAprobado = await UsuariosModel.aprobar(id);

      const rolesAsignados = [];
      for (const rolData of roles) {
        const cuentaRol = await CuentasRolModel.create({
          usuario_id: id,
          tipo_rol_id: rolData.tipo_rol_id,
          region_id: rolData.region_id || null,
          departamento_id: rolData.departamento_id || null,
          municipio_id: rolData.municipio_id || null
        });
        rolesAsignados.push(cuentaRol);
      }

      res.json({ 
        message: 'Usuario aprobado',
        usuario: usuarioAprobado,
        roles: rolesAsignados
      });
    } catch (error) {
      console.error('Error en aprobar:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({ error: 'Motivo requerido' });
      }

      const usuario = await UsuariosModel.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuario.estado_aprobacion !== 'pendiente') {
        return res.status(400).json({ error: 'Solo se pueden rechazar usuarios pendientes' });
      }

      const usuarioRechazado = await UsuariosModel.rechazar(id, motivo);
      res.json({ message: 'Usuario rechazado', usuario: usuarioRechazado });
    } catch (error) {
      console.error('Error en rechazar:', error);
      res.status(500).json({ error: error.message });
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
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!usuario.activo) {
        return res.status(403).json({ error: 'Usuario inactivo' });
      }

      if (usuario.estado_aprobacion !== 'aprobado') {
        return res.status(403).json({ error: 'Usuario no aprobado' });
      }

      const cuentasRol = await CuentasRolModel.getByUsuarioId(usuario.id);
      const rolesActivos = cuentasRol.filter(c => c.activo);

      res.json({ 
        user: {
          id: usuario.id,
          email: usuario.email,
          cedula: usuario.cedula,
          nombre_completo: usuario.nombre_completo,
          telefono: usuario.telefono
        },
        roles: rolesActivos
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default UsuariosController;