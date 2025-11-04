// usuarios-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando Supabase config (usuarios-service):');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseKey ? '✅' : '❌');

const supabase = createClient(supabaseUrl, supabaseKey);

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado: Token no proporcionado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Error validando token:', error.message);
      return res.status(401).json({
        error: 'Token inválido o expirado'
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = user.user_metadata?.rol || null;

    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return res.status(401).json({ error: 'Error al verificar autenticación' });
  }
}

export function verificarAdmin(req, res, next) {
  console.log('🔍 DEBUG verificarAdmin:');
  console.log('- req.user:', req.user);
  console.log('- req.user.user_metadata:', req.user.user_metadata);
  console.log('- req.userRole:', req.userRole);
  
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Solo administradores pueden realizar esta acción',
      debug: {
        rol_encontrado: req.userRole,
        user_metadata: req.user.user_metadata
      }
    });
  }

  next();
}

export function verificarSuperAdmin(req, res, next) {
  console.log('🔍 DEBUG verificarSuperAdmin:');
  console.log('- req.user:', req.user);
  console.log('- req.userRole:', req.userRole);
  
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.userRole !== 'super_admin') {
    return res.status(403).json({
      error: 'Solo super administradores pueden realizar esta acción',
      debug: {
        rol_encontrado: req.userRole,
        user_metadata: req.user.user_metadata
      }
    });
  }

  next();
}

export function verificarBrigadista(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.userRole !== 'brigadista' && req.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Solo brigadistas pueden realizar esta acción'
    });
  }

  next();
}