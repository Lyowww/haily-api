import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma';
import { WeatherModule } from '../weather';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { FirebasePushService } from './firebase-push.service';

@Module({
  imports: [PrismaModule, WeatherModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler, FirebasePushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

