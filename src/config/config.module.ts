import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as path from 'path';
import { ConfigService } from './config.service';
import { envSchema } from './env.schema';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Support starting the API from either:
      // - /apps/api (common when developing the API directly)
      // - repo root (common in monorepos / tooling)
      envFilePath: [
        path.resolve(process.cwd(), 'apps/api/.env.local'),
        path.resolve(process.cwd(), 'apps/api/.env'),
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
      ],
      validate: (config) => {
        const result = envSchema.safeParse(config);
        if (!result.success) {
          throw new Error(
            `Environment validation failed: ${result.error.errors
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join(', ')}`,
          );
        }
        return result.data;
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}





