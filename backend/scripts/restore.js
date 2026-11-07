const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const backupPath = args[0] && !args[0].startsWith('--') ? path.resolve(args[0]) : null;
const confirmed = args.includes('--confirm');
if (!backupPath || args.length !== 2 || !confirmed) {
  console.error('Usage: npm run db:restore -- <file.dump> --confirm');
  console.error('WARNING: this replaces objects in the target database.');
  process.exit(1);
}
if (!fs.existsSync(backupPath) || !fs.statSync(backupPath).isFile()) {
  console.error(`Backup file not found: ${backupPath}`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_RESTORE !== 'true') {
  console.error('Production restore blocked. Set ALLOW_PRODUCTION_RESTORE=true only after an approved recovery procedure.');
  process.exit(1);
}

console.warn(`Restoring ${backupPath} into database "${process.env.DB_NAME}" on ${process.env.DB_HOST}.`);
console.warn('Existing objects with matching names will be dropped and recreated.');
const result = spawnSync('pg_restore', [
  '--exit-on-error',
  '--clean',
  '--if-exists',
  '--no-owner',
  '--no-acl',
  '--host', process.env.DB_HOST,
  '--port', process.env.DB_PORT || '5432',
  '--username', process.env.DB_USER,
  '--dbname', process.env.DB_NAME,
  backupPath,
], {
  stdio: 'inherit',
  env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' },
});

if (result.error || result.status !== 0) {
  console.error(result.error?.message || 'pg_restore failed.');
  process.exit(result.status || 1);
}
console.log('Database restore completed.');
