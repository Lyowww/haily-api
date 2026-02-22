import { Injectable } from '@nestjs/common';
// import { ConfigService as NestConfigService } from '@nestjs/config';
import { Env, envSchema } from './env.schema';

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor(
    // private nestConfigService: NestConfigService
  ) {
    // Validate environment variables on startup
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      console.error('❌ Environment validation failed:');
      errors.forEach((err) => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }

    this.env = result.data;
  }

  get<T extends keyof Env>(key: T): Env[T] {
    return this.env[key];
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get port(): Env['PORT'] {
    return this.env.PORT;
  }

  get corsOrigins(): string[] {
    const raw = this.env.CORS_ORIGINS;
    if (!raw) {
      return this.isDevelopment ? ['http://localhost:8081', 'http://localhost:19006'] : [];
    }
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  get databaseUrl(): Env['DATABASE_URL'] {
    return this.env.DATABASE_URL;
  }

  get isSqlite(): boolean {
    const url = this.env.DATABASE_URL;
    return (
      url.startsWith('./') ||
      url.startsWith('../') ||
      url.startsWith('/') ||
      url.endsWith('.sqlite') ||
      url.endsWith('.db') ||
      url.startsWith('sqlite://')
    );
  }

  get isPostgresql(): boolean {
    return this.env.DATABASE_URL.startsWith('postgresql://');
  }

  get isMysql(): boolean {
    return this.env.DATABASE_URL.startsWith('mysql://');
  }

  get redisUrl(): Env['REDIS_URL'] {
    return this.env.REDIS_URL;
  }

  get s3Endpoint(): Env['S3_ENDPOINT'] {
    return this.env.S3_ENDPOINT;
  }

  get s3Bucket(): Env['S3_BUCKET'] {
    return this.env.S3_BUCKET;
  }

  get s3AccessKey(): Env['S3_ACCESS_KEY'] {
    return this.env.S3_ACCESS_KEY;
  }

  get s3SecretKey(): Env['S3_SECRET_KEY'] {
    return this.env.S3_SECRET_KEY;
  }

  get openAiApiKey(): Env['OPENAI_API_KEY'] {
    return this.env.OPENAI_API_KEY;
  }

  get jwtSecret(): Env['JWT_SECRET'] {
    return this.env.JWT_SECRET;
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}

