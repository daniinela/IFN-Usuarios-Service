//esto de aca es par verificar los tokens, la cosa es q 
//yo no la hago manual con la libreria jwt sino q utilizo supabase para esto
//ya q en supabase me autentica los usuarios y eso entonces me genera esos tokens alla
//entonces aca solo uso a supabase pa eso

// usuarios-service/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import CuentasRolModel from '../models/cuentasRolModel.js';


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // ← Correcto
);

console.log('🔍 Verificando Supabase config (usuarios-service):');
console.log('URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('ANON Key:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');

export async function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No se proporcionó token');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Verificando token...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Token inválido:', error?.message);
      return res.status(401).json({ 
        error: 'Token inválido',
        detalle: error?.message 
      });
    }

    console.log('✅ Usuario autenticado:', user.email);
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('❌ Error verificando token:', error);
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