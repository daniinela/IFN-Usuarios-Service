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
// 🆕 RUTAS ESPECÍFICAS DE USUARIOS (ANTES de /:id)
// ============================================

// ✅ CORREGIDO: Agregar /usuarios al path
router.get('/usuarios/jefes-brigada-disponibles',
  verificarToken,
  UsuariosController.getJefesBrigadaDisponibles
);

// Pendientes de aprobación
router.get('/usuarios/pendientes', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.getPendientes
);

// Personal operacional únicamente
router.get('/usuarios/personal-operacional',
  verificarToken,
  verificarGestorRecursos,
  UsuariosController.getPersonalOperacional
);

// Invitar usuario
router.post('/usuarios/invite',
  verificarToken,
  verificarGestorRecursos,
  UsuariosController.inviteUser
);

// Buscar por email (también debe ir ANTES de /:id)
router.get('/usuarios/email/:email', 
  verificarToken,
  UsuariosController.getByEmail
);

// Aprobar usuario
router.post('/usuarios/:id/aprobar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.aprobar
);

// Rechazar usuario
router.post('/usuarios/:id/rechazar', 
  verificarToken, 
  verificarGestorRecursos, 
  UsuariosController.rechazar
);

// ============================================
// RUTAS PROTEGIDAS - USUARIOS (al final por ser genéricas)
// ============================================

router.get('/usuarios', UsuariosController.getAll);
router.get('/usuarios/:id', UsuariosController.getById);  // ← AL FINAL
router.put('/usuarios/:id', UsuariosController.update);
router.patch('/usuarios/:id', UsuariosController.update);
router.delete('/usuarios/:id', UsuariosController.delete);

export default router;