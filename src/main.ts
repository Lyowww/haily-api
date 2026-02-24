import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import helmet from 'helmet';
import type { INestApplication } from '@nestjs/common';

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = configService.corsOrigins;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.length === 0 && !configService.isProduction) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  try {
    const path = require('path');
    const uploadsRoot =
      process.env.VERCEL === '1'
        ? path.join('/tmp', 'uploads')
        : path.join(process.cwd(), 'uploads');
    const express = require('express');
    app.use('/uploads', express.static(uploadsRoot));
  } catch (e) {
    console.warn('Static uploads mount skipped:', (e as Error)?.message);
  }

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Outfit API')
    .setDescription('API for AI Outfit Generator mobile application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Use 'docs' so with global prefix 'api' the UI is at /api/docs and assets at /api/docs/* load correctly
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  return app;
}

/** Run as a long-lived server (local, PM2, etc.) */
async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const port = configService.port;
  await app.listen(port);
  console.log(`🚀 AI Outfit API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs at: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.nodeEnv}`);
}

// Vercel serverless: export a handler so the platform can invoke it per request.
let cachedApp: INestApplication | null = null;

async function getApp(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;
  cachedApp = await createApp();
  await cachedApp.init();
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

// When not on Vercel, run the normal server.
if (process.env.VERCEL !== '1') {
  bootstrap().catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
  });
}
