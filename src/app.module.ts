import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { UploadModule } from './upload';
import { AIModule } from './ai';
import { WardrobeModule } from './wardrobe/wardrobe.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OutfitModule } from './outfit/outfit.module';
import { JwtAuthGuard } from './auth';
import { NotificationsModule } from './notifications';
import { HelpCenterModule } from './help-center';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UploadModule,
    OutfitModule,
    AIModule,
    WardrobeModule,
    NotificationsModule,
    HelpCenterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

