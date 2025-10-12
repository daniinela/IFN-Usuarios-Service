// usuarios-service/config/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// verificacion temporal pq no me sirve esa joda
console.log('🔍 URL de Supabase:', supabaseUrl);
console.log('🔍 Primeros 20 caracteres de la key:', supabaseKey?.substring(0, 20));
console.log('🔍 Longitud de la key:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no encontradas');
  process.exit(1);
}

if (supabaseKey.length < 200) {
  console.error('⚠️ ADVERTENCIA: La SERVICE_ROLE_KEY parece muy corta. ¿Estás usando la ANON_KEY por error?');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Cliente de Supabase creado exitosamente');

export default supabase;