const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');

// Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Hello World
app.get('/', (req, res) => {
  res.send('Government Monitoring System API is running...');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
