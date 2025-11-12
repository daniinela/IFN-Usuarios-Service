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
}
export default PrivilegiosController;