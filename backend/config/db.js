const { Sequelize } = require('sequelize');
require('dotenv').config();

const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: Number(process.env.DB_PORT),
    logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
    pool: {
      max: Number(process.env.DB_POOL_MAX || 10),
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('PostgreSQL database connected successfully.');
};

module.exports = { sequelize, connectDB };
