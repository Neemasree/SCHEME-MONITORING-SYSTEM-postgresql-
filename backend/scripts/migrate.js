const fs = require('node:fs');
const path = require('node:path');
const { sequelize } = require('../config/db');

// Register all current models so the first migration can bootstrap a fresh DB.
// Existing tables are not dropped or altered by this non-destructive sync.
require('../models');

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationDirectory = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationDirectory)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const name of migrationFiles) {
      const [rows] = await sequelize.query(
        'SELECT name FROM "SequelizeMeta" WHERE name = $1',
        { bind: [name] },
      );
      if (rows.length > 0) {
        console.log(`Skipping already-applied migration: ${name}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationDirectory, name), 'utf8');
      await sequelize.transaction(async (transaction) => {
        await sequelize.query(sql, { transaction });
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" ("name") VALUES ($1)',
          { bind: [name], transaction },
        );
      });
      console.log(`Applied migration: ${name}`);
    }

    console.log('Database migrations completed.');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runMigrations();
