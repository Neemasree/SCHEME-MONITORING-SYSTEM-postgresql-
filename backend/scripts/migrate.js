const fs = require('node:fs');
const path = require('node:path');
const { sequelize } = require('../config/db');

// A transaction-scoped advisory lock prevents two deploy instances from
// applying the same pending migration concurrently. The lock is released
// automatically on commit or rollback, including when the process crashes.
const MIGRATION_LOCK_NAMESPACE = 20261011;
const MIGRATION_LOCK_ID = 1;

const runMigrations = async () => {
  try {
    await sequelize.authenticate();

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        'SELECT pg_advisory_xact_lock($1, $2)',
        {
          bind: [MIGRATION_LOCK_NAMESPACE, MIGRATION_LOCK_ID],
          transaction,
        },
      );

      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
          "name" VARCHAR(255) PRIMARY KEY,
          "executedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `, { transaction });

      const migrationDirectory = path.join(__dirname, '..', 'migrations');
      const migrationFiles = fs.readdirSync(migrationDirectory)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const name of migrationFiles) {
        const [rows] = await sequelize.query(
          'SELECT name FROM "SequelizeMeta" WHERE name = $1',
          { bind: [name], transaction },
        );
        if (rows.length > 0) {
          console.log(`Skipping already-applied migration: ${name}`);
          continue;
        }

        const sql = fs.readFileSync(path.join(migrationDirectory, name), 'utf8');
        await sequelize.query(sql, { transaction });
        await sequelize.query(
          'INSERT INTO "SequelizeMeta" ("name") VALUES ($1)',
          { bind: [name], transaction },
        );
        console.log(`Applied migration: ${name}`);
      }
    });

    console.log('Database migrations completed.');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runMigrations();
