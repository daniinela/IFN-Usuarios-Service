// usuarios-service/routes/usuariosRoutes.js
import express from 'express';
import UsuariosController from '../controllers/usuariosController.js';
import RolesController from '../controllers/rolesController.js';
import CuentasRolController from '../controllers/cuentasRolController.js';
import PrivilegiosController from '../controllers/privilegiosController.js';
import RolesPrivilegiosController from '../controllers/rolesPrivilegiosController.js';
import { verificarToken, verificarSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.post('/login', UsuariosController.login);
router.post('/', UsuariosController.create);
router.post('/confirmar-email/:userId', UsuariosController.confirmarEmail);
router.get('/email/:email', UsuariosController.getByEmail);

// ============================================
// RUTAS PROTEGIDAS - USUARIOS
// ============================================
router.get('/', verificarToken, UsuariosController.getAll);
router.get('/:id', verificarToken, UsuariosController.getById);
router.get('/:id/privilegios', verificarToken, UsuariosController.getPrivilegios);
router.put('/:id', verificarToken, UsuariosController.update);
router.put('/:id/password', verificarToken, UsuariosController.changePassword);

// RUTAS SOLO SUPER ADMIN - USUARIOS
router.post('/invite', verificarToken, verificarSuperAdmin, UsuariosController.inviteUser);
router.delete('/:id', verificarToken, verificarSuperAdmin, UsuariosController.delete);

// ============================================
// RUTAS PROTEGIDAS - ROLES (solo lectura)
// ============================================
router.get('/roles/all', verificarToken, RolesController.getAll);
router.get('/roles/:id', verificarToken, RolesController.getById);
router.get('/roles/codigo/:codigo', verificarToken, RolesController.getByCodigo);
router.get('/roles/:id/privilegios', verificarToken, RolesController.getPrivilegios);

// ============================================
// RUTAS PROTEGIDAS - CUENTAS ROL
// ============================================
router.get('/cuentas-rol', verificarToken, CuentasRolController.getByFiltros);
router.get('/cuentas-rol/usuario/:usuario_id', verificarToken, CuentasRolController.getByUsuarioId);
router.get('/cuentas-rol/verificar/:usuario_id/:codigo_rol', verificarToken, CuentasRolController.verificarRol);

// RUTAS SOLO SUPER ADMIN - CUENTAS ROL
router.post('/cuentas-rol', verificarToken, verificarSuperAdmin, CuentasRolController.create);
router.patch('/cuentas-rol/:id/desactivar', verificarToken, verificarSuperAdmin, CuentasRolController.desactivar);
router.patch('/cuentas-rol/:id/activar', verificarToken, verificarSuperAdmin, CuentasRolController.activar);

// ============================================
// RUTAS PROTEGIDAS - PRIVILEGIOS (solo lectura)
// ============================================
router.get('/privilegios/all', verificarToken, PrivilegiosController.getAll);
router.get('/privilegios/categoria/:categoria', verificarToken, PrivilegiosController.getByCategoria);
router.get('/privilegios/agrupados', verificarToken, PrivilegiosController.getAgrupados);


// ============================================
// RUTAS PROTEGIDAS - ROLES PRIVILEGIOS
// ============================================
router.get('/roles-privilegios/rol/:rol_id', verificarToken, RolesPrivilegiosController.getByRolId);

// RUTAS SOLO SUPER ADMIN - ROLES PRIVILEGIOS
router.post('/roles-privilegios/asignar', verificarToken, verificarSuperAdmin, RolesPrivilegiosController.asignar);
router.post('/roles-privilegios/asignar-multiples', verificarToken, verificarSuperAdmin, RolesPrivilegiosController.asignarMultiples);
router.delete('/roles-privilegios/:rol_id/:privilegio_id', verificarToken, verificarSuperAdmin, RolesPrivilegiosController.remover);
router.put('/roles-privilegios/rol/:rol_id/reemplazar', verificarToken, verificarSuperAdmin, RolesPrivilegiosController.reemplazar);

export default router;