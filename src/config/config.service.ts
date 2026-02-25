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

  /** True when all S3 vars are set and not placeholders (use S3 for uploads, e.g. on Vercel). */
  get isS3Configured(): boolean {
    const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = this.env;
    const placeholder = /your-(access|secret)-key-here/i;
    return !!(
      S3_ENDPOINT &&
      S3_BUCKET &&
      S3_ACCESS_KEY &&
      S3_SECRET_KEY &&
      !placeholder.test(S3_ACCESS_KEY) &&
      !placeholder.test(S3_SECRET_KEY)
    );
  }

  /** Parse AWS region from S3_ENDPOINT (e.g. https://s3.eu-north-1.amazonaws.com -> eu-north-1). */
  get s3Region(): string {
    const endpoint = this.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
    try {
      const host = new URL(endpoint).hostname;
      const match = host.match(/^s3[.-]?([a-z0-9-]+)\.amazonaws\.com$/i) || host.match(/^s3\.([a-z0-9-]+)\.amazonaws\.com$/i);
      return match ? match[1] : 'us-east-1';
    } catch {
      return 'us-east-1';
    }
  }

  get openAiApiKey(): Env['OPENAI_API_KEY'] {
    return this.env.OPENAI_API_KEY;
  }

  get jwtSecret(): Env['JWT_SECRET'] {
    return this.env.JWT_SECRET;
  }

  get stripeSecretKey(): Env['STRIPE_SECRET_KEY'] {
    return this.env.STRIPE_SECRET_KEY;
  }

  get stripeWebhookSecret(): Env['STRIPE_WEBHOOK_SECRET'] {
    return this.env.STRIPE_WEBHOOK_SECRET;
  }

  get stripeSuccessUrl(): Env['STRIPE_SUCCESS_URL'] {
    return this.env.STRIPE_SUCCESS_URL;
  }

  get stripeCancelUrl(): Env['STRIPE_CANCEL_URL'] {
    return this.env.STRIPE_CANCEL_URL;
  }

  get stripeSuccessRedirect(): Env['STRIPE_SUCCESS_REDIRECT'] {
    return this.env.STRIPE_SUCCESS_REDIRECT;
  }

  get stripeCancelRedirect(): Env['STRIPE_CANCEL_REDIRECT'] {
    return this.env.STRIPE_CANCEL_REDIRECT;
  }

  get isStripeConfigured(): boolean {
    return !!(this.env.STRIPE_SECRET_KEY && this.env.STRIPE_SECRET_KEY.length > 0);
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

  /** Mail (optional). When set, emails are sent for verification, forgot password, etc. */
  get mailHost(): Env['MAIL_HOST'] {
    return this.env.MAIL_HOST;
  }
  get mailPort(): Env['MAIL_PORT'] {
    return this.env.MAIL_PORT;
  }
  get mailSecure(): boolean {
    return !!this.env.MAIL_SECURE;
  }
  get mailUser(): Env['MAIL_USER'] {
    return this.env.MAIL_USER;
  }
  get mailPassword(): Env['MAIL_PASSWORD'] {
    return this.env.MAIL_PASSWORD;
  }
  get mailFrom(): Env['MAIL_FROM'] {
    return this.env.MAIL_FROM;
  }
  get isMailConfigured(): boolean {
    return !!(this.env.MAIL_HOST && this.env.MAIL_PORT);
  }
}

