const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const crypto = require('node:crypto');
const { env } = require('./config/env');
const { sequelize, connectDB } = require('./config/db');
const { authenticate, allowRoles } = require('./middleware/authMiddleware');
const { writeLimiter } = require('./middleware/rateLimiters');
const openapiSpec = require('./docs/openapi');

// Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
app.disable('x-powered-by');

morgan.token('request-id', (req) => req.id);
app.use((req, res, next) => {
  req.id = req.get('x-request-id')?.slice(0, 100) || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);

  // Normalize errors from legacy route-level handlers as well as thrown errors.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      const codeByStatus = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'VALIDATION_ERROR',
        429: 'RATE_LIMITED',
      };
      return originalJson({
        ...body,
        message: body.message || 'The request could not be completed',
        code: body.code || codeByStatus[res.statusCode] || 'REQUEST_ERROR',
        requestId: body.requestId || req.id,
      });
    }
    return originalJson(body);
  };
  next();
});
app.use(morgan(':request-id :method :url :status :response-time ms'));
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
}));
app.use(express.json({ limit: '1mb' }));
app.use(writeLimiter);

app.use('/api/docs', (req, res, next) => {
  // Swagger UI uses inline bootstrap scripts; relax CSP only for this static docs page.
  res.removeHeader('Content-Security-Policy');
  next();
}, swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get('/health', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'ok', requestId: req.id });
  } catch {
    return res.status(503).json({
      message: 'Database health check failed',
      code: 'DATABASE_UNAVAILABLE',
      requestId: req.id,
    });
  }
});

app.use('/api/auth', authRoutes);

// All API groups require a valid user token. Route-specific checks enforce
// application workflow stages and administrator-only scheme mutations.
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/schemes', authenticate, (req, res, next) => {
  if (req.method === 'POST') return allowRoles('admin')(req, res, next);
  if (req.method !== 'GET') return allowRoles('admin')(req, res, next);
  return next();
}, schemeRoutes);
app.use('/api/applications', authenticate, (req, res, next) => {
  if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    return allowRoles('admin', 'district_officer', 'field_officer')(req, res, next);
  }
  return next();
}, applicationRoutes);
app.use('/api/performance', authenticate, performanceRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'CivicTrack API is running', code: 'API_READY' });
});

app.use((req, res) => {
  res.status(404).json({
    message: 'The requested endpoint was not found',
    code: 'NOT_FOUND',
    requestId: req.id,
  });
});

// Express error middleware must keep the four-argument signature. Never return
// error.stack or internal database details to clients.
app.use((error, req, res, _next) => {
  if (res.headersSent) return;
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  if (status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      requestId: req.id,
      message: error.message || 'Unhandled server error',
    }));
  }
  return res.status(status).json({
    message: status >= 500 ? 'An unexpected server error occurred' : (error.message || 'Request failed'),
    code: error.code || (status === 404 ? 'NOT_FOUND' : status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    requestId: req.id,
  });
});

let server;
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  const closeDatabase = () => sequelize.close()
    .catch((error) => console.error('Database shutdown failed:', error))
    .finally(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });

  if (server) {
    server.close(() => { closeDatabase(); });
    server.closeIdleConnections?.();
  } else {
    closeDatabase();
  }
};

const start = async () => {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      console.log(`CivicTrack API listening on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('API startup failed:', error.message);
    process.exitCode = 1;
    await sequelize.close().catch(() => {});
  }
};

if (require.main === module) {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  start();
}

module.exports = app;
