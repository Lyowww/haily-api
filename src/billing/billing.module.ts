import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageCronService } from './usage-cron.service';
import { SubscriptionGuard } from './subscription.guard';
import { ConfigModule } from '../config';
import { PrismaModule } from '../prisma';

@Module({
  imports: [ConfigModule, PrismaModule, ScheduleModule],
  controllers: [BillingController],
  providers: [BillingService, UsageCronService, SubscriptionGuard],
  exports: [BillingService, SubscriptionGuard],
})
export class BillingModule {}
