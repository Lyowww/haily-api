import { z } from 'zod';

export const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().optional(),

  // Database
  // SQLite: file path (e.g., ./database.sqlite or /absolute/path/database.sqlite)
  // PostgreSQL: postgresql://user:password@host:port/database
  // MySQL: mysql://user:password@host:port/database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (val) => {
        // Allow SQLite file paths (relative or absolute)
        if (
          val.startsWith('./') ||
          val.startsWith('../') ||
          val.startsWith('/') ||
          val.endsWith('.sqlite') ||
          val.endsWith('.db')
        ) {
          return true;
        }
        // Allow SQLite URL format
        if (val.startsWith('sqlite://')) {
          return true;
        }
        // Allow PostgreSQL/MySQL URL format
        if (val.startsWith('postgresql://') || val.startsWith('mysql://')) {
          return true;
        }
        return false;
      },
      {
        message:
          'DATABASE_URL must be a valid database connection string (SQLite file path, sqlite://, postgresql://, or mysql://)',
      },
    ),

  // Redis
  REDIS_URL: z.string().url().min(1, 'REDIS_URL is required'),

  // AWS S3 (optional for local dev; set all four on Vercel for persistent uploads)
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Mail (optional – for account verification, forgot password, etc.)
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().optional(),
  MAIL_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

