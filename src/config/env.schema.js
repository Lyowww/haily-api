"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
var zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    // Server
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    CORS_ORIGINS: zod_1.z.string().optional(),
    // Database
    // SQLite: file path (e.g., ./database.sqlite or /absolute/path/database.sqlite)
    // PostgreSQL: postgresql://user:password@host:port/database
    // MySQL: mysql://user:password@host:port/database
    DATABASE_URL: zod_1.z
        .string()
        .min(1, 'DATABASE_URL is required')
        .refine(function (val) {
        // Allow SQLite file paths (relative or absolute)
        if (val.startsWith('./') ||
            val.startsWith('../') ||
            val.startsWith('/') ||
            val.endsWith('.sqlite') ||
            val.endsWith('.db')) {
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
    }, {
        message: 'DATABASE_URL must be a valid database connection string (SQLite file path, sqlite://, postgresql://, or mysql://)',
    }),
    // Redis
    REDIS_URL: zod_1.z.string().url().min(1, 'REDIS_URL is required'),
    // AWS S3
    S3_ENDPOINT: zod_1.z.string().url().min(1, 'S3_ENDPOINT is required'),
    S3_BUCKET: zod_1.z.string().min(1, 'S3_BUCKET is required'),
    S3_ACCESS_KEY: zod_1.z.string().min(1, 'S3_ACCESS_KEY is required'),
    S3_SECRET_KEY: zod_1.z.string().min(1, 'S3_SECRET_KEY is required'),
    // OpenAI
    OPENAI_API_KEY: zod_1.z.string().min(1, 'OPENAI_API_KEY is required'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});
