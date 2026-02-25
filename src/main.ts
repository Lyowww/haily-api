import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import helmet from 'helmet';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // required for Stripe webhook signature verification
  });

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

  // Serve Swagger UI HTML that loads CSS/JS from CDN so static assets work on Vercel (no 404/MIME issues).
  // This route is registered first so it overrides the default Swagger UI page; init script and JSON are still served by Swagger below.
  const SWAGGER_UI_CDN = 'https://unpkg.com/swagger-ui-dist@5.11.0';
  const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI – AI Outfit API</title>
  <link rel="stylesheet" type="text/css" href="${SWAGGER_UI_CDN}/swagger-ui.css">
  <link rel="icon" type="image/png" href="${SWAGGER_UI_CDN}/favicon-32x32.png" sizes="32x32">
  <link rel="icon" type="image/png" href="${SWAGGER_UI_CDN}/favicon-16x16.png" sizes="16x16">
  <style>html{box-sizing:border-box;overflow:auto}*,*:before,*:after{box-sizing:inherit}body{margin:0;background:#fafafa}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="${SWAGGER_UI_CDN}/swagger-ui-bundle.js"></script>
<script src="${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js"></script>
<script src="/api/docs/swagger-ui-init.js"></script>
</body>
</html>`;

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();
  expressApp.get('/api/docs', (_req: any, res: any) => {
    res.type('text/html');
    res.send(swaggerHtml);
  });

  // Swagger still serves /api/docs/swagger-ui-init.js and /api/docs-json; static assets are not used (we use CDN above).
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    jsonDocumentUrl: '/api/docs-json',
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
