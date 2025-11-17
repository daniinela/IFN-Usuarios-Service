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

router.post('/usuarios/login', UsuariosController.login);
router.post('/usuarios', UsuariosController.create);

// ============================================
// RUTAS - ROLES (ANTES de las rutas genéricas)
// ============================================

router.get('/roles/all', verificarToken, RolesController.getAll);
router.get('/roles/nivel/:nivel', verificarToken, RolesController.getByNivel);
router.get('/roles/codigo/:codigo', verificarToken, RolesController.getByCodigo);
router.get('/roles/:id', verificarToken, RolesController.getById);

// ============================================
// RUTAS - CUENTAS ROL (ANTES de las rutas genéricas)
// ============================================

router.get('/cuentas-rol/filtros', 
  verificarToken, 
  CuentasRolController.getByFiltros
);

router.get('/cuentas-rol/usuario/:usuario_id', 
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

// ============================================
// RUTAS APROBACIÓN - GESTOR DE RECURSOS (ANTES de /:id)
// ============================================

router.get('/usuarios/pendientes', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.getPendientes
);

router.post('/usuarios/:id/aprobar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.aprobar
);

router.post('/usuarios/:id/rechazar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.rechazar
);

// ============================================
// RUTAS PROTEGIDAS - USUARIOS (al final por ser genéricas)
// ============================================

router.get('/usuarios/:id', UsuariosController.getById);
router.get('/usuarios', UsuariosController.getAll);
router.put('/usuarios/:id', UsuariosController.update);
router.patch('/usuarios/:id', UsuariosController.update);
router.delete('/usuarios/:id', UsuariosController.delete);

export default router;