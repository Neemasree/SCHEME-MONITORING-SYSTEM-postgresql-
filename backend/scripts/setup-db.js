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
    await client.connect();
    console.log('Connected to PostgreSQL.');

    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${process.env.DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Database "${process.env.DB_NAME}" not found. Creating...`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
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
