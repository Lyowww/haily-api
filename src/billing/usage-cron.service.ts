import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from './billing.service';

/**
 * Resets usage counters at the start of each month.
 * Runs on the 1st of every month at 00:00 (default timezone).
 */
@Injectable()
export class UsageCronService {
  constructor(private readonly billingService: BillingService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetMonthlyUsage() {
    const now = new Date();
    const lastMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    const month =
      `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}`;
    const count = await this.billingService.resetUsageForMonth(month);
    if (count > 0) {
      console.log(`[Billing] Reset usage for month ${month}: ${count} records`);
    }
  }
}
