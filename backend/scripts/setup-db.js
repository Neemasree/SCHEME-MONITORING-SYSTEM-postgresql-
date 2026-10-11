const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const createDatabase = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres', // Connect to default database first to create the new one
  });

  try {
    const databaseName = process.env.DB_NAME;
    if (!databaseName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
      throw new Error('DB_NAME must be a valid PostgreSQL identifier (letters, digits, underscores; not starting with a digit).');
    }
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (res.rowCount === 0) {
      console.log(`Database "${process.env.DB_NAME}" not found. Creating...`);
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Database "${process.env.DB_NAME}" created successfully!`);
    } else {
      console.log(`Database "${process.env.DB_NAME}" already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.stack);
  } finally {
    await client.end();
  }
};

createDatabase();
