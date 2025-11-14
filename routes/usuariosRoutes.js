// usuarios-service/routes/usuariosRoutes.js
import express from 'express';
import UsuariosController from '../controllers/usuariosController.js';
import RolesController from '../controllers/rolesController.js';
import CuentasRolController from '../controllers/cuentasRolController.js';
import { 
  verificarToken, 
  verificarGestorRecursos,
  verificarCoordIFN
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

router.post('/login', UsuariosController.login);
router.post('/', UsuariosController.create);
router.get('/email/:email', UsuariosController.getByEmail);

// ============================================
// RUTAS PROTEGIDAS - USUARIOS
// ============================================

router.get('/', verificarToken, UsuariosController.getAll);
router.get('/:id', verificarToken, UsuariosController.getById);
router.put('/:id', verificarToken, UsuariosController.update);
router.delete('/:id', verificarToken, verificarCoordIFN, UsuariosController.delete);

// ============================================
// RUTAS APROBACIÓN - GESTOR DE RECURSOS
// ============================================

router.get('/pendientes/lista', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.getPendientes
);

router.post('/:id/aprobar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.aprobar
);

router.post('/:id/rechazar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.rechazar
);

// ============================================
// RUTAS - ROLES (solo lectura)
// ============================================

router.get('/roles/all', verificarToken, RolesController.getAll);
router.get('/roles/:id', verificarToken, RolesController.getById);
router.get('/roles/codigo/:codigo', verificarToken, RolesController.getByCodigo);
router.get('/roles/nivel/:nivel', verificarToken, RolesController.getByNivel);

// ============================================
// RUTAS - CUENTAS ROL
// ============================================

router.get('/cuentas-rol/filtros', 
  verificarToken, 
  CuentasRolController.getByFiltros
);

router.get('/cuentas-rol/usuario/:usuario_id', 
  verificarToken, 
  CuentasRolController.getByUsuarioId
);

router.post('/cuentas-rol', 
  verificarToken, 
  verificarCoordIFN, 
  CuentasRolController.create
);

router.patch('/cuentas-rol/:id/desactivar', 
  verificarToken, 
  verificarCoordIFN, 
  CuentasRolController.desactivar
);

router.patch('/cuentas-rol/:id/activar', 
  verificarToken, 
  verificarCoordIFN, 
  CuentasRolController.activar
);

export default router;