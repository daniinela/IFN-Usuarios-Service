// usuarios-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import CuentasRolModel from '../models/cuentasRolModel.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verificando Supabase config (usuarios-service):');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseKey ? '✅' : '❌');

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ error: 'Error de autenticación' });
  }
}

export async function verificarCoordIFN(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const tieneRol = await CuentasRolModel.tieneRol(userId, 'COORD_IFN');
    if (!tieneRol) {
      return res.status(403).json({ error: 'Se requiere rol COORD_IFN' });
    }

    next();
  } catch (error) {
    console.error('Error verificando COORD_IFN:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}

export async function verificarGestorRecursos(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const tieneRol = await CuentasRolModel.tieneRol(userId, 'GESTOR_RECURSOS');
    if (!tieneRol) {
      return res.status(403).json({ error: 'Se requiere rol GESTOR_RECURSOS' });
    }

    next();
  } catch (error) {
    console.error('Error verificando GESTOR_RECURSOS:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}

export async function verificarJefeBrigada(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const tieneRol = await CuentasRolModel.tieneRol(userId, 'JEFE_BRIGADA');
    if (!tieneRol) {
      return res.status(403).json({ error: 'Se requiere rol JEFE_BRIGADA' });
    }

    next();
  } catch (error) {
    console.error('Error verificando JEFE_BRIGADA:', error);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
}