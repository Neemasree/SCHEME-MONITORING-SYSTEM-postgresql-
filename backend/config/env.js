require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DB_NAME: z.string().trim().min(1),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().trim().min(1).default('2h'),
  CLIENT_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  SQL_LOGGING: z.enum(['true', 'false']).default('false'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') return;

  const origins = config.CLIENT_ORIGIN.split(',').map((origin) => origin.trim());
  for (const origin of origins) {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CLIENT_ORIGIN'],
        message: 'production CLIENT_ORIGIN must contain valid HTTPS origins',
      });
      continue;
    }

    if (
      parsedOrigin.protocol !== 'https:' ||
      parsedOrigin.origin !== origin ||
      parsedOrigin.hostname === 'localhost' ||
      parsedOrigin.hostname.endsWith('.localhost')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CLIENT_ORIGIN'],
        message: 'each production CLIENT_ORIGIN must be an exact HTTPS origin (no paths, wildcards, or localhost)',
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\\n');
  throw new Error(`Invalid environment configuration:\\n${details}`);
}

module.exports = { env: parsed.data };
