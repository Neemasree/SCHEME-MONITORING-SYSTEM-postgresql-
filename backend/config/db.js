const { Sequelize } = require('sequelize');
const { env } = require('./env');

const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    host: env.DB_HOST,
    dialect: 'postgres',
    port: env.DB_PORT,
    logging: env.SQL_LOGGING === 'true' ? console.log : false,
    ...(env.NODE_ENV === 'production'
      ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: true } } }
      : {}),
    pool: {
      max: env.DB_POOL_MAX,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const connectDB = async () => {
  await sequelize.authenticate();

  const requiredColumns = {
    Users: ['isActive'],
    Applications: ['beneficiaryUserId'],
    Notifications: ['userId'],
    AuditLogs: ['entityType', 'entityId', 'action', 'actorId', 'newStatus'],
  };
  const queryInterface = sequelize.getQueryInterface();

  for (const [table, columns] of Object.entries(requiredColumns)) {
    let description;
    try {
      description = await queryInterface.describeTable(table);
    } catch {
      throw new Error(
        `Database schema is missing required table "${table}". Run npm run migrate in the backend directory before starting the API.`,
      );
    }

    const missingColumns = columns.filter((column) => !description[column]);
    if (missingColumns.length > 0) {
      throw new Error(
        `Database table "${table}" is missing columns: ${missingColumns.join(', ')}. Run npm run migrate in the backend directory before starting the API.`,
      );
    }
  }

  console.log('PostgreSQL connected and required schema verified.');
};

module.exports = { sequelize, connectDB };
