// usuarios-service/routes/usuariosRoutes.js
import express from 'express';
import UsuariosController from '../controllers/usuariosController.js';
import { verificarToken, verificarAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===== RUTAS PÚBLICAS (sin autenticación) =====
router.post('/login', UsuariosController.login);
router.post('/', UsuariosController.create);
router.post('/confirmar-email/:userId', UsuariosController.confirmarEmail);

// ✅ Ruta para verificar email (necesaria para el registro)
router.get('/email/:email', UsuariosController.getByEmail);

// ===== RUTAS PROTEGIDAS (requieren token) =====
router.get('/', verificarToken, UsuariosController.getAll);
router.get('/:id', verificarToken, UsuariosController.getById);
router.put('/:id', verificarToken, UsuariosController.update);
router.put('/:id/password', verificarToken, UsuariosController.changePassword);
router.get('/rol/:rol', verificarToken, UsuariosController.getByRol);

// ===== RUTAS SOLO ADMIN (requieren token + rol admin) =====
router.post('/invite', verificarToken, verificarAdmin, UsuariosController.inviteUser);
router.delete('/:id', verificarToken, verificarAdmin, UsuariosController.delete);

export default router;