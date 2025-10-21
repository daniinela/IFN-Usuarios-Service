import express from 'express';
import cors from 'cors';
import usuariosRoutes from './routes/usuariosRoutes.js';
import supabase from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// HEALTH CHECK MEJORADO
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.json({
      status: 'OK',
      service: 'usuarios-service',
      timestamp: new Date().toISOString(),
      database: 'connected',
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'usuarios-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// HEALTH CHECK SIMPLE (sin BD)
app.get('/health/simple', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'usuarios-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', usuariosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Usuarios Service ejecutándose en puerto ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});