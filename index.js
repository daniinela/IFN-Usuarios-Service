// index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import usuariosRoutes from './routes/usuariosRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/usuarios', usuariosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Usuarios service running', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Usuarios service running on port ${PORT}`);
});