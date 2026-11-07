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
const outputIndex = args.indexOf('--output');
if (args.length && (outputIndex !== 0 || args.length !== 2 || !args[1])) {
  console.error('Usage: npm run db:backup -- [--output <file.dump>]');
  process.exit(1);
}

const output = path.resolve(
  outputIndex === 0
    ? args[1]
    : path.join('backups', `civictrack-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`),
);
if (fs.existsSync(output)) {
  console.error(`Refusing to overwrite existing backup: ${output}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync('pg_dump', [
  '--format=custom',
  '--no-owner',
  '--no-acl',
  '--host', process.env.DB_HOST,
  '--port', process.env.DB_PORT || '5432',
  '--username', process.env.DB_USER,
  '--file', output,
  process.env.DB_NAME,
], {
  stdio: 'inherit',
  env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' },
});

if (result.error || result.status !== 0) {
  fs.rmSync(output, { force: true });
  console.error(result.error?.message || 'pg_dump failed; incomplete backup removed.');
  process.exit(result.status || 1);
}

console.log(`Backup created: ${output}`);
