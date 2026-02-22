import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  app.use(helmet());

  // Enable CORS with explicit origin allow-list
  const allowedOrigins = configService.corsOrigins;
  app.enableCors({
    origin: (origin, callback) => {
      // Allow mobile/native clients and same-origin requests without Origin header.
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

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve uploaded files statically (before API prefix).
  const express = require('express');
  const { getUploadsRoot } = require('./utils/uploads-path');
  app.use('/uploads', express.static(getUploadsRoot()));

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Outfit API')
    .setDescription('API for AI Outfit Generator mobile application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.port;
  await app.listen(port);

  console.log(`🚀 AI Outfit API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.nodeEnv}`);
}

bootstrap();

