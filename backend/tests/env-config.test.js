const { spawnSync } = require('node:child_process');

const requiredEnvironment = {
  NODE_ENV: 'production',
  DB_NAME: 'civictrack',
  DB_USER: 'civictrack',
  DB_PASSWORD: 'test-only-password',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  JWT_SECRET: 'test-only-jwt-secret-with-at-least-32-characters',
  SQL_LOGGING: 'false',
};

const loadProductionConfig = (clientOrigin) => spawnSync(
  process.execPath,
  ['-e', "require('./config/env')"],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...requiredEnvironment, CLIENT_ORIGIN: clientOrigin },
  },
);

describe('production environment validation', () => {
  test('accepts one exact HTTPS frontend origin', () => {
    const result = loadProductionConfig('https://civictrack.example.com');

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('accepts a comma-separated HTTPS origin allowlist', () => {
    const result = loadProductionConfig(
      'https://civictrack.example.com,https://admin.civictrack.example.com',
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test.each([
    'http://civictrack.example.com',
    'https://civictrack.example.com/admin',
    'https://*.example.com',
    'http://localhost:5173',
  ])('rejects an unsafe production origin: %s', (origin) => {
    const result = loadProductionConfig(origin);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CLIENT_ORIGIN');
  });
});
