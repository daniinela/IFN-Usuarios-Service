// usuarios-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import CuentasRolModel from '../models/cuentasRolModel.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando Supabase config (usuarios-service):');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseKey ? '✅' : '❌');

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Verificar token
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

    // ✅ Adjuntar usuario al request
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return res.status(401).json({ error: 'Error al verificar autenticación' });
  }
}

// ✅ Verificar Super Admin
export async function verificarSuperAdmin(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // ✅ Verificar si tiene rol super_admin en cuentas_rol
    const esSuperAdmin = await CuentasRolModel.tieneRol(userId, 'super_admin');

    if (!esSuperAdmin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Super Administrador' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en verificarSuperAdmin:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}

// ✅ Verificar Admin Regional (o Super Admin)
export async function verificarAdminRegional(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // ✅ Verificar si tiene rol admin_regional O super_admin
    const esAdminRegional = await CuentasRolModel.tieneRol(userId, 'admin_regional');
    const esSuperAdmin = await CuentasRolModel.tieneRol(userId, 'super_admin');

    if (!esAdminRegional && !esSuperAdmin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Administrador' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en verificarAdminRegional:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}

// ✅ Verificar Brigadista (o Admin)
export async function verificarBrigadista(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // ✅ Verificar si tiene rol brigadista, admin_regional O super_admin
    const esBrigadista = await CuentasRolModel.tieneRol(userId, 'brigadista');
    const esAdminRegional = await CuentasRolModel.tieneRol(userId, 'admin_regional');
    const esSuperAdmin = await CuentasRolModel.tieneRol(userId, 'super_admin');

    if (!esBrigadista && !esAdminRegional && !esSuperAdmin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Brigadista o superior' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en verificarBrigadista:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
}

// ✅ NUEVO: Verificar privilegio específico
export function verificarPrivilegio(codigoPrivilegio) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // ✅ Obtener privilegios del usuario
      const UsuariosModel = (await import('../models/usuariosModel.js')).default;
      const privilegios = await UsuariosModel.getPrivilegiosByUsuarioId(userId);
      
      const tienePrivilegio = privilegios.some(p => p.codigo === codigoPrivilegio);

      if (!tienePrivilegio) {
        return res.status(403).json({ 
          error: `Acceso denegado. Se requiere el privilegio: ${codigoPrivilegio}` 
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error en verificarPrivilegio:', error);
      res.status(500).json({ error: 'Error al verificar privilegios' });
    }
  };
}