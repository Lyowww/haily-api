import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config';
import { PrismaModule } from './prisma';
import { EmailModule } from './email';
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
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    EmailModule,
    AuthModule,
    UploadModule,
    OutfitModule,
    AIModule,
    WardrobeModule,
    NotificationsModule,
    HelpCenterModule,
    BillingModule,
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

