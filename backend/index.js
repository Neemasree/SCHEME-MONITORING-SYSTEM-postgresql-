const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { authenticate, allowRoles } = require('./middleware/authMiddleware');

// Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
    : 'http://localhost:5173',
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

// All existing API groups require a valid user token. Basic mutation role
// restrictions are applied here; application-specific transition checks still
// belong inside the workflow route/controller before production use.
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
  res.send('Government Monitoring System API is running.');
});

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('API startup failed:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
