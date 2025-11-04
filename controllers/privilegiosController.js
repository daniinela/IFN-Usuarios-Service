// usuarios-service/controllers/privilegiosController.js
import PrivilegiosModel from '../models/privilegiosModel.js';

class PrivilegiosController {
  
  // Obtener todos los privilegios
  static async getAll(req, res) {
    try {
      const privilegios = await PrivilegiosModel.getAll();
      res.json(privilegios);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }
  // Obtener privilegios por categoría
  static async getByCategoria(req, res) {
    try {
      const { categoria } = req.params;
      
      const categoriasValidas = ['conglomerados', 'brigadas', 'brigadistas', 'usuarios', 'sistema'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ 
          error: 'Categoría inválida. Debe ser: conglomerados, brigadas, brigadistas, usuarios o sistema' 
        });
      }

      const privilegios = await PrivilegiosModel.getByCategoria(categoria);
      res.json(privilegios);
    } catch (error) {
      console.error('Error en getByCategoria:', error);
      res.status(500).json({ error: error.message });
    }
  }
  // Obtener privilegios agrupados por categoría
  static async getAgrupados(req, res) {
    try {
      const privilegios = await PrivilegiosModel.getAll();
      // Agrupar por categoría
      const agrupados = privilegios.reduce((acc, priv) => {
        if (!acc[priv.categoria]) {
          acc[priv.categoria] = [];
        }
        acc[priv.categoria].push(priv);
        return acc;
      }, {});
      res.json(agrupados);
    } catch (error) {
      console.error('Error en getAgrupados:', error);
      res.status(500).json({ error: error.message });
    }
  }
  // Crear privilegio (solo super_admin)
  static async create(req, res) {
    try {
      const { codigo, nombre, categoria, descripcion } = req.body;
      const creado_por = req.user?.id; // Del middleware de autenticación
      // Validar campos requeridos
      if (!codigo || !nombre || !categoria) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: codigo, nombre, categoria' 
        });
      }
      // Validar categoría
      const categoriasValidas = ['conglomerados', 'brigadas', 'brigadistas', 'usuarios', 'sistema'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ 
          error: 'Categoría inválida. Debe ser: conglomerados, brigadas, brigadistas, usuarios o sistema' 
        });
      }

      const nuevoPrivilegio = await PrivilegiosModel.create({
        codigo,
        nombre,
        categoria,
        descripcion: descripcion || null,
        creado_por
      });
      res.status(201).json(nuevoPrivilegio);
    } catch (error) {
      console.error('Error en create:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Código de privilegio ya existe' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}
export default PrivilegiosController;