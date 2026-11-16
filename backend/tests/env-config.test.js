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

const loadProductionConfig = (clientOrigin, extraEnvironment = {}) => spawnSync(
  process.execPath,
  ['-e', "require('./config/env')"],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, ...requiredEnvironment, CLIENT_ORIGIN: clientOrigin, ...extraEnvironment },
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

  test('accepts the Render private-database TLS setting while keeping TLS required', () => {
    const result = loadProductionConfig(
      'https://civictrack.example.com',
      { DB_SSL_REJECT_UNAUTHORIZED: 'false' },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('rejects an invalid PostgreSQL TLS verification setting', () => {
    const result = loadProductionConfig(
      'https://civictrack.example.com',
      { DB_SSL_REJECT_UNAUTHORIZED: 'sometimes' },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DB_SSL_REJECT_UNAUTHORIZED');
  });

  test.each([
    'http://civictrack.example.com',
    'https://civictrack.example.com/admin',
    'https://civictrack.example.com?redirect=https://attacker.example',
    'https://civictrack.example.com#fragment',
    'https://user@civictrack.example.com',
    'https://*.example.com',
    'https://api.*.example.com',
    'http://localhost:5173',
  ])('rejects an unsafe production origin: %s', (origin) => {
    const result = loadProductionConfig(origin);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CLIENT_ORIGIN');
  });
});
