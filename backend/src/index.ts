import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';

import apiRoutes from './routes/api.js';
import statsRoutes from './routes/stats.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpecs } from './docs/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =====================================================
// MIDDLEWARES
// =====================================================

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições', message: 'Tente novamente em 15 minutos' },
});
app.use(limiter);

// =====================================================
// ROTAS
// =====================================================

app.use('/api', apiKeyMiddleware);
app.use('/api', apiRoutes);
app.use('/api/stats', statsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: `.swagger-ui .topbar { display: none }.swagger-ui .info .title { font-size: 2.5em; }`,
  customSiteTitle: 'API Desafio NexusSaude - Documentação',
}));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API funcionando', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// =====================================================
// SERVER COM GRACEFUL SHUTDOWN
// =====================================================

function log(level: 'info' | 'error' | 'warn', message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...meta };
  
  if (NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    const colors = { info: '\x1b[36m', error: '\x1b[31m', warn: '\x1b[33m', reset: '\x1b[0m' };
    console.log(`${colors[level]}${message}${colors.reset}`, meta ? JSON.stringify(meta, null, 2) : '');
  }
}

const server = app.listen(PORT, () => {
  const box = `
╔═══════════════════════════════════════════════════════════╗
║  Servidor inicializado com sucesso!                       ║
║                                                           ║
║  📡 API:        http://localhost:${PORT}/api               ║
║  📚 Swagger:    http://localhost:${PORT}/api-docs          ║
║  ❤️  Health:    http://localhost:${PORT}/health             ║
║  🔑 API Key:   X-API-Key (header)                        ║
║  📦 Ambiente:  ${NODE_ENV.toUpperCase().padEnd(35)}║
╚═══════════════════════════════════════════════════════════╝`;
  console.log(box);
  log('info', 'Servidor started', { port: PORT, env: NODE_ENV });
});

function shutdown(signal: string) {
  log('info', `Recebido ${signal}, encerrando...`);
  server.close(() => {
    log('info', 'Servidor encerrado');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  log('error', 'Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('error', 'Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});

export default app;